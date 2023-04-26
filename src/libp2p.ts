import { logger } from '@libp2p/logger'
import type { AbortOptions } from '@libp2p/interfaces'
import { EventEmitter, CustomEvent } from '@libp2p/interfaces/events'
import { Startable, isStartable } from '@libp2p/interfaces/startable'
import { isMultiaddr, Multiaddr } from '@multiformats/multiaddr'
import { MemoryDatastore } from 'datastore-core/memory'
import { DefaultPeerRouting } from './peer-routing.js'
import { CompoundContentRouting } from './content-routing/index.js'
import { codes } from './errors.js'
import { DefaultAddressManager } from './address-manager/index.js'
import { DefaultConnectionManager } from './connection-manager/index.js'
import { DefaultKeyChain } from '@libp2p/keychain'
import { DefaultTransportManager } from './transport-manager.js'
import { DefaultUpgrader } from './upgrader.js'
import { DefaultRegistrar } from './registrar.js'
import { IdentifyService } from './identify/index.js'
import { FetchService } from './fetch/index.js'
import { PingService } from './ping/index.js'
import { NatManager } from './nat-manager.js'
import { DHTPeerRouting } from './dht/dht-peer-routing.js'
import { PersistentPeerStore } from '@libp2p/peer-store'
import { DHTContentRouting } from './dht/dht-content-routing.js'
import { AutonatService } from './autonat/index.js'
import { DefaultComponents } from './components.js'
import type { Components } from './components.js'
import type { PeerId } from '@libp2p/interface-peer-id'
import type { Connection, Stream } from '@libp2p/interface-connection'
import type { PeerRouting } from '@libp2p/interface-peer-routing'
import type { ContentRouting } from '@libp2p/interface-content-routing'
import type { PubSub } from '@libp2p/interface-pubsub'
import type { Registrar, StreamHandler, StreamHandlerOptions, Topology } from '@libp2p/interface-registrar'
import type { ConnectionManager } from '@libp2p/interface-connection-manager'
import type { PeerInfo } from '@libp2p/interface-peer-info'
import type { Libp2p, Libp2pInit, Libp2pOptions } from './index.js'
import { validateConfig } from './config.js'
import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import type { PeerStore } from '@libp2p/interface-peer-store'
import type { DualDHT } from '@libp2p/interface-dht'
import { concat as uint8ArrayConcat } from 'uint8arrays/concat'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { CodeError } from '@libp2p/interfaces/errors'
import type { Metrics } from '@libp2p/interface-metrics'
import { DummyDHT } from './dht/dummy-dht.js'
import { DummyPubSub } from './pubsub/dummy-pubsub.js'
import { PeerSet } from '@libp2p/peer-collections'
import { peerIdFromString } from '@libp2p/peer-id'
import type { Datastore } from 'interface-datastore'
import type { KeyChain } from '@libp2p/interface-keychain'
import mergeOptions from 'merge-options'
import type { CircuitRelayService } from './circuit-relay/index.js'
import type { Libp2pEvents, PendingDial } from '@libp2p/interface-libp2p'
import { setMaxListeners } from 'events'

const log = logger('libp2p')

export class Libp2pNode extends EventEmitter<Libp2pEvents> implements Libp2p {
  public peerId: PeerId
  public dht: DualDHT
  public pubsub: PubSub
  public identifyService: IdentifyService
  public circuitService?: CircuitRelayService
  public fetchService: FetchService
  public pingService: PingService
  public autonatService: AutonatService
  public components: Components
  public peerStore: PeerStore
  public contentRouting: ContentRouting
  public peerRouting: PeerRouting
  public keychain: KeyChain
  public connectionManager: ConnectionManager
  public registrar: Registrar
  public metrics?: Metrics

  private started: boolean
  private readonly services: Startable[]

