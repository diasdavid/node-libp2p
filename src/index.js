'use strict'

const { EventEmitter } = require('events')
const debug = require('debug')
const log = debug('libp2p')
log.error = debug('libp2p:error')

const PeerInfo = require('peer-info')
const multiaddr = require('multiaddr')

const peerRouting = require('./peer-routing')
const contentRouting = require('./content-routing')
const pubsub = require('./pubsub')
const { getPeerInfo, getPeerInfoRemote } = require('./get-peer-info')
const { validate: validateConfig } = require('./config')
const { codes } = require('./errors')

const Circuit = require('./circuit')
const Dialer = require('./dialer')
const Metrics = require('./metrics')
const TransportManager = require('./transport-manager')
const Upgrader = require('./upgrader')
const PeerStore = require('./peer-store')
const Registrar = require('./registrar')
const ping = require('./ping')
const {
  IdentifyService,
  multicodecs: IDENTIFY_PROTOCOLS
} = require('./identify')

/**
 * @fires Libp2p#error Emitted when an error occurs
 * @fires Libp2p#peer:connect Emitted when a peer is connected to this node
 * @fires Libp2p#peer:disconnect Emitted when a peer disconnects from this node
 * @fires Libp2p#peer:discovery Emitted when a peer is discovered
 */
class Libp2p extends EventEmitter {
  constructor (_options) {
    super()
    // validateConfig will ensure the config is correct,
    // and add default values where appropriate
    this._options = validateConfig(_options)

    this.datastore = this._options.datastore
    this.peerInfo = this._options.peerInfo
    this.peerStore = new PeerStore()

    this._modules = this._options.modules
    this._config = this._options.config
    this._transport = [] // Transport instances/references
    this._discovery = new Map() // Discovery service instances/references

    this.peerStore = new PeerStore()

    if (this._options.metrics.enabled) {
      this.metrics = new Metrics(this._options.metrics)
    }

    // Setup the Upgrader
    this.upgrader = new Upgrader({
      localPeer: this.peerInfo.id,
      metrics: this.metrics,
      onConnection: (connection) => {
        const peerInfo = this.peerStore.put(new PeerInfo(connection.remotePeer))
        this.registrar.onConnect(peerInfo, connection)
        this.emit('peer:connect', peerInfo)

        // Run identify for every connection
        if (this.identifyService) {
          this.identifyService.identify(connection, connection.remotePeer)
            .catch(log.error)
        }
      },
      onConnectionEnd: (connection) => {
        const peerInfo = getPeerInfo(connection.remotePeer)
        this.registrar.onDisconnect(peerInfo, connection)

        // If there are no connections to the peer, disconnect
        if (!this.registrar.getConnection(peerInfo)) {
          this.emit('peer:disconnect', peerInfo)
          this.metrics && this.metrics.onPeerDisconnected(peerInfo.id)
        }
      }
    })

    // Create the Registrar
    this.registrar = new Registrar({ peerStore: this.peerStore })
    this.handle = this.handle.bind(this)
    this.registrar.handle = this.handle

    // Setup the transport manager
    this.transportManager = new TransportManager({
      libp2p: this,
      upgrader: this.upgrader
    })

    // Attach crypto channels
    if (this._modules.connEncryption) {
      const cryptos = this._modules.connEncryption
      cryptos.forEach((crypto) => {
        this.upgrader.cryptos.set(crypto.protocol, crypto)
      })
    }

    this.dialer = new Dialer({
      transportManager: this.transportManager,
      peerStore: this.peerStore
    })

    this._modules.transport.forEach((Transport) => {
      this.transportManager.add(Transport.prototype[Symbol.toStringTag], Transport)
    })
    // TODO: enable relay if enabled
    this.transportManager.add(Circuit.prototype[Symbol.toStringTag], Circuit)

    // Attach stream multiplexers
    if (this._modules.streamMuxer) {
      const muxers = this._modules.streamMuxer
      muxers.forEach((muxer) => {
        this.upgrader.muxers.set(muxer.multicodec, muxer)
      })

      // Add the identify service since we can multiplex
      this.identifyService = new IdentifyService({
        registrar: this.registrar,
        peerInfo: this.peerInfo,
        protocols: this.upgrader.protocols
      })
      this.handle(Object.values(IDENTIFY_PROTOCOLS), this.identifyService.handleMessage)
    }

    // Attach private network protector
    if (this._modules.connProtector) {
      this.upgrader.protector = this._modules.connProtector
    } else if (process.env.LIBP2P_FORCE_PNET) {
      throw new Error('Private network is enforced, but no protector was provided')
    }

    // dht provided components (peerRouting, contentRouting, dht)
    if (this._modules.dht) {
      const DHT = this._modules.dht
      this._dht = new DHT({
        dialer: this.dialer,
        peerInfo: this.peerInfo,
        peerStore: this.peerStore,
        registrar: this.registrar,
        datastore: this.datastore,
        ...this._config.dht
      })
    }

    // start pubsub
    if (this._modules.pubsub) {
      this.pubsub = pubsub(this, this._modules.pubsub, this._config.pubsub)
    }

    // Attach remaining APIs
    // peer and content routing will automatically get modules from _modules and _dht
    this.peerRouting = peerRouting(this)
    this.contentRouting = contentRouting(this)

    // Mount default protocols
    ping.mount(this)

    this._onDiscoveryPeer = this._onDiscoveryPeer.bind(this)
  }

