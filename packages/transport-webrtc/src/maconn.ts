import { nopSink, nopSource } from './util.js'
import type { ComponentLogger, Logger, MultiaddrConnection, MultiaddrConnectionTimeline, CounterGroup } from '@libp2p/interface'
import type { AbortOptions, Multiaddr } from '@multiformats/multiaddr'
import type { Source, Sink } from 'it-stream-types'
import type { Uint8ArrayList } from 'uint8arraylist'

interface WebRTCMultiaddrConnectionInit {
  /**
   * WebRTC Peer Connection
   */
  peerConnection: RTCPeerConnection

  /**
   * The multiaddr address used to communicate with the remote peer
   */
  remoteAddr: Multiaddr

  /**
   * Holds the relevant events timestamps of the connection
   */
  timeline: MultiaddrConnectionTimeline

  /**
   * Optional metrics counter group for this connection
   */
  metrics?: CounterGroup
}

export interface WebRTCMultiaddrConnectionComponents {
  logger: ComponentLogger
}

export class WebRTCMultiaddrConnection implements MultiaddrConnection {
  readonly log: Logger

  /**
   * WebRTC Peer Connection
   */
  readonly peerConnection: RTCPeerConnection

  /**
   * The multiaddr address used to communicate with the remote peer
   */
  remoteAddr: Multiaddr

  /**
   * Holds the lifecycle times of the connection
   */
  timeline: MultiaddrConnectionTimeline

  /**
   * Optional metrics counter group for this connection
   */
  metrics?: CounterGroup

  /**
   * The stream source, a no-op as the transport natively supports multiplexing
   */
  source: AsyncGenerator<Uint8Array, any, unknown> = nopSource()

  /**
   * The stream destination, a no-op as the transport natively supports multiplexing
   */
  sink: Sink<Source<Uint8Array | Uint8ArrayList>, Promise<void>> = nopSink

  constructor (components: WebRTCMultiaddrConnectionComponents, init: WebRTCMultiaddrConnectionInit) {
    this.log = components.logger.forComponent('libp2p:webrtc:maconn')
    this.remoteAddr = init.remoteAddr
    this.timeline = init.timeline
    this.peerConnection = init.peerConnection

    const peerConnection = this.peerConnection
    const initialState = peerConnection.connectionState

    this.peerConnection.onconnectionstatechange = () => {
      this.log.trace('peer connection state change', peerConnection.connectionState, 'initial state', initialState)

      if (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'closed') {
        // nothing else to do but close the connection
        this.timeline.close = Date.now()
      }
    }
  }

  async close (options?: AbortOptions): Promise<void> {
    this.log.trace('closing connection')

    this.peerConnection.close()
    this.timeline.close = Date.now()
    this.metrics?.increment({ close: true })
  }

  abort (err: Error): void {
    this.log.error('closing connection due to error', err)

    this.peerConnection.close()
    this.timeline.close = Date.now()
    this.metrics?.increment({ abort: true })
  }
}