  constructor (init: Libp2pInit) {
    super()

    // event bus - components can listen to this emitter to be notified of system events
    // and also cause them to be emitted
    const events = new EventEmitter<Libp2pEvents>()
    const originalDispatch = events.dispatchEvent.bind(events)
    events.dispatchEvent = (evt: any) => {
      const internalResult = originalDispatch(evt)
      const externalResult = this.dispatchEvent(
        new CustomEvent(evt.type, { detail: evt.detail })
      )

      return internalResult || externalResult
    }

    try {
      // This emitter gets listened to a lot
      setMaxListeners?.(Infinity, events)
    } catch {}

    this.started = false
    this.peerId = init.peerId
    const components = this.components = new DefaultComponents({
      peerId: init.peerId,
      events,
      datastore: init.datastore ?? new MemoryDatastore(),
      connectionGater: {
        denyDialPeer: async () => await Promise.resolve(false),
        denyDialMultiaddr: async () => await Promise.resolve(false),
        denyInboundConnection: async () => await Promise.resolve(false),
        denyOutboundConnection: async () => await Promise.resolve(false),
        denyInboundEncryptedConnection: async () => await Promise.resolve(false),
        denyOutboundEncryptedConnection: async () => await Promise.resolve(false),
        denyInboundUpgradedConnection: async () => await Promise.resolve(false),
        denyOutboundUpgradedConnection: async () => await Promise.resolve(false),
        filterMultiaddrForPeer: async () => await Promise.resolve(true),
        ...init.connectionGater
      }
    })
    components.peerStore = new PersistentPeerStore(components, {
      addressFilter: this.components.connectionGater.filterMultiaddrForPeer,
      ...init.peerStore
    })

    this.services = [
      components
    ]

    // Create Metrics
    if (init.metrics != null) {
      this.metrics = this.components.metrics = this.configureComponent(init.metrics(this.components))
    }

    this.peerStore = this.components.peerStore

    this.components.events.addEventListener('peer:update', evt => {
      // if there was no peer previously in the peer store this is a new peer
      if (evt.detail.previous == null) {
        this.safeDispatchEvent('peer:discovery', { detail: evt.detail.peer })
      }
    })

    // Set up connection protector if configured
    if (init.connectionProtector != null) {
      this.components.connectionProtector = init.connectionProtector(components)
    }

    // Set up the Upgrader
    this.components.upgrader = new DefaultUpgrader(this.components, {
      connectionEncryption: (init.connectionEncryption ?? []).map(fn => this.configureComponent(fn(this.components))),
      muxers: (init.streamMuxers ?? []).map(fn => this.configureComponent(fn(this.components))),
      inboundUpgradeTimeout: init.connectionManager.inboundUpgradeTimeout
    })

    // Setup the transport manager
    this.components.transportManager = new DefaultTransportManager(this.components, init.transportManager)

    // Create the Connection Manager
    this.connectionManager = this.components.connectionManager = new DefaultConnectionManager(this.components, init.connectionManager)

    // Create the Registrar
    this.registrar = this.components.registrar = new DefaultRegistrar(this.components)

    // Addresses {listen, announce, noAnnounce}
    this.components.addressManager = new DefaultAddressManager(this.components, init.addresses)

    // Create keychain
    const keychainOpts = DefaultKeyChain.generateOptions()
    this.keychain = this.configureComponent(new DefaultKeyChain(this.components, {
      ...keychainOpts,
      ...init.keychain
    }))

    // Create the Nat Manager
    this.services.push(new NatManager(this.components, init.nat))

    // Add the identify service
    this.identifyService = new IdentifyService(this.components, {
      ...init.identify
    })
    this.configureComponent(this.identifyService)

    // dht provided components (peerRouting, contentRouting, dht)
    if (init.dht != null) {
      this.dht = this.components.dht = init.dht(this.components)
    } else {
      this.dht = new DummyDHT()
    }

    // Create pubsub if provided
    if (init.pubsub != null) {
      this.pubsub = this.components.pubsub = init.pubsub(this.components)
    } else {
      this.pubsub = new DummyPubSub()
    }

    // Attach remaining APIs
    // peer and content routing will automatically get modules from _modules and _dht

    const peerRouters: PeerRouting[] = (init.peerRouters ?? []).map(fn => this.configureComponent(fn(this.components)))

    if (init.dht != null) {
      // add dht to routers
      peerRouters.push(this.configureComponent(new DHTPeerRouting(this.dht)))

      // use dht for peer discovery
      this.dht.addEventListener('peer', (evt) => {
        this.onDiscoveryPeer(evt)
      })
    }

    this.peerRouting = this.components.peerRouting = this.configureComponent(new DefaultPeerRouting(this.components, {
      ...init.peerRouting,
      routers: peerRouters
    }))

    const contentRouters: ContentRouting[] = (init.contentRouters ?? []).map(fn => this.configureComponent(fn(this.components)))

    if (init.dht != null) {
      // add dht to routers
      contentRouters.push(this.configureComponent(new DHTContentRouting(this.dht)))
    }

    this.contentRouting = this.components.contentRouting = this.configureComponent(new CompoundContentRouting(this.components, {
      routers: contentRouters
    }))

    this.fetchService = this.configureComponent(new FetchService(this.components, {
      ...init.fetch
    }))

    this.pingService = this.configureComponent(new PingService(this.components, {
      ...init.ping
    }))

    this.autonatService = this.configureComponent(new AutonatService(this.components, {
      ...init.autonat
    }))

    if (init.relay != null) {
      this.circuitService = this.configureComponent(init.relay(this.components))
    }

    // Discovery modules
    for (const fn of init.peerDiscovery ?? []) {
      const service = this.configureComponent(fn(this.components))

      service.addEventListener('peer', (evt) => {
        this.onDiscoveryPeer(evt)
      })
    }

    // Transport modules
    init.transports.forEach((fn) => {
      this.components.transportManager.add(this.configureComponent(fn(this.components)))
    })
  }

