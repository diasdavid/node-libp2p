/* eslint-env mocha */

import { expect } from 'aegir/chai'
import sinon from 'sinon'
import { createNode } from '../utils/creators/peer.js'
import { createBaseOptions } from '../utils/base-options.browser.js'
import type { Libp2pNode } from '../../src/libp2p.js'
import type { DefaultConnectionManager } from '../../src/connection-manager/index.js'
import { mockConnection, mockDuplex, mockMultiaddrConnection } from '@libp2p/interface-mocks'
import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import { CustomEvent } from '@libp2p/interfaces/events'
import { KEEP_ALIVE } from '@libp2p/interface-peer-store/tags'
import pWaitFor from 'p-wait-for'

describe('Connection Manager', () => {
  let libp2p: Libp2pNode

  afterEach(async () => {
    sinon.restore()

    if (libp2p != null) {
      await libp2p.stop()
    }
  })

  it('should be able to create without metrics', async () => {
    libp2p = await createNode({
      config: createBaseOptions(),
      started: false
    })

    const spy = sinon.spy(libp2p.components.getConnectionManager() as DefaultConnectionManager, 'start')

    await libp2p.start()
    expect(spy).to.have.property('callCount', 1)
    expect(libp2p.components.getMetrics()).to.not.exist()
  })

  it('should be able to create with metrics', async () => {
    libp2p = await createNode({
      config: createBaseOptions({
        metrics: {
          enabled: true
        }
      }),
      started: false
    })

    const spy = sinon.spy(libp2p.components.getConnectionManager() as DefaultConnectionManager, 'start')

    await libp2p.start()
    expect(spy).to.have.property('callCount', 1)
    expect(libp2p.components.getMetrics()).to.exist()
  })

  it('should close connections with low tag values first', async () => {
    const max = 5
    libp2p = await createNode({
      config: createBaseOptions({
        connectionManager: {
          maxConnections: max,
          minConnections: 2
        }
      }),
      started: false
    })

    await libp2p.start()

    const connectionManager = libp2p.components.getConnectionManager() as DefaultConnectionManager
    const connectionManagerMaybeDisconnectOneSpy = sinon.spy(connectionManager, '_maybePruneConnections')
    const spies = new Map<number, sinon.SinonSpy<[], Promise<void>>>()

    // Add 1 connection too many
    for (let i = 0; i < max + 1; i++) {
      const connection = mockConnection(mockMultiaddrConnection(mockDuplex(), await createEd25519PeerId()))
      const spy = sinon.spy(connection, 'close')

      const value = i * 10
      spies.set(value, spy)
      await libp2p.peerStore.tagPeer(connection.remotePeer, 'test-tag', {
        value
      })

      await connectionManager._onConnect(new CustomEvent('connection', { detail: connection }))
    }

    // get the lowest value
    const lowest = Array.from(spies.keys()).sort((a, b) => {
      if (a > b) {
        return 1
      }

      if (a < b) {
        return -1
      }

      return 0
    })[0]
    const lowestSpy = spies.get(lowest)

    expect(connectionManagerMaybeDisconnectOneSpy.callCount).to.equal(1)
    expect(lowestSpy).to.have.property('callCount', 1)
  })

  it('should close connection when the maximum has been reached even without tags', async () => {
    const max = 5
    libp2p = await createNode({
      config: createBaseOptions({
        connectionManager: {
          maxConnections: max,
          minConnections: 0
        }
      }),
      started: false
    })

    await libp2p.start()

    const connectionManager = libp2p.components.getConnectionManager() as DefaultConnectionManager
    const connectionManagerMaybeDisconnectOneSpy = sinon.spy(connectionManager, '_maybePruneConnections')

    // Add 1 too many connections
    const spy = sinon.spy()
    for (let i = 0; i < max + 1; i++) {
      const connection = mockConnection(mockMultiaddrConnection(mockDuplex(), await createEd25519PeerId()))
      sinon.stub(connection, 'close').callsFake(async () => spy()) // eslint-disable-line
      await connectionManager._onConnect(new CustomEvent('connection', { detail: connection }))
    }

    expect(connectionManagerMaybeDisconnectOneSpy.callCount).to.equal(1)
    expect(spy).to.have.property('callCount', 1)
  })

  it('should fail if the connection manager has mismatched connection limit options', async () => {
    await expect(createNode({
      config: createBaseOptions({
        connectionManager: {
          maxConnections: 5,
          minConnections: 6
        }
      }),
      started: false
    })).to.eventually.rejected('maxConnections must be greater')
  })

  it('should reconnect to important peers on startup', async () => {
    const peerId = await createEd25519PeerId()

    libp2p = await createNode({
      config: createBaseOptions(),
      started: false
    })

    const connectionManager = libp2p.components.getConnectionManager() as DefaultConnectionManager
    const connectionManagerOpenConnectionSpy = sinon.spy(connectionManager, 'openConnection')

    await libp2p.start()

    expect(connectionManagerOpenConnectionSpy.called).to.be.false('Attempted to connect to peers')

    await libp2p.peerStore.tagPeer(peerId, KEEP_ALIVE)

    await libp2p.stop()
    await libp2p.start()

    await pWaitFor(() => connectionManagerOpenConnectionSpy.called, {
      interval: 100
    })

    expect(connectionManagerOpenConnectionSpy.called).to.be.true('Did not attempt to connect to important peer')
    expect(connectionManagerOpenConnectionSpy.getCall(0).args[0].toString()).to.equal(peerId.toString(), 'Attempted to connect to the wrong peer')
  })
})
