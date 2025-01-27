/**
 * @packageDocumentation
 *
 * A [libp2p transport](https://docs.libp2p.io/concepts/transports/overview/) based on [WebRTC datachannels](https://webrtc.org/).
 *
 * [WebRTC](https://www.w3.org/TR/webrtc/) is a specification that allows real-time communication between nodes - it's commonly used in browser video conferencing applications but it also provides a reliable data transport mechanism called [data channels](https://www.w3.org/TR/webrtc/#peer-to-peer-data-api) which libp2p uses to facilitate [protocol streams](https://docs.libp2p.io/concepts/multiplex/overview/) between peers.
 *
 * There are two transports exposed by this module, [webRTC](https://github.com/libp2p/specs/blob/master/webrtc/webrtc.md) and [webRTCDirect](https://github.com/libp2p/specs/blob/master/webrtc/webrtc-direct.md).
 *
 * ## WebRTC vs WebRTC Direct
 *
 * The connection establishment phase of WebRTC involves a handshake using [SDP](https://en.wikipedia.org/wiki/Session_Description_Protocol) during which two peers will exchange information such as open ports, network addresses and required capabilities.
 *
 * A third party is usually necessary to carry out this handshake, forwarding messages between the two peers until they can make a direct connection between themselves.
 *
 * The WebRTC transport uses libp2p [Circuit Relay](https://docs.libp2p.io/concepts/nat/circuit-relay/)s to forward SDP messages. Once a direct connection is formed the relay plays no further part in the exchange.
 *
 * WebRTC Direct uses a technique known as [SDP munging](https://webrtchacks.com/not-a-guide-to-sdp-munging/) to skip the handshake step, instead encoding enough information in the connection request that the responder can derive what would have been in the handshake messages and so requires no third parties to establish a connection.
 *
 * A WebRTC Direct multiaddr also includes a certhash of the target peer - this is used to allow opening a connection to the remote, which would otherwise be denied due to use of a self-signed certificate.
 *
 * In both cases, once the connection is established a [Noise handshake](https://noiseprotocol.org/noise.html) is carried out to ensure that the remote peer has the private key that corresponds to the public key that makes up their PeerId, giving you both encryption and authentication.
 *
 * ## Support
 *
 * WebRTC is supported in both Node.js and browsers.
 *
 * At the time of writing, WebRTC Direct is dial-only in browsers and not supported in Node.js at all.
 *
 * Support in Node.js is possible but PRs will need to be opened to [libdatachannel](https://github.com/paullouisageneau/libdatachannel) and the appropriate APIs exposed in [node-datachannel](https://github.com/murat-dogan/node-datachannel).
 *
 * WebRTC Direct support is available in rust-libp2p and arriving soon in go-libp2p.
 *
 * See the WebRTC section of https://connectivity.libp2p.io for more information.
 *
 * @example WebRTC
 *
 * WebRTC requires use of a relay to connect two nodes. The listener first discovers a relay server and makes a reservation, then the dialer can connect via the relayed address.
 *
 * ```TypeScript
 * import { noise } from '@chainsafe/libp2p-noise'
 * import { yamux } from '@chainsafe/libp2p-yamux'
 * import { echo } from '@libp2p/echo'
 * import { circuitRelayTransport, circuitRelayServer } from '@libp2p/circuit-relay-v2'
 * import { identify } from '@libp2p/identify'
 * import { webRTC } from '@libp2p/webrtc'
 * import { webSockets } from '@libp2p/websockets'
 * import * as filters from '@libp2p/websockets/filters'
 * import { WebRTC } from '@multiformats/multiaddr-matcher'
 * import delay from 'delay'
 * import { pipe } from 'it-pipe'
 * import { createLibp2p } from 'libp2p'
 * import type { Multiaddr } from '@multiformats/multiaddr'
 *
 * // the relay server listens on a transport dialable by the listener and the
 * // dialer, and has a relay service configured
 * const relay = await createLibp2p({
 *   addresses: {
 *   listen: ['/ip4/127.0.0.1/tcp/0/ws']
 *   },
 *   transports: [
 *     webSockets({filter: filters.all})
 *   ],
 *   connectionEncrypters: [noise()],
 *   streamMuxers: [yamux()],
 *   services: {
 *     identify: identify(),
 *     relay: circuitRelayServer()
 *   }
 * })
 *
 * // the listener has a WebSocket transport to dial the relay, a Circuit Relay
 * // transport to make a reservation, and a WebRTC transport to accept incoming
 * // WebRTC connections
 * const listener = await createLibp2p({
 *   addresses: {
 *     listen: [
 *       '/p2p-circuit',
 *       '/webrtc'
 *     ]
 *   },
 *   transports: [
 *     webSockets({filter: filters.all}),
 *     webRTC(),
 *     circuitRelayTransport()
 *   ],
 *   connectionEncrypters: [noise()],
 *   streamMuxers: [yamux()],
 *   services: {
 *     identify: identify(),
 *     echo: echo()
 *   }
 * })
 *
 * // the listener dials the relay (or discovers a public relay via some other
 * // method)
 * await listener.dial(relay.getMultiaddrs(), {
 *   signal: AbortSignal.timeout(5000)
 * })
 *
 * let webRTCMultiaddr: Multiaddr | undefined
 *
 * // wait for the listener to make a reservation on the relay
 * while (true) {
 *   webRTCMultiaddr = listener.getMultiaddrs().find(ma => WebRTC.matches(ma))
 *
 *   if (webRTCMultiaddr != null) {
 *     break
 *   }
 *
 *   // try again later
 *   await delay(1000)
 * }
 *
 * // the dialer has Circuit Relay, WebSocket and WebRTC transports to dial
 * // the listener via the relay, complete the SDP handshake and establish a
 * // direct WebRTC connection
 * const dialer = await createLibp2p({
 *   transports: [
 *     webSockets({filter: filters.all}),
 *     webRTC(),
 *     circuitRelayTransport()
 *   ],
 *   connectionEncrypters: [noise()],
 *   streamMuxers: [yamux()],
 *   services: {
 *     identify: identify(),
 *     echo: echo()
 *   }
 * })
 *
 * // dial the listener and open an echo protocol stream
 * const stream = await dialer.dialProtocol(webRTCMultiaddr, dialer.services.echo.protocol, {
 *   signal: AbortSignal.timeout(5000)
 * })
 *
 * // we can now stop the relay
 * await relay.stop()
 *
 * // send/receive some data from the remote peer via a direct connection
 * await pipe(
 *   [new TextEncoder().encode('hello world')],
 *   stream,
 *   async source => {
 *     for await (const buf of source) {
 *       console.info(new TextDecoder().decode(buf.subarray()))
 *     }
 *   }
 * )
 * ```
 *
 * @example WebRTC Direct
 *
 * At the time of writing WebRTC Direct is dial-only in browsers and unsupported in Node.js.
 *
 * The only implementation that supports a WebRTC Direct listener is go-libp2p and it's not yet enabled by default.
 *
 * ```TypeScript
 * import { createLibp2p } from 'libp2p'
 * import { noise } from '@chainsafe/libp2p-noise'
 * import { multiaddr } from '@multiformats/multiaddr'
 * import { pipe } from 'it-pipe'
 * import { fromString, toString } from 'uint8arrays'
 * import { webRTCDirect } from '@libp2p/webrtc'
 *
 * const node = await createLibp2p({
 *   transports: [
 *     webRTCDirect()
 *   ],
 *   connectionEncrypters: [
 *     noise()
 *   ]
 * })
 *
 * await node.start()
 *
 * // this multiaddr corresponds to a remote node running a WebRTC Direct listener
 * const ma = multiaddr('/ip4/0.0.0.0/udp/56093/webrtc-direct/certhash/uEiByaEfNSLBexWBNFZy_QB1vAKEj7JAXDizRs4_SnTflsQ')
 * const stream = await node.dialProtocol(ma, '/my-protocol/1.0.0', {
 *   signal: AbortSignal.timeout(10_000)
 * })
 *
 * await pipe(
 *   [fromString(`Hello js-libp2p-webrtc\n`)],
 *   stream,
 *   async function (source) {
 *     for await (const buf of source) {
 *       console.info(toString(buf.subarray()))
 *     }
 *   }
 * )
 * ```
 */

