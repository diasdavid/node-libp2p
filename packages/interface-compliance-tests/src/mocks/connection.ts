import { ConnectionClosedError } from '@libp2p/interface'
import { defaultLogger, logger } from '@libp2p/logger'
import * as mss from '@libp2p/multistream-select'
import { peerIdFromString } from '@libp2p/peer-id'
import { closeSource } from '@libp2p/utils/close-source'
import { duplexPair } from 'it-pair/duplex'
import { pipe } from 'it-pipe'
import { Uint8ArrayList } from 'uint8arraylist'
import { mockMultiaddrConnection } from './multiaddr-connection.js'
import { mockMuxer } from './muxer.js'
import { mockRegistrar } from './registrar.js'
import type { AbortOptions, ComponentLogger, Logger, MultiaddrConnection, Connection, Stream, Direction, ConnectionTimeline, ConnectionStatus, PeerId, StreamMuxer, StreamMuxerFactory, NewStreamOptions, ConnectionLimits } from '@libp2p/interface'
import type { Registrar } from '@libp2p/interface-internal'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { Duplex, Source } from 'it-stream-types'

export interface MockConnectionOptions {
  direction?: Direction
  registrar?: Registrar
  muxerFactory?: StreamMuxerFactory
  logger?: ComponentLogger
}

interface MockConnectionInit {
  remoteAddr: Multiaddr
  remotePeer: PeerId
  direction: Direction
  maConn: MultiaddrConnection
  muxer: StreamMuxer
  logger: ComponentLogger
}

class MockConnection implements Connection {
  public id: string
  public remoteAddr: Multiaddr
  public remotePeer: PeerId
  public direction: Direction
  public timeline: ConnectionTimeline
  public multiplexer?: string
  public encryption?: string
  public status: ConnectionStatus
  public streams: Stream[]
  public tags: string[]
  public limits?: ConnectionLimits
  public log: Logger

  private readonly muxer: StreamMuxer
  private readonly maConn: MultiaddrConnection
  private readonly logger: ComponentLogger

  constructor (init: MockConnectionInit) {
    const { remoteAddr, remotePeer, direction, maConn, muxer, logger } = init

    this.id = `mock-connection-${Math.random()}`
    this.remoteAddr = remoteAddr
    this.remotePeer = remotePeer
    this.direction = direction
    this.status = 'open'
    this.direction = direction
    this.timeline = maConn.timeline
    this.multiplexer = 'test-multiplexer'
    this.encryption = 'yes-yes-very-secure'
    this.streams = []
    this.tags = []
    this.muxer = muxer
    this.maConn = maConn
    this.logger = logger
    this.log = logger.forComponent(this.id)
  }

  async newStream (protocols: string | string[], options?: NewStreamOptions): Promise<Stream> {
    if (!Array.isArray(protocols)) {
      protocols = [protocols]
    }

    if (protocols.length === 0) {
      throw new Error('protocols must have a length')
    }

    if (this.status !== 'open') {
      throw new ConnectionClosedError('connection must be open to create streams')
    }

    const id = `${Math.random()}`
    const stream = await this.muxer.newStream(id)
    const result = await mss.select(stream, protocols, {
      ...options,
      log: this.logger.forComponent('libp2p:mock-connection:stream:mss:select')
    })

    stream.protocol = result.protocol
    stream.direction = 'outbound'
    stream.sink = result.stream.sink
    stream.source = result.stream.source

    this.streams.push(stream)

    return stream
  }

  async close (options?: AbortOptions): Promise<void> {
    this.status = 'closing'
    await this.muxer.close()
    await this.maConn.close()
    this.status = 'closed'
    this.timeline.close = Date.now()
  }

  abort (err: Error): void {
    this.status = 'closing'
    this.muxer.abort(err)
    this.maConn.abort(err)
    this.status = 'closed'
    this.timeline.close = Date.now()
  }
}

export function mockConnection (maConn: MultiaddrConnection, opts: MockConnectionOptions = {}): Connection {
  const remoteAddr = maConn.remoteAddr
  const remotePeerIdStr = remoteAddr.getPeerId() ?? '12D3KooWCrhmFM1BCPGBkNzbPfDk4cjYmtAYSpZwUBC69Qg2kZyq'
  const logger = opts.logger ?? defaultLogger()

  if (remotePeerIdStr == null) {
    throw new Error('Remote multiaddr must contain a peer id')
  }

  const remotePeer = peerIdFromString(remotePeerIdStr)
  const direction = opts.direction ?? 'inbound'
  const registrar = opts.registrar ?? mockRegistrar()
  const muxerFactory = opts.muxerFactory ?? mockMuxer()
  const log = logger.forComponent('libp2p:mock-muxer')

  const muxer = muxerFactory.createStreamMuxer({
    direction,
    onIncomingStream: (muxedStream) => {
      try {
        mss.handle(muxedStream, registrar.getProtocols(), {
          log
        })
          .then(({ stream, protocol }) => {
            log('%s: incoming stream opened on %s', direction, protocol)
            muxedStream.protocol = protocol
            muxedStream.sink = stream.sink
            muxedStream.source = stream.source

            connection.streams.push(muxedStream)
            const { handler } = registrar.getHandler(protocol)

            handler({ connection, stream: muxedStream })
          }).catch(err => {
            log.error(err)
          })
      } catch (err: any) {
        log.error(err)
      }
    },
    onStreamEnd: (muxedStream) => {
      connection.streams = connection.streams.filter(stream => stream.id !== muxedStream.id)
    }
  })

  void pipe(
    maConn, muxer, maConn
  )

  const connection = new MockConnection({
    remoteAddr,
    remotePeer,
    direction,
    maConn,
    muxer,
    logger
  })

  return connection
}