  private configureComponent <T> (component: T): T {
    if (isStartable(component)) {
      this.services.push(component)
    }

    return component
  }

  /**
   * Starts the libp2p node and all its subsystems
   */
  async start (): Promise<void> {
    if (this.started) {
      return
    }

    this.started = true

    log('libp2p is starting')

    const keys = await this.keychain.listKeys()

    if (keys.find(key => key.name === 'self') == null) {
      log('importing self key into keychain')
      await this.keychain.importPeer('self', this.components.peerId)
    }

    try {
      await Promise.all(
        this.services.map(async service => {
          if (service.beforeStart != null) {
            await service.beforeStart()
          }
        })
      )

      // start any startables
      await Promise.all(
        this.services.map(async service => { await service.start() })
      )

      await Promise.all(
        this.services.map(async service => {
          if (service.afterStart != null) {
            await service.afterStart()
          }
        })
      )

      log('libp2p has started')
    } catch (err: any) {
      log.error('An error occurred starting libp2p', err)
      await this.stop()
      throw err
    }
  }

  /**
   * Stop the libp2p node by closing its listeners and open connections
   */
  async stop (): Promise<void> {
    if (!this.started) {
      return
    }

    log('libp2p is stopping')

    this.started = false

    await Promise.all(
      this.services.map(async service => {
        if (service.beforeStop != null) {
          await service.beforeStop()
        }
      })
    )

    await Promise.all(
      this.services.map(async service => { await service.stop() })
    )

    await Promise.all(
      this.services.map(async service => {
        if (service.afterStop != null) {
          await service.afterStop()
        }
      })
    )

    log('libp2p has stopped')
  }

  isStarted (): boolean {
    return this.started
  }

  getConnections (peerId?: PeerId): Connection[] {
    return this.components.connectionManager.getConnections(peerId)
  }

  getDialQueue (): PendingDial[] {
    return this.components.connectionManager.getDialQueue()
  }

  getPeers (): PeerId[] {
    const peerSet = new PeerSet()

    for (const conn of this.components.connectionManager.getConnections()) {
      peerSet.add(conn.remotePeer)
    }

    return Array.from(peerSet)
  }

  async dial (peer: PeerId | Multiaddr | Multiaddr[], options: AbortOptions = {}): Promise<Connection> {
    return await this.components.connectionManager.openConnection(peer, options)
  }

  async dialProtocol (peer: PeerId | Multiaddr | Multiaddr[], protocols: string | string[], options: AbortOptions = {}): Promise<Stream> {
    if (protocols == null) {
      throw new CodeError('no protocols were provided to open a stream', codes.ERR_INVALID_PROTOCOLS_FOR_STREAM)
    }

    protocols = Array.isArray(protocols) ? protocols : [protocols]

    if (protocols.length === 0) {
      throw new CodeError('no protocols were provided to open a stream', codes.ERR_INVALID_PROTOCOLS_FOR_STREAM)
    }

    const connection = await this.dial(peer, options)

    return await connection.newStream(protocols, options)
  }