import { WebRTCTransport } from './private-to-private/transport.js'
import { WebRTCDirectTransport, type WebRTCTransportDirectInit, type WebRTCDirectTransportComponents } from './private-to-public/transport.js'
import type { WebRTCTransportComponents, WebRTCTransportInit } from './private-to-private/transport.js'
import type { Transport } from '@libp2p/interface'

export interface DataChannelOptions {
  /**
   * The maximum message size sendable over the channel in bytes
   *
   * @default 16384
   */
  maxMessageSize?: number

  /**
   * If the channel's `bufferedAmount` grows over this amount in bytes, wait
   * for it to drain before sending more data
   *
   * @default 16777216
   */
  maxBufferedAmount?: number

  /**
   * When `bufferedAmount` is above `maxBufferedAmount`, we pause sending until
   * the `bufferedAmountLow` event fires - this controls how long we wait for
   * that event in ms
   *
   * @default 30000
   */
  bufferedAmountLowEventTimeout?: number

  /**
   * When closing a stream, we wait for `bufferedAmount` to become 0 before
   * closing the underlying RTCDataChannel - this controls how long we wait
   * in ms
   *
   * @default 30000
   */
  drainTimeout?: number

  /**
   * When closing a stream we first send a FIN flag to the remote and wait
   * for a FIN_ACK reply before closing the underlying RTCDataChannel - this
   * controls how long we wait for the acknowledgement in ms
   *
   * @default 5000
   */
  closeTimeout?: number

  /**
   * When sending the first data message, if the channel is not in the "open"
   * state, wait this long for the "open" event to fire.
   */
  openTimeout?: number
}

/**
 * PEM format server certificate and private key
 */
export interface TransportCertificate {
  /**
   * The private key for the certificate in PEM format
   */
  privateKey: string
  /**
   * PEM format certificate
   */
  pem: string

  /**
   * The hash of the certificate
   */
  certhash: string
}

export type { WebRTCTransportDirectInit, WebRTCDirectTransportComponents }

function webRTCDirect (init?: WebRTCTransportDirectInit): (components: WebRTCDirectTransportComponents) => Transport {
  return (components: WebRTCDirectTransportComponents) => new WebRTCDirectTransport(components, init)
}

export type { WebRTCTransportInit, WebRTCTransportComponents }

function webRTC (init?: WebRTCTransportInit): (components: WebRTCTransportComponents) => Transport {
  return (components: WebRTCTransportComponents) => new WebRTCTransport(components, init)
}

export { webRTC, webRTCDirect }
