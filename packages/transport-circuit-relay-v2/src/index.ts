/**
 * @packageDocumentation
 *
 * The `circuitRelayTransport` allows libp2p to dial and listen on [Circuit Relay](https://docs.libp2p.io/concepts/nat/circuit-relay/)
 * addresses.
 *
 * @example
 *
 * ```typescript
 * import { createLibp2p } from 'libp2p'
 * import { circuitRelayTransport } from '@libp2p/circuit-relay-v2'
 *
 * const node = await createLibp2p({
 *   transports: [
 *     circuitRelayTransport()
 *   ]
 * })
 * ```
 *
 * The `circuitRelayServer` function allows libp2p to function as a [Circuit Relay](https://docs.libp2p.io/concepts/nat/circuit-relay/)
 * server.  This will not work in browsers.
 *
 * @example
 *
 * ```typescript
 * import { createLibp2p } from 'libp2p'
 * import { circuitRelayServer } from '@libp2p/circuit-relay-v2'
 *
 * const node = await createLibp2p({
 *   services: [
 *     circuitRelay: circuitRelayServer()
 *   ]
 * })
 * ```
 */

import type { Limit } from './pb/index.js'
import type { TypedEventEmitter } from '@libp2p/interface'
import type { PeerMap } from '@libp2p/peer-collections'
import type { Multiaddr } from '@multiformats/multiaddr'

export interface RelayReservation {
  expire: Date
  addr: Multiaddr
  limit?: Limit
}

export interface CircuitRelayServiceEvents {
  'relay:reservation': CustomEvent<RelayReservation>
  'relay:advert:success': CustomEvent<unknown>
  'relay:advert:error': CustomEvent<Error>
}

export interface CircuitRelayService extends TypedEventEmitter<CircuitRelayServiceEvents> {
  reservations: PeerMap<RelayReservation>
}

export { circuitRelayServer, type CircuitRelayServerInit, type CircuitRelayServerComponents } from './server/index.js'
export { circuitRelayTransport, type CircuitRelayTransportInit, type CircuitRelayTransportComponents } from './transport/index.js'

export {
  RELAY_V2_HOP_CODEC,
  RELAY_V2_STOP_CODEC
} from './constants.js'