  /**
   * Overrides EventEmitter.emit to conditionally emit errors
   * if there is a handler. If not, errors will be logged.
   * @param {string} eventName
   * @param  {...any} args
   * @returns {void}
   */
  emit (eventName, ...args) {
    if (eventName === 'error' && !this._events.error) {
      log.error(...args)
    } else {
      super.emit(eventName, ...args)
    }
  }

  /**
   * Starts the libp2p node and all its subsystems
   *
   * @returns {Promise<void>}
   */
  async start () {
    log('libp2p is starting')
    try {
      await this._onStarting()
      await this._onDidStart()
      log('libp2p has started')
    } catch (err) {
      this.emit('error', err)
      log.error('An error occurred starting libp2p', err)
      await this.stop()
      throw err
    }
  }

  /**
   * Stop the libp2p node by closing its listeners and open connections
   * @async
   * @returns {void}
   */
  async stop () {
    log('libp2p is stopping')

    try {
      await Promise.all([
        this.pubsub && this.pubsub.stop(),
        this._dht && this._dht.stop(),
        this.metrics && this.metrics.stop()
      ])

      await this.transportManager.close()
      await this.registrar.close()

      ping.unmount(this)
      this.dialer.destroy()
    } catch (err) {
      if (err) {
        log.error(err)
        this.emit('error', err)
      }
    }
    log('libp2p has stopped')
  }

  isStarted () {
    return this._isStarted
  }

  /**
   * Dials to the provided peer. If successful, the `PeerInfo` of the
   * peer will be added to the nodes `peerStore`
   *
   * @param {PeerInfo|PeerId|Multiaddr|string} peer The peer to dial
   * @param {object} options
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<Connection>}
   */
  dial (peer, options) {
    return this.dialProtocol(peer, null, options)
  }

  /**
   * Dials to the provided peer and handshakes with the given protocol.
   * If successful, the `PeerInfo` of the peer will be added to the nodes `peerStore`,
   * and the `Connection` will be sent in the callback
   *
   * @async
   * @param {PeerInfo|PeerId|Multiaddr|string} peer The peer to dial
   * @param {string[]|string} protocols
   * @param {object} options
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<Connection|*>}
   */
  async dialProtocol (peer, protocols, options) {
    let connection
    if (multiaddr.isMultiaddr(peer)) {
      connection = await this.dialer.connectToMultiaddr(peer, options)
    } else {
      peer = await getPeerInfoRemote(peer, this)
      connection = await this.dialer.connectToPeer(peer.id, options)
    }

    const peerInfo = getPeerInfo(connection.remotePeer)

    // If a protocol was provided, create a new stream
    if (protocols) {
      const stream = await connection.newStream(protocols)

      peerInfo.protocols.add(stream.protocol)
      this.peerStore.put(peerInfo)

      return stream
    }

    this.peerStore.put(peerInfo)
    return connection
  }

  /**
   * Disconnects all connections to the given `peer`
   *
   * @param {PeerId} peer The PeerId to close connections to
   * @returns {Promise<void>}
   */
  hangUp (peer) {
    return Promise.all(
      this.registrar.connections.get(peer.toB58String()).map(connection => {
        return connection.close()
      })
    )
  }

  /**
   * Pings the given peer
   * @param {PeerInfo|PeerId|Multiaddr|string} peer The peer to ping
   * @returns {Promise<number>}
   */
  async ping (peer) {
    const peerInfo = await getPeerInfo(peer, this.peerStore)

    return ping(this, peerInfo)
  }

  /**
   * Registers the `handler` for each protocol
   * @param {string[]|string} protocols
   * @param {function({ connection:*, stream:*, protocol:string })} handler
   */
  handle (protocols, handler) {
    protocols = Array.isArray(protocols) ? protocols : [protocols]
    protocols.forEach(protocol => {
      this.upgrader.protocols.set(protocol, handler)
    })

    // Only push if libp2p is running
    if (this.isStarted() && this.identifyService) {
      this.identifyService.pushToPeerStore(this.peerStore)
    }
  }

