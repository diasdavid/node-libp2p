/* eslint-env mocha */

import { expect } from 'aegir/chai'
import { DefaultAddressManager } from '../../src/address-manager/index.js'
import { DefaultTransportManager } from '../../src/transport-manager.js'
import { FaultTolerance } from '@libp2p/interface-transport'
import { tcp } from '@libp2p/tcp'
import { mockUpgrader } from '@libp2p/interface-mocks'
import { uPnPNAT } from '../../src/upnp-nat/index.js'
import Peers from '../fixtures/peers.js'
import { codes } from '../../src/errors.js'
import { createFromJSON } from '@libp2p/peer-id-factory'
import type { NatAPI } from '@achingbrain/nat-port-mapper'
import { StubbedInstance, stubInterface } from 'sinon-ts'
import { start, stop } from '@libp2p/interfaces/startable'
import { multiaddr } from '@multiformats/multiaddr'
import { defaultComponents, Components } from '../../src/components.js'
import { EventEmitter } from '@libp2p/interfaces/events'
import type { PeerData, PeerStore } from '@libp2p/interface-peer-store'
import type { PeerId } from '@libp2p/interface-peer-id'

const DEFAULT_ADDRESSES = [
  '/ip4/127.0.0.1/tcp/0',
  '/ip4/0.0.0.0/tcp/0'
]

describe('UPnP NAT (TCP)', () => {
  const teardown: Array<() => Promise<void>> = []
  let client: StubbedInstance<NatAPI>

  async function createNatManager (addrs = DEFAULT_ADDRESSES, natManagerOptions = {}): Promise<{ natManager: any, components: Components }> {
    const events = new EventEmitter()
    const components: any = {
      peerId: await createFromJSON(Peers[0]),
      upgrader: mockUpgrader({ events }),
      events,
      peerStore: stubInterface<PeerStore>()
    }

    components.peerStore.patch.callsFake(async (peerId: PeerId, details: PeerData) => {
      components.events.safeDispatchEvent('self:peer:update', {
        peer: {
          id: peerId,
          ...details
        }
      })
    })

    components.addressManager = new DefaultAddressManager(components, { listen: addrs })
    components.transportManager = new DefaultTransportManager(components, {
      faultTolerance: FaultTolerance.NO_FATAL
    })

    const natManager: any = uPnPNAT({
      keepAlive: true,
      ...natManagerOptions
    })(components)

    client = stubInterface<NatAPI>()

    natManager._getClient = async () => {
      return client
    }

    components.transportManager.add(tcp()())
    await components.transportManager.listen(components.addressManager.getListenAddrs())

    teardown.push(async () => {
      await stop(natManager)
      await components.transportManager.removeAll()
    })

    return {
      natManager,
      components
    }
  }

  afterEach(async () => await Promise.all(teardown.map(async t => { await t() })))

  it('should map TCP connections to external ports', async () => {
    const {
      natManager,
      components
    } = await createNatManager()

    let addressChangedEventFired = false

    components.events.addEventListener('self:peer:update', () => {
      addressChangedEventFired = true
    })

    client.externalIp.resolves('82.3.1.5')

    let observed = components.addressManager.getObservedAddrs().map(ma => ma.toString())
    expect(observed).to.be.empty()

    await start(natManager)

    observed = components.addressManager.getObservedAddrs().map(ma => ma.toString())
    expect(observed).to.not.be.empty()

    const internalPorts = components.transportManager.getAddrs()
      .filter(ma => ma.isThinWaistAddress())
      .map(ma => ma.toOptions())
      .filter(({ host, transport }) => host !== '127.0.0.1' && transport === 'tcp')
      .map(({ port }) => port)

    expect(client.map.called).to.be.true()

    internalPorts.forEach(port => {
      expect(client.map.getCall(0).args[0]).to.include({
        localPort: port,
        protocol: 'TCP'
      })
    })

    // simulate autonat having run
    components.addressManager.confirmObservedAddr(multiaddr('/ip4/82.3.1.5/tcp/4002'))

    expect(addressChangedEventFired).to.be.true()
  })

  it('should not map TCP connections when double-natted', async () => {
    const {
      natManager,
      components
    } = await createNatManager()

    client.externalIp.resolves('192.168.1.1')

    let observed = components.addressManager.getObservedAddrs().map(ma => ma.toString())
    expect(observed).to.be.empty()

    await expect(natManager._start()).to.eventually.be.rejectedWith(/double NAT/)

    observed = components.addressManager.getObservedAddrs().map(ma => ma.toString())
    expect(observed).to.be.empty()

    expect(client.map.called).to.be.false()
  })

  it('should not map non-ipv4 connections to external ports', async () => {
    const {
      natManager,
      components
    } = await createNatManager([
      '/ip6/::/tcp/0'
    ])

    let observed = components.addressManager.getObservedAddrs().map(ma => ma.toString())
    expect(observed).to.be.empty()

    await start(natManager)

    observed = components.addressManager.getObservedAddrs().map(ma => ma.toString())
    expect(observed).to.be.empty()
  })

  it('should not map non-ipv6 loopback connections to external ports', async () => {
    const {
      natManager,
      components
    } = await createNatManager([
      '/ip6/::1/tcp/0'
    ])

    let observed = components.addressManager.getObservedAddrs().map(ma => ma.toString())
    expect(observed).to.be.empty()

    await start(natManager)

    observed = components.addressManager.getObservedAddrs().map(ma => ma.toString())
    expect(observed).to.be.empty()
  })

  it('should not map non-TCP connections to external ports', async () => {
    const {
      natManager,
      components
    } = await createNatManager([
      '/ip4/0.0.0.0/utp'
    ])

    let observed = components.addressManager.getObservedAddrs().map(ma => ma.toString())
    expect(observed).to.be.empty()

    await start(natManager)

    observed = components.addressManager.getObservedAddrs().map(ma => ma.toString())
    expect(observed).to.be.empty()
  })

  it('should not map loopback connections to external ports', async () => {
    const {
      natManager,
      components
    } = await createNatManager([
      '/ip4/127.0.0.1/tcp/0'
    ])

    let observed = components.addressManager.getObservedAddrs().map(ma => ma.toString())
    expect(observed).to.be.empty()

    await start(natManager)

    observed = components.addressManager.getObservedAddrs().map(ma => ma.toString())
    expect(observed).to.be.empty()
  })

  it('should not map non-thin-waist connections to external ports', async () => {
    const {
      natManager,
      components
    } = await createNatManager([
      '/ip4/0.0.0.0/tcp/0/sctp/0'
    ])

    let observed = components.addressManager.getObservedAddrs().map(ma => ma.toString())
    expect(observed).to.be.empty()

    await start(natManager)

    observed = components.addressManager.getObservedAddrs().map(ma => ma.toString())
    expect(observed).to.be.empty()
  })

  it('should specify large enough TTL', async () => {
    const peerId = await createFromJSON(Peers[0])

    expect(() => {
      uPnPNAT({ ttl: 5, keepAlive: true })(defaultComponents({ peerId }))
    }).to.throw().with.property('code', codes.ERR_INVALID_PARAMETERS)
  })
})
