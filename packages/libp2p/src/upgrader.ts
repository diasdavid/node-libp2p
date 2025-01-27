import { InvalidMultiaddrError, TooManyInboundProtocolStreamsError, TooManyOutboundProtocolStreamsError, LimitedConnectionError, setMaxListeners, InvalidPeerIdError } from '@libp2p/interface'
import * as mss from '@libp2p/multistream-select'
import { peerIdFromString } from '@libp2p/peer-id'
import { anySignal } from 'any-signal'
import { CustomProgressEvent } from 'progress-events'
import { createConnection } from './connection/index.js'
import { PROTOCOL_NEGOTIATION_TIMEOUT, UPGRADE_TIMEOUT } from './connection-manager/constants.js'
import { ConnectionDeniedError, ConnectionInterceptedError, EncryptionFailedError, MuxerUnavailableError } from './errors.js'
import { DEFAULT_MAX_INBOUND_STREAMS, DEFAULT_MAX_OUTBOUND_STREAMS } from './registrar.js'
import type { Libp2pEvents, AbortOptions, ComponentLogger, MultiaddrConnection, Connection, Stream, ConnectionProtector, NewStreamOptions, ConnectionEncrypter, SecuredConnection, ConnectionGater, TypedEventTarget, Metrics, PeerId, PeerStore, StreamMuxer, StreamMuxerFactory, Upgrader, UpgraderOptions, ConnectionLimits, SecureConnectionOptions, CounterGroup } from '@libp2p/interface'
import type { ConnectionManager, Registrar } from '@libp2p/interface-internal'

interface CreateConnectionOptions {
  cryptoProtocol: string
  direction: 'inbound' | 'outbound'
  maConn: MultiaddrConnection
  upgradedConn: MultiaddrConnection
  remotePeer: PeerId
  muxerFactory?: StreamMuxerFactory
  limits?: ConnectionLimits
}

interface OnStreamOptions {
  connection: Connection
  stream: Stream
  protocol: string
}

export interface CryptoResult extends SecuredConnection<MultiaddrConnection> {
  protocol: string
}

export interface UpgraderInit {
  connectionEncrypters: ConnectionEncrypter[]
  streamMuxers: StreamMuxerFactory[]

  /**
   * An amount of ms by which an inbound connection upgrade must complete
   *
   * @default 3000
   */
  inboundUpgradeTimeout?: number

  /**
   * An amount of ms by which an outbound connection upgrade must complete
   *
   * @default 3000
   */
  outboundUpgradeTimeout?: number

  /**
   * When a new incoming stream is opened on a multiplexed connection, protocol
   * negotiation on that stream must complete within this many ms
   *
   * @default 2000
   */
  inboundStreamProtocolNegotiationTimeout?: number

  /**
   * When a new incoming stream is opened on a multiplexed connection, protocol
   * negotiation on that stream must complete within this many ms
   *
   * @default 2000
   */
  outboundStreamProtocolNegotiationTimeout?: number
}

function findIncomingStreamLimit (protocol: string, registrar: Registrar): number | undefined {
  try {
    const { options } = registrar.getHandler(protocol)

    return options.maxInboundStreams
  } catch (err: any) {
    if (err.name !== 'UnhandledProtocolError') {
      throw err
    }
  }

  return DEFAULT_MAX_INBOUND_STREAMS
}

function findOutgoingStreamLimit (protocol: string, registrar: Registrar, options: NewStreamOptions = {}): number {
  try {
    const { options } = registrar.getHandler(protocol)

    if (options.maxOutboundStreams != null) {
      return options.maxOutboundStreams
    }
  } catch (err: any) {
    if (err.name !== 'UnhandledProtocolError') {
      throw err
    }
  }

  return options.maxOutboundStreams ?? DEFAULT_MAX_OUTBOUND_STREAMS
}

function countStreams (protocol: string, direction: 'inbound' | 'outbound', connection: Connection): number {
  let streamCount = 0

  connection.streams.forEach(stream => {
    if (stream.direction === direction && stream.protocol === protocol) {
      streamCount++
    }
  })

  return streamCount
}

