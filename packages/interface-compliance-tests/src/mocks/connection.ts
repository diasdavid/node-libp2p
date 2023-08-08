import { CodeError } from '@libp2p/interface/errors'
import { logger } from '@libp2p/logger'
import * as mss from '@libp2p/multistream-select'
import { peerIdFromString } from '@libp2p/peer-id'
import { duplexPair } from 'it-pair/duplex'
import { pipe } from 'it-pipe'
import { mockMultiaddrConnection } from './multiaddr-connection.js'
import { mockMuxer } from './muxer.js'
import { mockRegistrar } from './registrar.js'
import type { AbortOptions } from '@libp2p/interface'
import type { MultiaddrConnection, Connection, Stream, Direction, ConnectionTimeline, ConnectionStatus } from '@libp2p/interface/connection'
import type { PeerId } from '@libp2p/interface/peer-id'
import type { StreamMuxer, StreamMuxerFactory } from '@libp2p/interface/stream-muxer'
import type { Registrar } from '@libp2p/interface-internal/registrar'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { Duplex, Source } from 'it-stream-types'
import type { Uint8ArrayList } from 'uint8arraylist'

const log = logger('libp2p:mock-connection')

export interface MockConnectionOptions {
  direction?: Direction
  registrar?: Registrar
  muxerFactory?: StreamMuxerFactory
}

interface MockConnectionInit {
  remoteAddr: Multiaddr
  remotePeer: PeerId
  direction: Direction
  maConn: MultiaddrConnection
  muxer: StreamMuxer
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
  public transient: boolean

  private readonly muxer: StreamMuxer
  private readonly maConn: MultiaddrConnection

  constructor (init: MockConnectionInit) {
    const { remoteAddr, remotePeer, direction, maConn, muxer } = init

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
    this.transient = false
  }

  async newStream (protocols: string | string[], options?: AbortOptions): Promise<Stream> {
    if (!Array.isArray(protocols)) {
      protocols = [protocols]
    }

    if (protocols.length === 0) {
      throw new Error('protocols must have a length')
    }

    if (this.status !== 'open') {
      throw new CodeError('connection must be open to create streams', 'ERR_CONNECTION_CLOSED')
    }

    const id = `${Math.random()}`
    const stream = await this.muxer.newStream(id)
    const result = await mss.select(stream, protocols, options)

    stream.protocol = result.protocol
    stream.direction = 'outbound'
    stream.sink = result.stream.sink
    stream.source = result.stream.source

    this.streams.push(stream)

    return stream
  }

  async close (options?: AbortOptions): Promise<void> {
    this.status = 'closing'
    await Promise.all(
      this.streams.map(async s => s.close(options))
    )
    await this.maConn.close()
    this.status = 'closed'
    this.timeline.close = Date.now()
  }

  abort (err: Error): void {
    this.status = 'closing'
    this.streams.forEach(s => {
      s.abort(err)
    })
    this.maConn.abort(err)
    this.status = 'closed'
    this.timeline.close = Date.now()
  }
}

export function mockConnection (maConn: MultiaddrConnection, opts: MockConnectionOptions = {}): Connection {
  const remoteAddr = maConn.remoteAddr
  const remotePeerIdStr = remoteAddr.getPeerId() ?? '12D3KooWCrhmFM1BCPGBkNzbPfDk4cjYmtAYSpZwUBC69Qg2kZyq'

  if (remotePeerIdStr == null) {
    throw new Error('Remote multiaddr must contain a peer id')
  }

  const remotePeer = peerIdFromString(remotePeerIdStr)
  const direction = opts.direction ?? 'inbound'
  const registrar = opts.registrar ?? mockRegistrar()
  const muxerFactory = opts.muxerFactory ?? mockMuxer()

  const muxer = muxerFactory.createStreamMuxer({
    direction,
    onIncomingStream: (muxedStream) => {
      try {
        mss.handle(muxedStream, registrar.getProtocols())
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
    muxer
  })

  return connection
}

export function mockStream (stream: Duplex<AsyncGenerator<Uint8ArrayList>, Source<Uint8ArrayList | Uint8Array>, Promise<void>>): Stream {
  return {
    ...stream,
    close: async () => {},
    closeRead: async () => {},
    closeWrite: async () => {},
    abort: () => {},
    direction: 'outbound',
    protocol: '/foo/1.0.0',
    timeline: {
      open: Date.now()
    },
    metadata: {},
    id: `stream-${Date.now()}`,
    status: 'open',
    readStatus: 'ready',
    writeStatus: 'ready'
  }
}

export interface Peer {
  peerId: PeerId
  registrar: Registrar
}

export function multiaddrConnectionPair (a: { peerId: PeerId, registrar: Registrar }, b: { peerId: PeerId, registrar: Registrar }): [ MultiaddrConnection, MultiaddrConnection ] {
  const [peerBtoPeerA, peerAtoPeerB] = duplexPair<Uint8Array>()

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