  getMultiaddrs (): Multiaddr[] {
    return this.components.addressManager.getAddresses()
  }

  getProtocols (): string[] {
    return this.components.registrar.getProtocols()
  }

  async hangUp (peer: PeerId | Multiaddr): Promise<void> {
    if (isMultiaddr(peer)) {
      peer = peerIdFromString(peer.getPeerId() ?? '')
    }

    await this.components.connectionManager.closeConnections(peer)
  }

  /**
   * Get the public key for the given peer id
   */
  async getPublicKey (peer: PeerId, options: AbortOptions = {}): Promise<Uint8Array> {
    log('getPublicKey %p', peer)

    if (peer.publicKey != null) {
      return peer.publicKey
    }

    const peerInfo = await this.peerStore.get(peer)

    if (peerInfo.id.publicKey != null) {
      return peerInfo.id.publicKey
    }

    const peerKey = uint8ArrayConcat([
      uint8ArrayFromString('/pk/'),
      peer.multihash.digest
    ])

    // search any available content routing methods
    const bytes = await this.contentRouting.get(peerKey, options)

    await this.peerStore.patch(peer, {
      publicKey: bytes
    })

    return bytes
  }

  async fetch (peer: PeerId | Multiaddr, key: string, options: AbortOptions = {}): Promise<Uint8Array | null> {
    if (isMultiaddr(peer)) {
      const peerId = peerIdFromString(peer.getPeerId() ?? '')
      await this.components.peerStore.merge(peerId, {
        multiaddrs: [peer]
      })
      peer = peerId
    }

    return await this.fetchService.fetch(peer, key, options)
  }

  async ping (peer: PeerId | Multiaddr, options: AbortOptions = {}): Promise<number> {
    if (isMultiaddr(peer)) {
      const peerId = peerIdFromString(peer.getPeerId() ?? '')
      await this.components.peerStore.merge(peerId, {
        multiaddrs: [peer]
      })
      peer = peerId
    }

    return await this.pingService.ping(peer, options)
  }

  async handle (protocols: string | string[], handler: StreamHandler, options?: StreamHandlerOptions): Promise<void> {
    if (!Array.isArray(protocols)) {
      protocols = [protocols]
    }

    await Promise.all(
      protocols.map(async protocol => {
        await this.components.registrar.handle(protocol, handler, options)
      })
    )
  }

  async unhandle (protocols: string[] | string): Promise<void> {
    if (!Array.isArray(protocols)) {
      protocols = [protocols]
    }

    await Promise.all(
      protocols.map(async protocol => {
        await this.components.registrar.unhandle(protocol)
      })
    )
  }

  async register (protocol: string, topology: Topology): Promise<string> {
    return await this.registrar.register(protocol, topology)
  }

  unregister (id: string): void {
    this.registrar.unregister(id)
  }

  /**
   * Called whenever peer discovery services emit `peer` events and adds peers
   * to the peer store.
   */
  onDiscoveryPeer (evt: CustomEvent<PeerInfo>): void {
    const { detail: peer } = evt

    if (peer.id.toString() === this.peerId.toString()) {
      log.error(new Error(codes.ERR_DISCOVERED_SELF))
      return
    }

    void this.components.peerStore.merge(peer.id, {
      multiaddrs: peer.multiaddrs,
      protocols: peer.protocols
    })
      .catch(err => { log.error(err) })
  }
}

/**
 * Returns a new Libp2pNode instance - this exposes more of the internals than the
 * libp2p interface and is useful for testing and debugging.
 */
export async function createLibp2pNode (options: Libp2pOptions): Promise<Libp2pNode> {
  if (options.peerId == null) {
    const datastore = options.datastore as Datastore | undefined

    if (datastore != null) {
      try {
        // try load the peer id from the keychain
        const keyChain = new DefaultKeyChain({
          datastore
        }, mergeOptions(DefaultKeyChain.generateOptions(), options.keychain))

        options.peerId = await keyChain.exportPeerId('self')
      } catch (err: any) {
        if (err.code !== 'ERR_NOT_FOUND') {
          throw err
        }
      }
    }
  }

  if (options.peerId == null) {
    // no peer id in the keychain, create a new peer id
    options.peerId = await createEd25519PeerId()
  }

  return new Libp2pNode(validateConfig(options))
}