export interface DefaultUpgraderComponents {
  peerId: PeerId
  metrics?: Metrics
  connectionManager: ConnectionManager
  connectionGater: ConnectionGater
  connectionProtector?: ConnectionProtector
  registrar: Registrar
  peerStore: PeerStore
  events: TypedEventTarget<Libp2pEvents>
  logger: ComponentLogger
}

type ConnectionDeniedType = keyof Pick<ConnectionGater, 'denyOutboundConnection' | 'denyInboundEncryptedConnection' | 'denyOutboundEncryptedConnection' | 'denyInboundUpgradedConnection' | 'denyOutboundUpgradedConnection'>

export class DefaultUpgrader implements Upgrader {
  private readonly components: DefaultUpgraderComponents
  private readonly connectionEncrypters: Map<string, ConnectionEncrypter>
  private readonly streamMuxers: Map<string, StreamMuxerFactory>
  private readonly inboundUpgradeTimeout: number
  private readonly outboundUpgradeTimeout: number
  private readonly inboundStreamProtocolNegotiationTimeout: number
  private readonly outboundStreamProtocolNegotiationTimeout: number
  private readonly events: TypedEventTarget<Libp2pEvents>
  private readonly metrics: {
    dials?: CounterGroup<'inbound' | 'outbound'>
    errors?: CounterGroup<'inbound' | 'outbound'>
  }

  constructor (components: DefaultUpgraderComponents, init: UpgraderInit) {
    this.components = components
    this.connectionEncrypters = new Map()

    init.connectionEncrypters.forEach(encrypter => {
      this.connectionEncrypters.set(encrypter.protocol, encrypter)
    })

    this.streamMuxers = new Map()

    init.streamMuxers.forEach(muxer => {
      this.streamMuxers.set(muxer.protocol, muxer)
    })

    this.inboundUpgradeTimeout = init.inboundUpgradeTimeout ?? UPGRADE_TIMEOUT
    this.outboundUpgradeTimeout = init.outboundUpgradeTimeout ?? UPGRADE_TIMEOUT
    this.inboundStreamProtocolNegotiationTimeout = init.inboundStreamProtocolNegotiationTimeout ?? PROTOCOL_NEGOTIATION_TIMEOUT
    this.outboundStreamProtocolNegotiationTimeout = init.outboundStreamProtocolNegotiationTimeout ?? PROTOCOL_NEGOTIATION_TIMEOUT
    this.events = components.events
    this.metrics = {
      dials: components.metrics?.registerCounterGroup('libp2p_connection_manager_dials_total'),
      errors: components.metrics?.registerCounterGroup('libp2p_connection_manager_dial_errors_total')
    }
  }

  readonly [Symbol.toStringTag] = '@libp2p/upgrader'

  async shouldBlockConnection (connectionType: 'denyInboundConnection', maConn: MultiaddrConnection): Promise<void>
  async shouldBlockConnection (connectionType: ConnectionDeniedType, remotePeer: PeerId, maConn: MultiaddrConnection): Promise<void>
  async shouldBlockConnection (method: ConnectionDeniedType | 'denyInboundConnection', ...args: any[]): Promise<void> {
    const denyOperation: any = this.components.connectionGater[method]

    if (denyOperation == null) {
      return
    }

    const result = await denyOperation.apply(this.components.connectionGater, args)

    if (result === true) {
      throw new ConnectionInterceptedError(`The multiaddr connection is blocked by gater.${method}`)
    }
  }

  /**
   * Upgrades an inbound connection
   */
  async upgradeInbound (maConn: MultiaddrConnection, opts: UpgraderOptions = {}): Promise<void> {
    let accepted = false

    try {
      this.metrics.dials?.increment({
        inbound: true
      })

      accepted = await this.components.connectionManager.acceptIncomingConnection(maConn)

      if (!accepted) {
        throw new ConnectionDeniedError('Connection denied')
      }

      await this.shouldBlockConnection('denyInboundConnection', maConn)

      await this._performUpgrade(maConn, 'inbound', opts)
    } catch (err) {
      this.metrics.errors?.increment({
        inbound: true
      })

      throw err
    } finally {
      if (accepted) {
        this.components.connectionManager.afterUpgradeInbound()
      }
    }
  }

