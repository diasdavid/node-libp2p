/**
 * @packageDocumentation
 *
 * An implementation of a simple Echo protocol.
 *
 * Any data received by the receiver will be sent back to the sender.
 *
 * @example
 *
 * ```TypeScript
 * import { noise } from '@chainsafe/libp2p-noise'
 * import { yamux } from '@chainsafe/libp2p-yamux'
 * import { echo } from '@libp2p/echo'
 * import { peerIdFromString } from '@libp2p/peer-id'
 * import { createLibp2p } from 'libp2p'
 *
 * const receiver = await createLibp2p({
 *   addresses: {
 *     listen: ['/ip4/0.0.0.0/tcp/0']
 *   },
 *   connectionEncryption: [noise()],
 *   streamMuxers: [yamux()],
 *   services: {
 *     echo: echo()
 *   }
 * })
 *
 * const sender = await createLibp2p({
 *   addresses: {
 *     listen: ['/ip4/0.0.0.0/tcp/0']
 *   },
 *   connectionEncryption: [noise()],
 *   streamMuxers: [yamux()],
 *   services: {
 *     echo: echo()
 *   }
 * })
 *
 * const stream = await sender.dialProtocol(receiver.getMultiaddrs(), sender.services.echo.protocol)
 *
 * // write/read stream
 * ```
 */

import { Echo as EchoClass } from './echo.js'
import type { ComponentLogger } from '@libp2p/interface'
import type { ConnectionManager, Registrar } from '@libp2p/interface-internal'

export interface EchoInit {
  protocolPrefix?: string
  maxInboundStreams?: number
  maxOutboundStreams?: number
}

export interface EchoComponents {
  registrar: Registrar
  connectionManager: ConnectionManager
  logger: ComponentLogger
}

export interface Echo {
  protocol: string
}

export function echo (init: EchoInit = {}): (components: EchoComponents) => Echo {
  return (components) => new EchoClass(components, init)
}
