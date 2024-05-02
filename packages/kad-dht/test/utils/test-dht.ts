import { TypedEventEmitter, start, stop } from '@libp2p/interface'
import { mockRegistrar, mockConnectionManager, mockNetwork } from '@libp2p/interface-compliance-tests/mocks'
import { defaultLogger } from '@libp2p/logger'
import { PersistentPeerStore } from '@libp2p/peer-store'
import { multiaddr } from '@multiformats/multiaddr'
import { MemoryDatastore } from 'datastore-core/memory'
import delay from 'delay'
import pRetry from 'p-retry'
import { stubInterface } from 'sinon-ts'
import { PROTOCOL } from '../../src/constants.js'
import { type KadDHT, type KadDHTComponents, type KadDHTInit } from '../../src/index.js'
import { KadDHT as KadDHTClass } from '../../src/kad-dht.js'
import { createPeerId } from './create-peer-id.js'
import type { Libp2pEvents, PeerId, PeerStore } from '@libp2p/interface'
import type { AddressManager, ConnectionManager, Registrar } from '@libp2p/interface-internal'

export class TestDHT {
  private readonly peers: Map<string, { dht: KadDHT, registrar: Registrar }>

  constructor () {
    this.peers = new Map()
  }

  async spawn (options: Partial<KadDHTInit> = {}, autoStart = true): Promise<KadDHTClass> {
    const events = new TypedEventEmitter<Libp2pEvents>()
    const components: KadDHTComponents = {
      peerId: await createPeerId(),
      datastore: new MemoryDatastore(),
      registrar: mockRegistrar(),
      // connectionGater: mockConnectionGater(),
      addressManager: stubInterface<AddressManager>(),
      peerStore: stubInterface<PeerStore>(),
      connectionManager: stubInterface<ConnectionManager>(),
      events,
      logger: defaultLogger()
    }
    components.connectionManager = mockConnectionManager({
      ...components,
      events
    })
    components.peerStore = new PersistentPeerStore({
      ...components,
      events
    })

    await start(...Object.values(components))

    mockNetwork.addNode({
      ...components,
      events
    })

    const addressManager = stubInterface<AddressManager>()
    addressManager.getAddresses.returns([
      multiaddr(`/ip4/127.0.0.1/tcp/4002/p2p/${components.peerId.toString()}`),
      multiaddr(`/ip4/192.168.1.1/tcp/4002/p2p/${components.peerId.toString()}`),
      multiaddr(`/ip4/85.3.31.0/tcp/4002/p2p/${components.peerId.toString()}`)
    ])

    components.addressManager = addressManager

    const opts: KadDHTInit = {
      validators: {
        async v () {

        },
        async v2 () {

        }
      },
      selectors: {
        v: () => 0
      },
      querySelfInterval: 600000,
      initialQuerySelfInterval: 600000,
      allowQueryWithZeroPeers: true,
      clientMode: false,
      ...options
    }

    const dht = new KadDHTClass(components, opts)

    // simulate libp2p._onDiscoveryPeer
    dht.addEventListener('peer', (evt) => {
      const peerData = evt.detail

      if (components.peerId.equals(peerData.id)) {
        return
      }

      void components.peerStore.merge(peerData.id, {
        multiaddrs: peerData.multiaddrs
      })
    })

    if (autoStart) {
      await start(dht)
    }

    this.peers.set(components.peerId.toString(), {
      dht,
      registrar: components.registrar
    })

    return dht
  }

  async connect (dhtA: KadDHTClass, dhtB: KadDHTClass): Promise<void> {
    await dhtA.components.peerStore.merge(dhtB.components.peerId, {
      multiaddrs: dhtB.components.addressManager.getAddresses()
    })
    await dhtB.components.peerStore.merge(dhtA.components.peerId, {
      multiaddrs: dhtA.components.addressManager.getAddresses()
    })

    const connection = await dhtA.components.connectionManager.openConnection(dhtB.components.peerId)

    // simulate identify
    dhtA.components.registrar.getTopologies(PROTOCOL).forEach(topology => {
      topology.onConnect?.(dhtB.components.peerId, connection)
    })
    dhtB.components.registrar.getTopologies(PROTOCOL).forEach(topology => {
      const conn = dhtB.components.connectionManager.getConnections(dhtA.components.peerId)
      topology.onConnect?.(dhtA.components.peerId, conn[0])
    })

    // wait for peers to appear in each others' routing tables
    await checkConnected(dhtA, dhtB)

    async function checkConnected (a: KadDHTClass, b: KadDHTClass): Promise<PeerId[]> {
      const routingTableChecks: Array<() => Promise<PeerId>> = []

      if (b.getMode() === 'server') {
        routingTableChecks.push(async () => {
          const match = await a.routingTable.find(b.components.peerId)

          if (match == null) {
            await delay(100)
            throw new Error('not found')
          }

          return match
        })
      }

      if (a.getMode() === 'server') {
        routingTableChecks.push(async () => {
          const match = await b.routingTable.find(a.components.peerId)

          if (match == null) {
            await delay(100)
            throw new Error('not found')
          }

          return match
        })
      }

      // Check routing tables
      return Promise.all(
        routingTableChecks
          .map(
            async check => pRetry(check, { retries: 50 })
          )
      )
    }
  }

  async teardown (): Promise<void> {
    await Promise.all(
      Array.from(this.peers.entries()).map(async ([_, { dht }]) => {
        await stop(dht)
      })
    )
    this.peers.clear()
  }
}