  /**
   * Upgrades an outbound connection
   */
  async upgradeOutbound (maConn: MultiaddrConnection, opts: UpgraderOptions = {}): Promise<Connection> {
    try {
      this.metrics.dials?.increment({
        outbound: true
      })

      const idStr = maConn.remoteAddr.getPeerId()
      let remotePeerId: PeerId | undefined

      if (idStr != null) {
        remotePeerId = peerIdFromString(idStr)
        await this.shouldBlockConnection('denyOutboundConnection', remotePeerId, maConn)
      }

      let direction: 'inbound' | 'outbound' = 'outbound'

      // act as the multistream-select server if we are not to be the initiator
      if (opts.initiator === false) {
        direction = 'inbound'
      }

      return await this._performUpgrade(maConn, direction, opts)
    } catch (err) {
      this.metrics.errors?.increment({
        outbound: true
      })

      throw err
    }
  }

  private async _performUpgrade (maConn: MultiaddrConnection, direction: 'inbound' | 'outbound', opts: UpgraderOptions): Promise<Connection> {
    let encryptedConn: MultiaddrConnection
    let remotePeer: PeerId
    let upgradedConn: MultiaddrConnection
    let muxerFactory: StreamMuxerFactory | undefined
    let cryptoProtocol

    const upgradeTimeoutSignal = AbortSignal.timeout(direction === 'inbound' ? this.inboundUpgradeTimeout : this.outboundUpgradeTimeout)
    const signal = anySignal([upgradeTimeoutSignal, opts.signal])
    setMaxListeners(Infinity, upgradeTimeoutSignal, signal)
    opts.signal = signal

    this.components.metrics?.trackMultiaddrConnection(maConn)

    maConn.log.trace('starting the %s connection upgrade', direction)

    // Protect
    let protectedConn = maConn

    if (opts?.skipProtection !== true) {
      const protector = this.components.connectionProtector

      if (protector != null) {
        maConn.log('protecting the %s connection', direction)
        protectedConn = await protector.protect(maConn, opts)
      }
    }

    try {
      // Encrypt the connection
      encryptedConn = protectedConn
      if (opts?.skipEncryption !== true) {
        opts?.onProgress?.(new CustomProgressEvent(`upgrader:encrypt-${direction}-connection`));

        ({
          conn: encryptedConn,
          remotePeer,
          protocol: cryptoProtocol
        } = await (direction === 'inbound'
          ? this._encryptInbound(protectedConn, {
            ...opts,
            signal
          })
          : this._encryptOutbound(protectedConn, {
            ...opts,
            signal
          })
        ))

        const maConn: MultiaddrConnection = {
          ...protectedConn,
          ...encryptedConn
        }

        await this.shouldBlockConnection(direction === 'inbound' ? 'denyInboundEncryptedConnection' : 'denyOutboundEncryptedConnection', remotePeer, maConn)
      } else {
        const idStr = maConn.remoteAddr.getPeerId()

        if (idStr == null) {
          throw new InvalidMultiaddrError(`${direction} connection that skipped encryption must have a peer id`)
        }

        const remotePeerId = peerIdFromString(idStr)

        cryptoProtocol = 'native'
        remotePeer = remotePeerId
      }

      // this can happen if we dial a multiaddr without a peer id, we only find
      // out the identity of the remote after the connection is encrypted
      if (remotePeer.equals(this.components.peerId)) {
        const err = new InvalidPeerIdError('Can not dial self')
        maConn.abort(err)
        throw err
      }

      upgradedConn = encryptedConn
      if (opts?.muxerFactory != null) {
        muxerFactory = opts.muxerFactory
      } else if (this.streamMuxers.size > 0) {
        opts?.onProgress?.(new CustomProgressEvent(`upgrader:multiplex-${direction}-connection`))

        // Multiplex the connection
        const multiplexed = await (direction === 'inbound'
          ? this._multiplexInbound({
            ...protectedConn,
            ...encryptedConn
          }, this.streamMuxers, opts)
          : this._multiplexOutbound({
            ...protectedConn,
            ...encryptedConn
          }, this.streamMuxers, opts))
        muxerFactory = multiplexed.muxerFactory
        upgradedConn = multiplexed.stream
      }
    } catch (err: any) {
      maConn.log.error('failed to upgrade inbound connection %s %a - %e', direction === 'inbound' ? 'from' : 'to', maConn.remoteAddr, err)
      throw err
    } finally {
      signal.clear()
    }

    await this.shouldBlockConnection(direction === 'inbound' ? 'denyInboundUpgradedConnection' : 'denyOutboundUpgradedConnection', remotePeer, maConn)

    maConn.log('successfully upgraded %s connection', direction)

    return this._createConnection({
      cryptoProtocol,
      direction,
      maConn,
      upgradedConn,
      muxerFactory,
      remotePeer,
      limits: opts?.limits
    })
  }

