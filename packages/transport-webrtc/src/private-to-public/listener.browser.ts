import { TypedEventEmitter } from '@libp2p/interface'
import { UnimplementedError } from '../error.js'
import type { PeerId, ListenerEvents, Listener } from '@libp2p/interface'
import type { TransportManager } from '@libp2p/interface-internal'
import type { Multiaddr } from '@multiformats/multiaddr'

export interface WebRTCDirectListenerComponents {
  peerId: PeerId
  transportManager: TransportManager
}

export interface WebRTCDirectListenerInit {
  shutdownController: AbortController
}

export class WebRTCDirectListener extends TypedEventEmitter<ListenerEvents> implements Listener {
  async listen (): Promise<void> {
    throw new UnimplementedError('WebRTCTransport.createListener')
  }

  getAddrs (): Multiaddr[] {
    return []
  }

  async close (): Promise<void> {

  }
}
