import { PeerSet } from '@libp2p/peer-collections'
import map from 'it-map'
import parallel from 'it-parallel'
import { pipe } from 'it-pipe'
import { ALPHA } from '../constants.js'
import { MessageType } from '../message/dht.js'
import { toPbPeerInfo } from '../message/utils.js'
import {
  queryErrorEvent,
  peerResponseEvent,
  providerEvent
} from '../query/events.js'
import type { KadDHTComponents, PeerResponseEvent, ProviderEvent, QueryEvent } from '../index.js'
import type { Message } from '../message/dht.js'
import type { Network } from '../network.js'
import type { PeerRouting } from '../peer-routing/index.js'
import type { Providers } from '../providers.js'
import type { QueryManager } from '../query/manager.js'
import type { QueryFunc } from '../query/types.js'
import type { RoutingTable } from '../routing-table/index.js'
import type { Logger, PeerInfo, RoutingOptions } from '@libp2p/interface'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { CID } from 'multiformats/cid'

export interface ContentRoutingInit {
  network: Network
  peerRouting: PeerRouting
  queryManager: QueryManager
  routingTable: RoutingTable
  providers: Providers
  logPrefix: string
}

export class ContentRouting {
  private readonly log: Logger
  private readonly components: KadDHTComponents
  private readonly network: Network
  private readonly peerRouting: PeerRouting
  private readonly queryManager: QueryManager
  private readonly routingTable: RoutingTable
  private readonly providers: Providers

  constructor (components: KadDHTComponents, init: ContentRoutingInit) {
    const { network, peerRouting, queryManager, routingTable, providers, logPrefix } = init

    this.components = components
    this.log = components.logger.forComponent(`${logPrefix}:content-routing`)
    this.network = network
    this.peerRouting = peerRouting
    this.queryManager = queryManager
    this.routingTable = routingTable
    this.providers = providers
  }

  /**
   * Announce to the network that we can provide the value for a given key and
   * are contactable on the given multiaddrs
   */
  async * provide (key: CID, multiaddrs: Multiaddr[], options: RoutingOptions = {}): AsyncGenerator<QueryEvent, void, undefined> {
    this.log('provide %s', key)

    // Add peer as provider
    await this.providers.addProvider(key, this.components.peerId)

    const msg: Partial<Message> = {
      type: MessageType.ADD_PROVIDER,
      key: key.multihash.bytes,
      providers: [
        toPbPeerInfo({
          id: this.components.peerId,
          multiaddrs
        })
      ]
    }

    let sent = 0

    const maybeNotifyPeer = (event: QueryEvent) => {
      return async () => {
        if (event.name !== 'FINAL_PEER') {
          return [event]
        }

        const events = []

        this.log('putProvider %s to %p', key, event.peer.id)

        try {
          this.log('sending provider record for %s to %p', key, event.peer.id)

          for await (const sendEvent of this.network.sendMessage(event.peer.id, msg, options)) {
            if (sendEvent.name === 'PEER_RESPONSE') {
              this.log('sent provider record for %s to %p', key, event.peer.id)
              sent++
            }

            events.push(sendEvent)
          }
        } catch (err: any) {
          this.log.error('error sending provide record to peer %p', event.peer.id, err)
          events.push(queryErrorEvent({ from: event.peer.id, error: err }, options))
        }

        return events
      }
    }

    // Notify closest peers
    yield * pipe(
      this.peerRouting.getClosestPeers(key.multihash.bytes, options),
      (source) => map(source, (event) => maybeNotifyPeer(event)),
      (source) => parallel(source, {
        ordered: false,
        concurrency: ALPHA
      }),
      async function * (source) {
        for await (const events of source) {
          yield * events
        }
      }
    )

    this.log('sent provider records to %d peers', sent)
  }

  /**
   * Search the dht for up to `K` providers of the given CID.
   */
  async * findProviders (key: CID, options: RoutingOptions): AsyncGenerator<PeerResponseEvent | ProviderEvent | QueryEvent> {
    const toFind = this.routingTable.kBucketSize
    const target = key.multihash.bytes
    const self = this // eslint-disable-line @typescript-eslint/no-this-alias

    this.log('findProviders %c', key)

    const provs = await this.providers.getProviders(key)

    // yield values if we have some, also slice because maybe we got lucky and already have too many?
    if (provs.length > 0) {
      const providers: PeerInfo[] = []

      for (const peerId of provs.slice(0, toFind)) {
        try {
          const peer = await this.components.peerStore.get(peerId)

          providers.push({
            id: peerId,
            multiaddrs: peer.addresses.map(({ multiaddr }) => multiaddr)
          })
        } catch (err: any) {
          if (err.code !== 'ERR_NOT_FOUND') {
            throw err
          }

          this.log('no peer store entry for %p', peerId)
        }
      }

      yield peerResponseEvent({ from: this.components.peerId, messageType: MessageType.GET_PROVIDERS, providers }, options)
      yield providerEvent({ from: this.components.peerId, providers }, options)
    }

    // All done
    if (provs.length >= toFind) {
      return
    }

    /**
     * The query function to use on this particular disjoint path
     */
    const findProvidersQuery: QueryFunc = async function * ({ peer, signal }) {
      const request = {
        type: MessageType.GET_PROVIDERS,
        key: target
      }

      yield * self.network.sendRequest(peer, request, {
        ...options,
        signal
      })
    }

    const providers = new PeerSet(provs)

    for await (const event of this.queryManager.run(target, findProvidersQuery, options)) {
      yield event

      if (event.name === 'PEER_RESPONSE') {
        this.log('Found %d provider entries for %c and %d closer peers', event.providers.length, key, event.closer.length)

        const newProviders = []

        for (const peer of event.providers) {
          if (providers.has(peer.id)) {
            continue
          }

          providers.add(peer.id)
          newProviders.push(peer)
        }

        if (newProviders.length > 0) {
          // ensure providers with multiaddrs are yielded first
          newProviders.sort((a, b) => {
            if (a.multiaddrs.length > b.multiaddrs.length) {
              return -1
            }

            if (a.multiaddrs.length < b.multiaddrs.length) {
              return 1
            }

            return 0
          })

          yield providerEvent({ from: event.from, providers: newProviders }, options)
        }

        if (providers.size === toFind) {
          return
        }
      }
    }
  }
}