  /**
   * A convenience method for generating a new `Connection`
   */
  _createConnection (opts: CreateConnectionOptions): Connection {
    const {
      cryptoProtocol,
      direction,
      maConn,
      upgradedConn,
      remotePeer,
      muxerFactory,
      limits
    } = opts

    let muxer: StreamMuxer | undefined
    let newStream: ((multicodecs: string[], options?: AbortOptions) => Promise<Stream>) | undefined
    let connection: Connection // eslint-disable-line prefer-const

    if (muxerFactory != null) {
      // Create the muxer
      muxer = muxerFactory.createStreamMuxer({
        direction,
        // Run anytime a remote stream is created
        onIncomingStream: muxedStream => {
          if (connection == null) {
            return
          }

          void Promise.resolve()
            .then(async () => {
              const protocols = this.components.registrar.getProtocols()
              const signal = AbortSignal.timeout(this.inboundStreamProtocolNegotiationTimeout)
              setMaxListeners(Infinity, signal)

              const { stream, protocol } = await mss.handle(muxedStream, protocols, {
                signal,
                log: muxedStream.log,
                yieldBytes: false
              })

              if (connection == null) {
                return
              }

              connection.log('incoming stream opened on %s', protocol)

              const incomingLimit = findIncomingStreamLimit(protocol, this.components.registrar)
              const streamCount = countStreams(protocol, 'inbound', connection)

              if (streamCount === incomingLimit) {
                const err = new TooManyInboundProtocolStreamsError(`Too many inbound protocol streams for protocol "${protocol}" - limit ${incomingLimit}`)
                muxedStream.abort(err)

                throw err
              }

              // after the handshake the returned stream can have early data so override
              // the souce/sink
              muxedStream.source = stream.source
              muxedStream.sink = stream.sink
              muxedStream.protocol = protocol

              // allow closing the write end of a not-yet-negotiated stream
              if (stream.closeWrite != null) {
                muxedStream.closeWrite = stream.closeWrite
              }

              // allow closing the read end of a not-yet-negotiated stream
              if (stream.closeRead != null) {
                muxedStream.closeRead = stream.closeRead
              }

              // make sure we don't try to negotiate a stream we are closing
              if (stream.close != null) {
                muxedStream.close = stream.close
              }

              // If a protocol stream has been successfully negotiated and is to be passed to the application,
              // the peerstore should ensure that the peer is registered with that protocol
              await this.components.peerStore.merge(remotePeer, {
                protocols: [protocol]
              })

              this.components.metrics?.trackProtocolStream(muxedStream, connection)

              this._onStream({ connection, stream: muxedStream, protocol })
            })
            .catch(async err => {
              connection.log.error('error handling incoming stream id %s - %e', muxedStream.id, err)

              if (muxedStream.timeline.close == null) {
                await muxedStream.close()
              }
            })
        }
      })

      newStream = async (protocols: string[], options: NewStreamOptions = {}): Promise<Stream> => {
        if (muxer == null) {
          throw new MuxerUnavailableError('Connection is not multiplexed')
        }

        connection.log.trace('starting new stream for protocols %s', protocols)
        const muxedStream = await muxer.newStream()
        connection.log.trace('started new stream %s for protocols %s', muxedStream.id, protocols)

        try {
          if (options.signal == null) {
            muxedStream.log('no abort signal was passed while trying to negotiate protocols %s falling back to default timeout', protocols)

            const signal = AbortSignal.timeout(this.outboundStreamProtocolNegotiationTimeout)
            setMaxListeners(Infinity, signal)

            options = {
              ...options,
              signal
            }
          }

          muxedStream.log.trace('selecting protocol from protocols %s', protocols)

          const {
            stream,
            protocol
          } = await mss.select(muxedStream, protocols, {
            ...options,
            log: muxedStream.log,
            yieldBytes: true
          })

          muxedStream.log.trace('selected protocol %s', protocol)

          const outgoingLimit = findOutgoingStreamLimit(protocol, this.components.registrar, options)
          const streamCount = countStreams(protocol, 'outbound', connection)

          if (streamCount >= outgoingLimit) {
            const err = new TooManyOutboundProtocolStreamsError(`Too many outbound protocol streams for protocol "${protocol}" - ${streamCount}/${outgoingLimit}`)
            muxedStream.abort(err)

            throw err
          }

          // If a protocol stream has been successfully negotiated and is to be passed to the application,
          // the peerstore should ensure that the peer is registered with that protocol
          await this.components.peerStore.merge(remotePeer, {
            protocols: [protocol]
          })

          // after the handshake the returned stream can have early data so override
          // the souce/sink
          muxedStream.source = stream.source
          muxedStream.sink = stream.sink
          muxedStream.protocol = protocol

          // allow closing the write end of a not-yet-negotiated stream
          if (stream.closeWrite != null) {
            muxedStream.closeWrite = stream.closeWrite
          }

          // allow closing the read end of a not-yet-negotiated stream
          if (stream.closeRead != null) {
            muxedStream.closeRead = stream.closeRead
          }

          // make sure we don't try to negotiate a stream we are closing
          if (stream.close != null) {
            muxedStream.close = stream.close
          }

          this.components.metrics?.trackProtocolStream(muxedStream, connection)

          return muxedStream
        } catch (err: any) {
          connection.log.error('could not create new outbound stream on connection %s %a for protocols %s - %e', direction === 'inbound' ? 'from' : 'to', opts.maConn.remoteAddr, protocols, err)

          if (muxedStream.timeline.close == null) {
            muxedStream.abort(err)
          }

          throw err
        }
      }

      // Pipe all data through the muxer
      void Promise.all([
        muxer.sink(upgradedConn.source),
        upgradedConn.sink(muxer.source)
      ]).catch(err => {
        connection.log.error('error piping data through muxer - %e', err)
      })
    }

    const _timeline = maConn.timeline
    maConn.timeline = new Proxy(_timeline, {
      set: (...args) => {
        if (args[1] === 'close' && args[2] != null && _timeline.close == null) {
          // Wait for close to finish before notifying of the closure
          (async () => {
            try {
              if (connection.status === 'open') {
                await connection.close()
              }
            } catch (err: any) {
              connection.log.error('error closing connection after timeline close %e', err)
            } finally {
              this.events.safeDispatchEvent('connection:close', {
                detail: connection
              })
            }
          })().catch(err => {
            connection.log.error('error thrown while dispatching connection:close event %e', err)
          })
        }

        return Reflect.set(...args)
      }
    })
    maConn.timeline.upgraded = Date.now()

    const errConnectionNotMultiplexed = (): any => {
      throw new MuxerUnavailableError('Connection is not multiplexed')
    }

    // Create the connection
    connection = createConnection({
      remoteAddr: maConn.remoteAddr,
      remotePeer,
      status: 'open',
      direction,
      timeline: maConn.timeline,
      multiplexer: muxer?.protocol,
      encryption: cryptoProtocol,
      limits,
      logger: this.components.logger,
      newStream: newStream ?? errConnectionNotMultiplexed,
      getStreams: () => {
        return muxer?.streams ?? []
      },
      close: async (options?: AbortOptions) => {
        // ensure remaining streams are closed gracefully
        await muxer?.close(options)

        // close the underlying transport
        await maConn.close(options)
      },
      abort: (err) => {
        maConn.abort(err)

        // ensure remaining streams are aborted
        muxer?.abort(err)
      }
    })

    this.events.safeDispatchEvent('connection:open', {
      detail: connection
    })

    // @ts-expect-error nah
    connection.__maConnTimeline = _timeline

    return connection
  }