  /**
   * Removes the handler for each protocol. The protocol
   * will no longer be supported on streams.
   * @param {string[]|string} protocols
   */
  unhandle (protocols) {
    protocols = Array.isArray(protocols) ? protocols : [protocols]
    protocols.forEach(protocol => {
      this.upgrader.protocols.delete(protocol)
    })

    // Only push if libp2p is running
    if (this.isStarted() && this.identifyService) {
      this.identifyService.pushToPeerStore(this.peerStore)
    }
  }

  async _onStarting () {
    // Listen on the addresses supplied in the peerInfo
    const multiaddrs = this.peerInfo.multiaddrs.toArray()

    await this.transportManager.listen(multiaddrs)

    // The addresses may change once the listener starts
    // eg /ip4/0.0.0.0/tcp/0 => /ip4/192.168.1.0/tcp/58751
    this.peerInfo.multiaddrs.clear()
    for (const ma of this.transportManager.getAddrs()) {
      this.peerInfo.multiaddrs.add(ma)
    }

    if (this._config.pubsub.enabled) {
      this.pubsub && this.pubsub.start()
    }

    // DHT subsystem
    if (this._config.dht.enabled) {
      this._dht && this._dht.start()

      // TODO: this should be modified once random-walk is used as
      // the other discovery modules
      this._dht.on('peer', this._onDiscoveryPeer)
    }

    // Start metrics if present
    this.metrics && this.metrics.start()
  }

  /**
   * Called when libp2p has started and before it returns
   * @private
   */
  _onDidStart () {
    this._isStarted = true

    this.peerStore.on('peer', peerInfo => {
      this.emit('peer:discovery', peerInfo)
      this._maybeConnect(peerInfo)
    })

    // Peer discovery
    this._setupPeerDiscovery()

    // Once we start, emit and dial any peers we may have already discovered
    for (const peerInfo of this.peerStore.peers.values()) {
      this.emit('peer:discovery', peerInfo)
      this._maybeConnect(peerInfo)
    }
  }

  /**
   * Called whenever peer discovery services emit `peer` events.
   * Known peers may be emitted.
   * @private
   * @param {PeerInfo} peerInfo
   */
  _onDiscoveryPeer (peerInfo) {
    if (peerInfo.id.toString() === this.peerInfo.id.toString()) {
      log.error(new Error(codes.ERR_DISCOVERED_SELF))
      return
    }
    this.peerStore.put(peerInfo)
  }

  /**
   * Will dial to the given `peerInfo` if the current number of
   * connected peers is less than the configured `ConnectionManager`
   * minPeers.
   * @private
   * @param {PeerInfo} peerInfo
   */
  async _maybeConnect (peerInfo) {
    // If auto dialing is on and we have no connection to the peer, check if we should dial
    if (this._config.peerDiscovery.autoDial === true && !this.registrar.getConnection(peerInfo)) {
      const minPeers = this._options.connectionManager.minPeers || 0
      // TODO: This does not account for multiple connections to a peer
      if (minPeers > this.registrar.connections.size) {
        log('connecting to discovered peer')
        try {
          await this.dialer.connectToPeer(peerInfo.id)
        } catch (err) {
          log.error('could not connect to discovered peer', err)
        }
      }
    }
  }

  /**
   * Initializes and starts peer discovery services
   *
   * @private
   * @returns {Promise<void>}
   */
  _setupPeerDiscovery () {
    const setupService = (DiscoveryService) => {
      let config = {
        enabled: true // on by default
      }

      if (DiscoveryService.tag &&
        this._config.peerDiscovery &&
        this._config.peerDiscovery[DiscoveryService.tag]) {
        config = { ...config, ...this._config.peerDiscovery[DiscoveryService.tag] }
      }

      if (config.enabled &&
        !this._discovery.has(DiscoveryService.tag)) { // not already added
        let discoveryService

        if (typeof DiscoveryService === 'function') {
          discoveryService = new DiscoveryService(Object.assign({}, config, { peerInfo: this.peerInfo }))
        } else {
          discoveryService = DiscoveryService
        }

        discoveryService.on('peer', this._onDiscoveryPeer)
        this._discovery.set(DiscoveryService.tag, discoveryService)
      }
    }

    // Discovery modules
    for (const DiscoveryService of this._modules.peerDiscovery || []) {
      setupService(DiscoveryService)
    }

    // Transport modules with discovery
    for (const Transport of this.transportManager.getTransports()) {
      if (Transport.discovery) {
        setupService(Transport.discovery)
      }
    }

    return Promise.all(Array.from(this._discovery.values(), d => d.start()))
  }
}

module.exports = Libp2p
/**
 * Like `new Libp2p(options)` except it will create a `PeerInfo`
 * instance if one is not provided in options.
 * @param {object} options Libp2p configuration options
 * @returns {Libp2p}
 */
module.exports.create = async (options = {}) => {
  if (options.peerInfo) {
    return new Libp2p(options)
  }

  const peerInfo = await PeerInfo.create()

  options.peerInfo = peerInfo
  return new Libp2p(options)
}
