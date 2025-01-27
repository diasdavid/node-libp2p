/* eslint-env mocha */

import { generateKeyPair } from '@libp2p/crypto/keys'
import { NotFoundError } from '@libp2p/interface'
import { peerLogger } from '@libp2p/logger'
import { PeerMap } from '@libp2p/peer-collections'
import { peerIdFromPrivateKey } from '@libp2p/peer-id'
import { multiaddr, resolvers } from '@multiformats/multiaddr'
import { WebRTC } from '@multiformats/multiaddr-matcher'
import { expect } from 'aegir/chai'
import delay from 'delay'
import pDefer from 'p-defer'
import { raceSignal } from 'race-signal'
import sinon from 'sinon'
import { type StubbedInstance, stubInterface } from 'sinon-ts'
import { DialQueue } from '../../src/connection-manager/dial-queue.js'
import type { ComponentLogger, Connection, ConnectionGater, PeerId, PeerRouting, PeerStore, Transport } from '@libp2p/interface'
import type { TransportManager } from '@libp2p/interface-internal'

describe('dial queue', () => {
  let components: {
    peerId: PeerId
    peerStore: StubbedInstance<PeerStore>
    peerRouting: StubbedInstance<PeerRouting>
    transportManager: StubbedInstance<TransportManager>
    connectionGater: StubbedInstance<ConnectionGater>
    logger: ComponentLogger
  }
  let dialer: DialQueue

  beforeEach(async () => {
    const peerId = peerIdFromPrivateKey(await generateKeyPair('Ed25519'))

    components = {
      peerId,
      peerStore: stubInterface<PeerStore>(),
      peerRouting: stubInterface<PeerRouting>(),
      transportManager: stubInterface<TransportManager>(),
      connectionGater: stubInterface<ConnectionGater>(),
      logger: peerLogger(peerId)
    }
  })

  afterEach(() => {
    if (dialer != null) {
      dialer.stop()
    }
  })

  it('should end when a single multiaddr dials succeeds', async () => {
    const connection = stubInterface<Connection>()
    const deferredConn = pDefer<Connection>()
    const actions: Record<string, () => Promise<Connection>> = {
      '/ip4/127.0.0.1/tcp/1231': async () => Promise.reject(new Error('dial failure')),
      '/ip4/127.0.0.1/tcp/1232': async () => Promise.resolve(connection),
      '/ip4/127.0.0.1/tcp/1233': async () => deferredConn.promise
    }

    components.transportManager.dialTransportForMultiaddr.returns(stubInterface<Transport>())
    components.transportManager.dial.callsFake(async ma => {
      const maStr = ma.toString()
      const action = actions[maStr]

      if (action != null) {
        return action()
      }

      throw new Error(`No action found for multiaddr ${maStr}`)
    })

    dialer = new DialQueue(components, {
      maxParallelDials: 2
    })

    // Make sure that dial attempt comes back before terminating last dial action
    await expect(dialer.dial(Object.keys(actions).map(str => multiaddr(str))))
      .to.eventually.equal(connection)

    // End third dial attempt
    deferredConn.resolve()

    // prevent playwright-core error Error: Cannot find parent object page@... to create handle@...
    await expect(deferredConn.promise).to.eventually.be.undefined()
  })

  it('should load addresses from the peer routing when peer id is not in the peer store', async () => {
    const peerId = peerIdFromPrivateKey(await generateKeyPair('Ed25519'))
    const connection = stubInterface<Connection>()
    const ma = multiaddr('/ip4/127.0.0.1/tcp/4001')

    components.peerStore.get.withArgs(peerId).rejects(new NotFoundError('Not found'))
    components.peerRouting.findPeer.withArgs(peerId).resolves({
      id: peerId,
      multiaddrs: [
        ma
      ]
    })

    components.transportManager.dialTransportForMultiaddr.returns(stubInterface<Transport>())
    components.transportManager.dial.withArgs(ma.encapsulate(`/p2p/${peerId}`)).resolves(connection)

    dialer = new DialQueue(components)

    await expect(dialer.dial(peerId)).to.eventually.equal(connection)
  })

  it('should load addresses from the peer routing when none are present in the peer store', async () => {
    const peerId = peerIdFromPrivateKey(await generateKeyPair('Ed25519'))
    const connection = stubInterface<Connection>()
    const ma = multiaddr('/ip4/127.0.0.1/tcp/4001')

    components.peerStore.get.withArgs(peerId).resolves({
      id: peerId,
      protocols: [],
      metadata: new Map(),
      tags: new Map(),
      addresses: []
    })
    components.peerRouting.findPeer.withArgs(peerId).resolves({
      id: peerId,
      multiaddrs: [
        ma
      ]
    })

    components.transportManager.dialTransportForMultiaddr.returns(stubInterface<Transport>())
    components.transportManager.dial.withArgs(ma.encapsulate(`/p2p/${peerId}`)).resolves(connection)

    dialer = new DialQueue(components)

    await expect(dialer.dial(peerId)).to.eventually.equal(connection)
  })

  it('should end when a single multiaddr dials succeeds even when a final dial fails', async () => {
    const connection = stubInterface<Connection>()
    const deferredConn = pDefer<Connection>()
    const actions: Record<string, () => Promise<Connection>> = {
      '/ip4/127.0.0.1/tcp/1231': async () => Promise.reject(new Error('dial failure')),
      '/ip4/127.0.0.1/tcp/1232': async () => Promise.resolve(connection),
      '/ip4/127.0.0.1/tcp/1233': async () => deferredConn.promise
    }

    components.transportManager.dialTransportForMultiaddr.returns(stubInterface<Transport>())
    components.transportManager.dial.callsFake(async ma => {
      const maStr = ma.toString()
      const action = actions[maStr]

      if (action != null) {
        return action()
      }

      throw new Error(`No action found for multiaddr ${maStr}`)
    })

    dialer = new DialQueue(components, {
      maxParallelDials: 2
    })

    // Make sure that dial attempt comes back before terminating last dial action
    await expect(dialer.dial(Object.keys(actions).map(str => multiaddr(str))))
      .to.eventually.equal(connection)

    // End third dial attempt
    deferredConn.reject(new Error('Oh noes!'))

    // prevent playwright-core error Error: Cannot find parent object page@... to create handle@...
    await expect(deferredConn.promise).to.eventually.be.rejected()
  })

  it('should throw an AggregateError if all dials fail', async () => {
    const actions: Record<string, () => Promise<Connection>> = {
      '/ip4/127.0.0.1/tcp/1231': async () => Promise.reject(new Error('dial failure')),
      '/ip4/127.0.0.1/tcp/1232': async () => Promise.reject(new Error('dial failure')),
      '/ip4/127.0.0.1/tcp/1233': async () => Promise.reject(new Error('dial failure'))
    }
    dialer = new DialQueue(components, {
      maxParallelDials: 2
    })

    components.transportManager.dialTransportForMultiaddr.returns(stubInterface<Transport>())
    components.transportManager.dial.callsFake(async ma => {
      const maStr = ma.toString()
      const action = actions[maStr]

      if (action != null) {
        return action()
      }

      throw new Error(`No action found for multiaddr ${maStr}`)
    })

    sinon.spy(actions, '/ip4/127.0.0.1/tcp/1231')
    sinon.spy(actions, '/ip4/127.0.0.1/tcp/1232')
    sinon.spy(actions, '/ip4/127.0.0.1/tcp/1233')

    try {
      await dialer.dial(Object.keys(actions).map(str => multiaddr(str)))
      expect.fail('Should have thrown')
    } catch (err: any) {
      expect(err).to.have.property('name', 'AggregateError')
    }

    expect(actions['/ip4/127.0.0.1/tcp/1231']).to.have.property('callCount', 1)
    expect(actions['/ip4/127.0.0.1/tcp/1232']).to.have.property('callCount', 1)
    expect(actions['/ip4/127.0.0.1/tcp/1233']).to.have.property('callCount', 1)
  })

  it('should handle a large number of addrs', async () => {
    const reject = sinon.stub().callsFake(async () => Promise.reject(new Error('dial failure')))
    const actions: Record<string, () => Promise<Connection>> = {}
    const addrs = [...new Array(25)].map((_, index) => `/ip4/127.0.0.1/tcp/12${index + 1}`)
    addrs.forEach(addr => {
      actions[addr] = reject
    })

    dialer = new DialQueue(components, {
      maxParallelDials: 2
    })

    components.transportManager.dialTransportForMultiaddr.returns(stubInterface<Transport>())
    components.transportManager.dial.callsFake(async ma => {
      const maStr = ma.toString()
      const action = actions[maStr]

      if (action != null) {
        return action()
      }

      throw new Error(`No action found for multiaddr ${maStr}`)
    })

    try {
      await dialer.dial(Object.keys(actions).map(str => multiaddr(str)))
      expect.fail('Should have thrown')
    } catch (err: any) {
      expect(err).to.have.property('name', 'AggregateError')
    }

    expect(reject).to.have.property('callCount', addrs.length)
  })

  it('should ignore DNS addresses for other peers', async () => {
    const remotePeer = peerIdFromPrivateKey(await generateKeyPair('Ed25519'))
    const otherRemotePeer = peerIdFromPrivateKey(await generateKeyPair('Ed25519'))
    const ma = multiaddr(`/dnsaddr/example.com/p2p/${remotePeer}`)
    const maStr = `/ip4/123.123.123.123/tcp/2348/p2p/${remotePeer}`
    const resolvedAddresses = [
      `/ip4/234.234.234.234/tcp/4213/p2p/${otherRemotePeer}`,
      maStr
    ]

    let resolvedDNSAddrs = false
    let dialedBadAddress = false

    // simulate a DNSAddr that resolves to multiple different peers like
    // bootstrap.libp2p.io
    resolvers.set('dnsaddr', async (addr) => {
      if (addr.equals(ma)) {
        resolvedDNSAddrs = true
        return resolvedAddresses
      }

      return []
    })

    dialer = new DialQueue(components, {
      maxParallelDials: 50
    })
    components.transportManager.dialTransportForMultiaddr.returns(stubInterface<Transport>())

    const connection = stubInterface<Connection>({
      remotePeer
    })

    components.transportManager.dial.callsFake(async (ma, opts = {}) => {
      if (ma.toString() === maStr) {
        await delay(100)
        return connection
      }

      dialedBadAddress = true
      throw new Error('Could not dial address')
    })

    await expect(dialer.dial(ma)).to.eventually.equal(connection)
    expect(resolvedDNSAddrs).to.be.true('Did not resolve DNSAddrs')
    expect(dialedBadAddress).to.be.false('Dialed address with wrong peer id')

    resolvers.delete('dnsaddr')
  })

  it('should dial WebRTC address with peer id appended', async () => {
    const remotePeer = peerIdFromPrivateKey(await generateKeyPair('Ed25519'))
    const relayPeer = peerIdFromPrivateKey(await generateKeyPair('Ed25519'))
    const ma = multiaddr(`/ip4/123.123.123.123/tcp/123/ws/p2p/${relayPeer}/p2p-circuit/webrtc`)
    const maWithPeer = `${ma}/p2p/${remotePeer}`

    components.transportManager.dialTransportForMultiaddr.callsFake(ma => {
      if (WebRTC.exactMatch(ma)) {
        return stubInterface<Transport>()
      }
    })
    components.peerStore.get.withArgs(remotePeer).resolves({
      id: remotePeer,
      protocols: [],
      metadata: new Map(),
      tags: new Map(),
      addresses: [{
        multiaddr: ma,
        isCertified: true
      }]
    })

    const connection = stubInterface<Connection>({
      remotePeer
    })

    components.transportManager.dial.callsFake(async (ma, opts = {}) => {
      if (ma.toString() === maWithPeer) {
        await delay(100)
        return connection
      }

      throw new Error('Could not dial address')
    })

    dialer = new DialQueue(components)
    await expect(dialer.dial(remotePeer)).to.eventually.equal(connection)
  })

  it('should return existing connection when dialing a multiaddr without a peer id', async () => {
    const remotePeer = peerIdFromPrivateKey(await generateKeyPair('Ed25519'))
    const ip = multiaddr('/ip4/123.123.123.123')
    const addr1 = ip.encapsulate('/tcp/123')
    const addr2 = ip.encapsulate('/tcp/321')

    const existingConnection = stubInterface<Connection>({
      limits: {
        bytes: 100n
      },
      remotePeer,
      remoteAddr: addr1.encapsulate(`/p2p/${remotePeer}`),
      status: 'open'
    })

    const newConnection = stubInterface<Connection>({
      limits: {
        bytes: 100n
      },
      remotePeer,
      remoteAddr: addr2.encapsulate(`/p2p/${remotePeer}`),
      status: 'open'
    })

    const connections = new PeerMap<Connection[]>()
    connections.set(remotePeer, [existingConnection])

    components.transportManager.dialTransportForMultiaddr.callsFake(ma => {
      return stubInterface<Transport>()
    })
    components.transportManager.dial.callsFake(async (ma, opts = {}) => newConnection)
    dialer = new DialQueue(components, { connections })

    await expect(dialer.dial(addr2)).to.eventually.equal(existingConnection)
  })

  it('should return new connection when existing connection to same peer is worse', async () => {
    const remotePeer = peerIdFromPrivateKey(await generateKeyPair('Ed25519'))
    const ip = multiaddr('/ip4/123.123.123.123')
    const addr1 = ip.encapsulate('/tcp/123')
    const addr2 = ip.encapsulate('/tcp/321')

    const existingConnection = stubInterface<Connection>({
      limits: {
        bytes: 100n
      },
      remotePeer,
      remoteAddr: addr1.encapsulate(`/p2p/${remotePeer}`),
      status: 'open'
    })

    const newConnection = stubInterface<Connection>({
      limits: undefined,
      remotePeer,
      remoteAddr: addr2.encapsulate(`/p2p/${remotePeer}`),
      status: 'open'
    })

    const connections = new PeerMap<Connection[]>()
    connections.set(remotePeer, [existingConnection])

    components.transportManager.dialTransportForMultiaddr.callsFake(ma => {
      return stubInterface<Transport>()
    })
    components.transportManager.dial.callsFake(async (ma, opts = {}) => newConnection)
    dialer = new DialQueue(components, { connections })

    await expect(dialer.dial(addr2)).to.eventually.equal(newConnection)
  })

  it('should respect user dial signal over default timeout if it is passed', async () => {
    const dialTimeout = 10
    const userTimeout = 500
    const connection = stubInterface<Connection>()

    components.transportManager.dialTransportForMultiaddr.returns(stubInterface<Transport>())
    components.transportManager.dial.callsFake(async (ma, options) => {
      await raceSignal(delay(userTimeout / 2), options?.signal)

      return connection
    })

    dialer = new DialQueue(components, {
      dialTimeout
    })

    // dial slow peer with much longer timeout than the default
    await expect(dialer.dial(multiaddr('/ip4/123.123.123.123/tcp/1234'), {
      signal: AbortSignal.timeout(userTimeout)
    }))
      .to.eventually.equal(connection)
  })

  it('should respect user dial signal during parallel dial of the same peer', async () => {
    const dialTimeout = 10
    const userTimeout = 500
    const connection = stubInterface<Connection>()

    components.transportManager.dialTransportForMultiaddr.returns(stubInterface<Transport>())
    components.transportManager.dial.callsFake(async (ma, options) => {
      await raceSignal(delay(userTimeout / 2), options?.signal)

      return connection
    })

    dialer = new DialQueue(components, {
      dialTimeout
    })

    const all = await Promise.allSettled([
      dialer.dial(multiaddr('/ip4/123.123.123.123/tcp/1234/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb')),
      dialer.dial(multiaddr('/ip4/123.123.123.123/tcp/1234/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb'), {
        signal: AbortSignal.timeout(userTimeout)
      })
    ])

    expect(all[0].status).to.equal('rejected', 'did not respect default dial timeout')
    expect(all[1].status).to.equal('fulfilled', 'did not respect user dial timeout')
    expect(components.transportManager.dial.callCount).to.equal(1, 'should have coalesced multiple dials to same dial')
  })
})