  /**
   * Routes incoming streams to the correct handler
   */
  _onStream (opts: OnStreamOptions): void {
    const { connection, stream, protocol } = opts
    const { handler, options } = this.components.registrar.getHandler(protocol)

    if (connection.limits != null && options.runOnLimitedConnection !== true) {
      throw new LimitedConnectionError('Cannot open protocol stream on limited connection')
    }

    handler({ connection, stream })
  }

  /**
   * Attempts to encrypt the incoming `connection` with the provided `cryptos`
   */
  async _encryptInbound (connection: MultiaddrConnection, options?: AbortOptions): Promise<CryptoResult> {
    const protocols = Array.from(this.connectionEncrypters.keys())

    try {
      const { stream, protocol } = await mss.handle(connection, protocols, {
        ...options,
        log: connection.log
      })
      const encrypter = this.connectionEncrypters.get(protocol)

      if (encrypter == null) {
        throw new EncryptionFailedError(`no crypto module found for ${protocol}`)
      }

      connection.log('encrypting inbound connection to %a using %s', connection.remoteAddr, protocol)

      return {
        ...await encrypter.secureInbound(stream, options),
        protocol
      }
    } catch (err: any) {
      connection.log.error('encrypting inbound connection from %a failed', connection.remoteAddr, err)
      throw new EncryptionFailedError(err.message)
    }
  }

