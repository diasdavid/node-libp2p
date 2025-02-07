import { stop } from '@libp2p/interface'
import { expect } from 'aegir/chai'
import delay from 'delay'
import drain from 'it-drain'
import { pushable } from 'it-pushable'
import pDefer from 'p-defer'
import { pEvent } from 'p-event'
import pRetry from 'p-retry'
import pWaitFor from 'p-wait-for'
import { raceSignal } from 'race-signal'
import { isValidTick } from '../is-valid-tick.js'
import { createPeer, getTransportManager, getUpgrader } from './utils.js'
import type { TestSetup } from '../index.js'
import type { Echo } from '@libp2p/echo'
import type { Connection, Libp2p, Stream, StreamHandler } from '@libp2p/interface'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { MultiaddrMatcher } from '@multiformats/multiaddr-matcher'
import type { Libp2pInit } from 'libp2p'
import type { DeferredPromise } from 'p-defer'

export interface TransportTestFixtures {
  /**
   * Addresses that will be used to dial listeners - both addresses must resolve
   * to the same node
   */
  dialAddrs?: [Multiaddr, Multiaddr]

  /**
   * Filter out any addresses that cannot be dialed by the transport
   */
  dialMultiaddrMatcher: MultiaddrMatcher

  /**
   * Filter out any addresses that cannot be listened on by the transport
   */
  listenMultiaddrMatcher: MultiaddrMatcher

  /**
   * Config that creates a libp2p node that can dial a listener
   */
  dialer: Libp2pInit

  /**
   * Config that creates a libp2p node that can accept dials
   */
  listener?: Libp2pInit
}

async function getSetup (common: TestSetup<TransportTestFixtures>): Promise<{ dialer: Libp2p<{ echo: Echo }>, listener?: Libp2p<{ echo: Echo }>, dialAddrs: Multiaddr[], dialMultiaddrMatcher: MultiaddrMatcher, listenMultiaddrMatcher: MultiaddrMatcher }> {
  const setup = await common.setup()
  const dialer = await createPeer(setup.dialer)
  let listener

  if (setup.listener != null) {
    listener = await createPeer(setup.listener)
  }

  const dialAddrs = listener?.getMultiaddrs() ?? setup.dialAddrs

  if (dialAddrs == null) {
    throw new Error('Listener config or dial addresses must be specified')
  }

  return {
    dialer,
    listener,
    dialAddrs: dialAddrs.filter(ma => setup.dialMultiaddrMatcher.exactMatch(ma)),
    dialMultiaddrMatcher: setup.dialMultiaddrMatcher,
    listenMultiaddrMatcher: setup.listenMultiaddrMatcher
  }
}

