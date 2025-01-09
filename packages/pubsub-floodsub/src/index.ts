/**
 * @packageDocumentation
 *
 * > Don't use this module
 *
 * This module is a naive implementation of pubsub. It broadcasts all messages to all network peers, cannot provide older messages and has no protection against bad actors.
 *
 * It exists for academic purposes only, you should not use it in production.
 *
 * Instead please use [gossipsub](https://www.npmjs.com/package/@chainsafe/libp2p-gossipsub) - a more complete implementation which is also compatible with floodsub.
 *
 * @example Configuring libp2p to use floodsub
 *
 * ```TypeScript
 * import { createLibp2p } from 'libp2p'
 * import { floodsub } from '@libp2p/floodsub'
 *
 * const node = await createLibp2p({
 *   services: {
 *     pubsub: floodsub()
 *   }
 *   //... other options
 * })
 * await node.start()
 *
 * node.services.pubsub.subscribe('fruit')
 * node.services.pubsub.addEventListener('message', (evt) => {
 *   console.log(evt)
 * })
 *
 * node.services.pubsub.publish('fruit', new TextEncoder().encode('banana'))
 * ```
 */

import { pubSubSymbol, serviceCapabilities, serviceDependencies } from '@libp2p/interface'
import { PubSubBaseProtocol, type PubSubComponents } from '@libp2p/pubsub'
import { toString } from 'uint8arrays/to-string'
import { SimpleTimeCache } from './cache.js'
import { multicodec } from './config.js'
import { RPC } from './message/rpc.js'
import type { PeerId, PubSubInit, Message, PubSubRPC, PubSubRPCMessage, PublishResult, PubSub } from '@libp2p/interface'
import type { Uint8ArrayList } from 'uint8arraylist'

export { multicodec }

export interface FloodSubInit extends PubSubInit {
  seenTTL?: number
}

export interface FloodSubComponents extends PubSubComponents {

}

/**
 * FloodSub (aka dumbsub is an implementation of pubsub focused on
 * delivering an API for Publish/Subscribe, but with no CastTree Forming
 * (it just floods the network).
 */
class FloodSub extends PubSubBaseProtocol {
  public seenCache: SimpleTimeCache<boolean>

  constructor (components: FloodSubComponents, init?: FloodSubInit) {
    super(components, {
      ...init,
      canRelayMessage: true,
      multicodecs: [multicodec]
    })

    this.log = components.logger.forComponent('libp2p:floodsub')

    /**
     * Cache of seen messages
     *
     * @type {TimeCache}
     */
    this.seenCache = new SimpleTimeCache<boolean>({
      validityMs: init?.seenTTL ?? 30000
    })
  }

  readonly [pubSubSymbol] = true

  readonly [Symbol.toStringTag] = '@libp2p/floodsub'

  readonly [serviceCapabilities]: string[] = [
    '@libp2p/pubsub'
  ]

  readonly [serviceDependencies]: string[] = [
    '@libp2p/identify'
  ]

  /**
   * Decode a Uint8Array into an RPC object
   */
  decodeRpc (bytes: Uint8Array | Uint8ArrayList): PubSubRPC {
    return RPC.decode(bytes)
  }

  /**
   * Encode an RPC object into a Uint8Array
   */
  encodeRpc (rpc: PubSubRPC): Uint8Array {
    return RPC.encode(rpc)
  }

  decodeMessage (bytes: Uint8Array | Uint8ArrayList): PubSubRPCMessage {
    return RPC.Message.decode(bytes)
  }

  encodeMessage (rpc: PubSubRPCMessage): Uint8Array {
    return RPC.Message.encode(rpc)
  }

  /**
   * Process incoming message
   * Extends base implementation to check router cache.
   */
  async processMessage (from: PeerId, message: Message): Promise<void> {
    // Check if I've seen the message, if yes, ignore
    const seqno = await super.getMsgId(message)
    const msgIdStr = toString(seqno, 'base64')

    if (this.seenCache.has(msgIdStr)) {
      return
    }

    this.seenCache.put(msgIdStr, true)

    await super.processMessage(from, message)
  }

  /**
   * Publish message created. Forward it to the peers.
   */
  async publishMessage (from: PeerId, message: Message): Promise<PublishResult> {
    const peers = this.getSubscribers(message.topic)
    const recipients: PeerId[] = []

    if (peers == null || peers.length === 0) {
      this.log('no peers are subscribed to topic %s', message.topic)
      return { recipients }
    }

    peers.forEach(id => {
      if (this.components.peerId.equals(id)) {
        this.log('not sending message on topic %s to myself', message.topic)
        return
      }

      if (id.equals(from)) {
        this.log('not sending message on topic %s to sender %p', message.topic, id)
        return
      }

      this.log('publish msgs on topics %s %p', message.topic, id)

      recipients.push(id)
      this.send(id, { messages: [message] })
    })

    return { recipients }
  }
}

export function floodsub (init: FloodSubInit = {}): (components: FloodSubComponents) => PubSub {
  return (components: FloodSubComponents) => new FloodSub(components, init)
}