  /**
   * Attempts to encrypt the given `connection` with the provided connection encrypters.
   * The first `ConnectionEncrypter` module to succeed will be used
   */
  async _encryptOutbound (connection: MultiaddrConnection, options: SecureConnectionOptions): Promise<CryptoResult> {
    const protocols = Array.from(this.connectionEncrypters.keys())

    try {
      connection.log.trace('selecting encrypter from %s', protocols)

      const { stream, protocol } = await mss.select(connection, protocols, {
        ...options,
        log: connection.log,
        yieldBytes: true
      })
      const encrypter = this.connectionEncrypters.get(protocol)

      if (encrypter == null) {
        throw new EncryptionFailedError(`no crypto module found for ${protocol}`)
      }

      connection.log('encrypting outbound connection to %a using %s', connection.remoteAddr, protocol)

      return {
        ...await encrypter.secureOutbound(stream, options),
        protocol
      }
    } catch (err: any) {
      connection.log.error('encrypting outbound connection to %a failed', connection.remoteAddr, err)
      throw new EncryptionFailedError(err.message)
    }
  }

  /**
   * Selects one of the given muxers via multistream-select. That
   * muxer will be used for all future streams on the connection.
   */
  async _multiplexOutbound (connection: MultiaddrConnection, muxers: Map<string, StreamMuxerFactory>, options: AbortOptions): Promise<{ stream: MultiaddrConnection, muxerFactory?: StreamMuxerFactory }> {
    const protocols = Array.from(muxers.keys())
    connection.log('outbound selecting muxer %s', protocols)
    try {
      connection.log.trace('selecting stream muxer from %s', protocols)

      const {
        stream,
        protocol
      } = await mss.select(connection, protocols, {
        ...options,
        log: connection.log,
        yieldBytes: true
      })

      connection.log('selected %s as muxer protocol', protocol)
      const muxerFactory = muxers.get(protocol)

      return { stream, muxerFactory }
    } catch (err: any) {
      connection.log.error('error multiplexing outbound connection', err)
      throw new MuxerUnavailableError(String(err))
    }
  }

  /**
   * Registers support for one of the given muxers via multistream-select. The
   * selected muxer will be used for all future streams on the connection.
   */
  async _multiplexInbound (connection: MultiaddrConnection, muxers: Map<string, StreamMuxerFactory>, options: AbortOptions): Promise<{ stream: MultiaddrConnection, muxerFactory?: StreamMuxerFactory }> {
    const protocols = Array.from(muxers.keys())
    connection.log('inbound handling muxers %s', protocols)
    try {
      const { stream, protocol } = await mss.handle(connection, protocols, {
        ...options,
        log: connection.log
      })
      const muxerFactory = muxers.get(protocol)

      return { stream, muxerFactory }
    } catch (err: any) {
      connection.log.error('error multiplexing inbound connection', err)
      throw new MuxerUnavailableError(String(err))
    }
  }
}