export default (common: TestSetup<TransportTestFixtures>): void => {
  describe('interface-transport', () => {
    let dialer: Libp2p<{ echo: Echo }>
    let listener: Libp2p<{ echo: Echo }> | undefined
    let dialAddrs: Multiaddr[]
    let dialMultiaddrMatcher: MultiaddrMatcher

    afterEach(async () => {
      await stop(dialer, listener)
      await common.teardown()
    })

    it('simple', async () => {
      ({ dialer, listener, dialAddrs } = await getSetup(common))

      const input = Uint8Array.from([0, 1, 2, 3, 4])
      const output = await dialer.services.echo.echo(dialAddrs[0], input, {
        signal: AbortSignal.timeout(5000)
      })

      expect(output).to.equalBytes(input)
    })

    it('should listen on multiple addresses', async () => {
      ({ dialer, listener, dialAddrs } = await getSetup(common))

      const input = Uint8Array.from([0, 1, 2, 3, 4])

      await expect(dialer.services.echo.echo(dialAddrs[0], input, {
        signal: AbortSignal.timeout(5000)
      })).to.eventually.deep.equal(input)

      await expect(dialer.services.echo.echo(dialAddrs[1], input, {
        signal: AbortSignal.timeout(5000)
      })).to.eventually.deep.equal(input)
    })

    it('can close connections', async () => {
      ({ dialer, listener, dialAddrs } = await getSetup(common))

      const conn = await dialer.dial(dialAddrs[0], {
        signal: AbortSignal.timeout(5000)
      })

      await conn.close()
      expect(isValidTick(conn.timeline.close)).to.equal(true)
    })

    it('abort before dialing throws AbortError', async () => {
      ({ dialer, listener, dialAddrs } = await getSetup(common))

      const controller = new AbortController()
      controller.abort()

      await expect(dialer.dial(dialAddrs[0], {
        signal: controller.signal
      })).to.eventually.be.rejected()
        .with.property('name', 'AbortError')
    })

    it('should close all streams when the connection closes', async () => {
      ({ dialer, listener, dialAddrs } = await getSetup(common))

      let incomingConnectionPromise: DeferredPromise<Connection> | undefined

      if (listener != null) {
        incomingConnectionPromise = pDefer<Connection>()

        listener.addEventListener('connection:open', (event) => {
          const conn = event.detail

          if (conn.remotePeer.equals(dialer.peerId)) {
            incomingConnectionPromise?.resolve(conn)
          }
        })
      }

      const connection = await dialer.dial(dialAddrs[0])
      let remoteConn: Connection | undefined

      if (incomingConnectionPromise != null) {
        remoteConn = await incomingConnectionPromise.promise
      }

      for (let i = 0; i < 5; i++) {
        await connection.newStream('/echo/1.0.0', {
          maxOutboundStreams: 5
        })
      }

      const streams = connection.streams

      // Close the connection and verify all streams have been closed
      await connection.close()

      await pWaitFor(() => connection.streams.length === 0, {
        timeout: 5000
      })

      if (remoteConn != null) {
        await pWaitFor(() => remoteConn.streams.length === 0, {
          timeout: 5000
        })
      }

      expect(streams.find(stream => stream.status === 'open')).to.be.undefined()
    })

    it('should not handle connection if upgradeInbound rejects', async function () {
      ({ dialer, listener, dialAddrs, dialMultiaddrMatcher } = await getSetup(common))

      if (listener == null) {
        return this.skip()
      }

      const upgrader = getUpgrader(listener)
      upgrader.upgradeInbound = async () => {
        await delay(100)
        throw new Error('Oh noes!')
      }

      // transports with their own muxers/encryption will perform the upgrade
      // after the connection has been established (e.g. peer ids have been
      // exchanged) so perform the dial and wait for the remote to attempt the
      // upgrade - if it fails the listener should close the underlying
      // connection which should remove the it from the dialer's connection map
      await dialer.dial(dialAddrs[0]).catch(() => {})
      await delay(1000)

      expect(dialer.getConnections().filter(conn => {
        return dialMultiaddrMatcher.exactMatch(conn.remoteAddr)
      })).to.have.lengthOf(0)

      if (listener != null) {
        const remoteConnections = listener.getConnections(dialer.peerId)
          .filter(conn => dialMultiaddrMatcher.exactMatch(conn.remoteAddr))
        expect(remoteConnections).to.have.lengthOf(0)
      }
    })

    it('should omit peerid in listening addresses', async function () {
      ({ dialer, listener, dialAddrs } = await getSetup(common))

      if (listener == null) {
        return this.skip()
      }

      const tm = getTransportManager(listener)
      const transportListeners = tm.getListeners()

      for (const transportListener of transportListeners) {
        for (const ma of transportListener.getAddrs()) {
          expect(ma.toString()).to.not.include(`/p2p/${listener.peerId}`)
        }
      }
    })

    it('should handle one big write', async function () {
      const timeout = 120_000
      this.timeout(timeout);
      ({ dialer, listener, dialAddrs } = await getSetup(common))

      const input = new Uint8Array(1024 * 1024 * 10).fill(5)
      const output = await dialer.services.echo.echo(dialAddrs[0], input, {
        signal: AbortSignal.timeout(timeout)
      })

      expect(output).to.equalBytes(input)
    })

    it('should handle many small writes', async function () {
      const timeout = 120_000
      this.timeout(timeout);
      ({ dialer, listener, dialAddrs } = await getSetup(common))

      for (let i = 0; i < 2000; i++) {
        const input = new Uint8Array(1024).fill(5)
        const output = await dialer.services.echo.echo(dialAddrs[0], input, {
          signal: AbortSignal.timeout(timeout)
        })

        expect(output).to.equalBytes(input)
      }
    })

    it('can close a stream for reading but send a large amount of data', async function () {
      const timeout = 120_000
      this.timeout(timeout);
      ({ dialer, listener, dialAddrs } = await getSetup(common))

      if (listener == null) {
        return this.skip()
      }

      const protocol = '/send-data/1.0.0'
      const chunkSize = 1024
      const bytes = chunkSize * 1024 * 10
      const deferred = pDefer()

      await listener.handle(protocol, ({ stream }) => {
        Promise.resolve().then(async () => {
          let read = 0

          for await (const buf of stream.source) {
            read += buf.byteLength

            if (read === bytes) {
              deferred.resolve()
              break
            }
          }
        })
          .catch(err => {
            deferred.reject(err)
            stream.abort(err)
          })
      })

      const stream = await dialer.dialProtocol(dialAddrs[0], protocol)

      await stream.closeRead()

      await stream.sink((async function * () {
        for (let i = 0; i < bytes; i += chunkSize) {
          yield new Uint8Array(chunkSize)
        }
      })())

      await stream.close()

      await deferred.promise
    })

    it('can close a stream for writing but receive a large amount of data', async function () {
      const timeout = 120_000
      this.timeout(timeout);
      ({ dialer, listener, dialAddrs } = await getSetup(common))

      if (listener == null) {
        return this.skip()
      }

      const protocol = '/receive-data/1.0.0'
      const chunkSize = 1024
      const bytes = chunkSize * 1024 * 10
      const deferred = pDefer()

      await listener.handle(protocol, ({ stream }) => {
        Promise.resolve().then(async () => {
          await stream.sink((async function * () {
            for (let i = 0; i < bytes; i += chunkSize) {
              yield new Uint8Array(chunkSize)
            }
          })())

          await stream.close()
        })
          .catch(err => {
            deferred.reject(err)
            stream.abort(err)
          })
      })

      const stream = await dialer.dialProtocol(dialAddrs[0], protocol)

      await stream.closeWrite()

      let read = 0

      for await (const buf of stream.source) {
        read += buf.byteLength
      }

      expect(read).to.equal(bytes)
    })

    it('can close local stream for writing and reading while a remote stream is writing', async function () {
      ({ dialer, listener, dialAddrs } = await getSetup(common))

      if (listener == null) {
        return this.skip()
      }

      /**
       * NodeA             NodeB
       * |   <--- STOP_SENDING |
       * | FIN --->            |
       * |            <--- FIN |
       * | FIN_ACK --->        |
       * |        <--- FIN_ACK |
       */

      const getRemoteStream = pDefer<Stream>()
      const protocol = '/close-local-while-remote-writes/1.0.0'

      const streamHandler: StreamHandler = ({ stream }) => {
        void Promise.resolve().then(async () => {
          getRemoteStream.resolve(stream)
        })
      }

      await listener.handle(protocol, (info) => {
        streamHandler(info)
      }, {
        runOnLimitedConnection: true
      })

      const connection = await dialer.dial(dialAddrs[0])

      // open a stream on the echo protocol
      const stream = await connection.newStream(protocol, {
        runOnLimitedConnection: true
      })

      // close the write end immediately
      const p = stream.closeWrite()

      const remoteStream = await getRemoteStream.promise
      // close the readable end of the remote stream
      await remoteStream.closeRead()

      // keep the remote write end open, this should delay the FIN_ACK reply to the local stream
      const remoteInputStream = pushable<Uint8Array>()
      void remoteStream.sink(remoteInputStream)

      // wait for remote to receive local close-write
      await pRetry(() => {
        if (remoteStream.readStatus !== 'closed') {
          throw new Error('Remote stream read status ' + remoteStream.readStatus)
        }
      }, {
        minTimeout: 100
      })

      // remote closes write
      remoteInputStream.end()

      // wait to receive FIN_ACK
      await p

      // wait for remote to notice closure
      await pRetry(() => {
        if (remoteStream.status !== 'closed') {
          throw new Error('Remote stream not closed')
        }
      })

      assertStreamClosed(stream)
      assertStreamClosed(remoteStream)
    })

    it('can close local stream for writing and reading while a remote stream is writing using source/sink', async function () {
      ({ dialer, listener, dialAddrs } = await getSetup(common))

      if (listener == null) {
        return this.skip()
      }

      /**
       * NodeA             NodeB
       * | FIN --->            |
       * |            <--- FIN |
       * | FIN_ACK --->        |
       * |        <--- FIN_ACK |
       */

      const getRemoteStream = pDefer<Stream>()
      const protocol = '/close-local-while-remote-reads/1.0.0'

      const streamHandler: StreamHandler = ({ stream }) => {
        void Promise.resolve().then(async () => {
          getRemoteStream.resolve(stream)
        })
      }

      await listener.handle(protocol, (info) => {
        streamHandler(info)
      }, {
        runOnLimitedConnection: true
      })

      const connection = await dialer.dial(dialAddrs[0])

      // open a stream on the echo protocol
      const stream = await connection.newStream(protocol, {
        runOnLimitedConnection: true
      })

      // keep the remote write end open, this should delay the FIN_ACK reply to the local stream
      const p = stream.sink([])

      const remoteStream = await getRemoteStream.promise
      // close the readable end of the remote stream
      await remoteStream.closeRead()
      // readable end should finish
      await drain(remoteStream.source)

      // wait for remote to receive local close-write
      await pRetry(() => {
        if (remoteStream.readStatus !== 'closed') {
          throw new Error('Remote stream read status ' + remoteStream.readStatus)
        }
      }, {
        minTimeout: 100
      })

      // remote closes write
      await remoteStream.sink([])

      // wait to receive FIN_ACK
      await p

      // close read end of stream
      await stream.closeRead()
      // readable end should finish
      await drain(stream.source)

      // wait for remote to notice closure
      await pRetry(() => {
        if (remoteStream.status !== 'closed') {
          throw new Error('Remote stream not closed')
        }
      })

      assertStreamClosed(stream)
      assertStreamClosed(remoteStream)
    })
  })

  describe('events', () => {
    let dialer: Libp2p<{ echo: Echo }>
    let listener: Libp2p<{ echo: Echo }> | undefined
    let listenMultiaddrMatcher: MultiaddrMatcher

    afterEach(async () => {
      await stop(dialer, listener)
      await common.teardown()
    })

    it('emits listening', async function () {
      ({ dialer, listener, listenMultiaddrMatcher } = await getSetup(common))

      if (listener == null) {
        return this.skip()
      }

      await listener.stop()

      const transportListeningPromise = pDefer()

      listener.addEventListener('transport:listening', (event) => {
        const transportListener = event.detail

        if (transportListener.getAddrs().some(ma => listenMultiaddrMatcher.exactMatch(ma))) {
          transportListeningPromise.resolve()
        }
      })

      await listener.start()

      await raceSignal(transportListeningPromise.promise, AbortSignal.timeout(1000), {
        errorMessage: 'Did not emit listening event'
      })
    })

    it('emits close', async function () {
      ({ dialer, listener } = await getSetup(common))

      if (listener == null) {
        return this.skip()
      }

      const transportManager = getTransportManager(listener)
      const transportListener = transportManager.getListeners()
        .filter(listener => listener.getAddrs().some(ma => listenMultiaddrMatcher.exactMatch(ma)))
        .pop()

      if (transportListener == null) {
        throw new Error('Could not find address listener')
      }

      const p = pEvent(transportListener, 'close')

      await listener.stop()

      await raceSignal(p, AbortSignal.timeout(1000), {
        errorMessage: 'Did not emit close event'
      })
    })
  })
}

function assertStreamClosed (stream: Stream): void {
  expect(stream.status).to.equal('closed')
  expect(stream.readStatus).to.equal('closed')
  expect(stream.writeStatus).to.equal('closed')

  expect(stream.timeline.close).to.be.a('number')
  expect(stream.timeline.closeRead).to.be.a('number')
  expect(stream.timeline.closeWrite).to.be.a('number')
}