export interface StreamInit {
  direction?: Direction
  protocol?: string
  id?: string
}

export function mockStream (stream: Duplex<AsyncGenerator<Uint8ArrayList>, Source<Uint8ArrayList | Uint8Array>, Promise<void>>, init: StreamInit = {}): Stream {
  const id = `stream-${Date.now()}`
  const log = logger(`libp2p:mock-stream:${id}`)

  // ensure stream output is `Uint8ArrayList` as it would be from an actual
  // Stream where everything is length-varint encoded
  const originalSource = stream.source
  stream.source = (async function * (): AsyncGenerator<Uint8ArrayList, any, unknown> {
    for await (const buf of originalSource) {
      if (buf instanceof Uint8Array) {
        yield new Uint8ArrayList(buf)
      } else {
        yield buf
      }
    }
  })()

  const abortSinkController = new AbortController()
  const originalSink = stream.sink.bind(stream)
  stream.sink = async (source) => {
    abortSinkController.signal.addEventListener('abort', () => {
      closeSource(source, log)
    })

    await originalSink(source)
  }

  const mockStream: Stream = {
    ...stream,
    close: async (options) => {
      await mockStream.closeRead(options)
      await mockStream.closeWrite(options)
    },
    closeRead: async () => {
      closeSource(originalSource, log)
      mockStream.timeline.closeRead = Date.now()

      if (mockStream.timeline.closeWrite != null) {
        mockStream.timeline.close = Date.now()
      }
    },
    closeWrite: async () => {
      abortSinkController.abort()
      mockStream.timeline.closeWrite = Date.now()

      if (mockStream.timeline.closeRead != null) {
        mockStream.timeline.close = Date.now()
      }
    },
    abort: () => {
      closeSource(originalSource, log)
      mockStream.timeline.closeWrite = Date.now()
      mockStream.timeline.closeRead = Date.now()
      mockStream.timeline.close = Date.now()
    },
    direction: 'outbound',
    protocol: '/foo/1.0.0',
    timeline: {
      open: Date.now()
    },
    metadata: {},
    id: `stream-${Date.now()}`,
    status: 'open',
    readStatus: 'ready',
    writeStatus: 'ready',
    log: logger('mock-stream'),
    ...init
  }

  return mockStream
}

export interface StreamPairInit {
  duplex: Duplex<AsyncGenerator<Uint8ArrayList>, Source<Uint8ArrayList | Uint8Array>, Promise<void>>
  init?: StreamInit
}

export function streamPair (a: StreamPairInit, b: StreamPairInit, init: StreamInit = {}): [Stream, Stream] {
  return [
    mockStream(a.duplex, {
      direction: 'outbound',
      ...init,
      ...(a.init ?? {})
    }),
    mockStream(b.duplex, {
      direction: 'inbound',
      ...init,
      ...(b.init ?? {})
    })
  ]
}

export interface Peer {
  peerId: PeerId
  registrar: Registrar
}

export function multiaddrConnectionPair (a: { peerId: PeerId, registrar: Registrar }, b: { peerId: PeerId, registrar: Registrar }): [ MultiaddrConnection, MultiaddrConnection ] {
  const [peerBtoPeerA, peerAtoPeerB] = duplexPair<Uint8Array | Uint8ArrayList>()

  return [
    mockMultiaddrConnection(peerAtoPeerB, b.peerId),
    mockMultiaddrConnection(peerBtoPeerA, a.peerId)
  ]
}

export function connectionPair (a: { peerId: PeerId, registrar: Registrar }, b: { peerId: PeerId, registrar: Registrar }): [ Connection, Connection ] {
  const [peerBtoPeerA, peerAtoPeerB] = multiaddrConnectionPair(a, b)

  return [
    mockConnection(peerBtoPeerA, {
      registrar: a.registrar
    }),
    mockConnection(peerAtoPeerB, {
      registrar: b.registrar
    })
  ]
}
