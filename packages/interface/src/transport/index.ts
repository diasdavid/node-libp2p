import type { Connection, ConnectionLimits, MultiaddrConnection } from '../connection/index.js'
import type { TypedEventTarget } from '../event-target.js'
import type { AbortOptions } from '../index.js'
import type { StreamMuxerFactory } from '../stream-muxer/index.js'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { ProgressOptions, ProgressEvent } from 'progress-events'

export interface ListenerEvents {
  /**
   * This event signals to the transport manager that the listening addresses
   * have changed and may be emitted at any point and/or multiple times
   */
  'listening': CustomEvent

  /**
   * Emitted if listening on an address failed
   */
  'error': CustomEvent<Error>

  /**
   * Emitted when the listener has been shut down, has no open connections and
   * will no longer accept new connections
   */
  'close': CustomEvent
}

export interface Listener extends TypedEventTarget<ListenerEvents> {
  /**
   * Start a listener
   */
  listen(multiaddr: Multiaddr): Promise<void>
  /**
   * Get listen addresses
   */
  getAddrs(): Multiaddr[]
  /**
   * Close listener
   *
   * @returns {Promise<void>}
   */
  close(): Promise<void>
}

export const transportSymbol = Symbol.for('@libp2p/transport')

export interface MultiaddrFilter { (multiaddrs: Multiaddr[]): Multiaddr[] }

export interface CreateListenerOptions {
  /**
   * The upgrader turns a MultiaddrConnection into a Connection and notifies
   * other libp2p components about a new incoming connection.
   */
  upgrader: Upgrader
}

export interface DialTransportOptions<DialEvents extends ProgressEvent = ProgressEvent> extends AbortOptions, ProgressOptions<DialEvents> {
  /**
   * The upgrader turns a MultiaddrConnection into a Connection which should be
   * returned by the transport's dial method
   */
  upgrader: Upgrader
}

/**
 * A libp2p transport offers dial and listen methods to establish connections.
 */
export interface Transport<DialEvents extends ProgressEvent = ProgressEvent> {
  /**
   * Used to identify the transport
   */
  [Symbol.toStringTag]: string

  /**
   * Used by the isTransport function
   */
  [transportSymbol]: true

  /**
   * Dial a given multiaddr.
   */
  dial(ma: Multiaddr, options: DialTransportOptions<DialEvents>): Promise<Connection>

  /**
   * Create transport listeners.
   */
  createListener(options: CreateListenerOptions): Listener

  /**
   * Takes a list of `Multiaddr`s and returns only addresses that are valid for
   * the transport to listen on
   */
  listenFilter: MultiaddrFilter

  /**
   * Takes a list of `Multiaddr`s and returns only addresses that are vali for
   * the transport to dial
   */
  dialFilter: MultiaddrFilter
}

export function isTransport (other: any): other is Transport {
  return other != null && Boolean(other[transportSymbol])
}

/**
 * Enum Transport Manager Fault Tolerance values
 */
export enum FaultTolerance {
  /**
   * should be used for failing in any listen circumstance
   */
  FATAL_ALL = 0,

  /**
   * should be used for not failing when not listening
   */
  NO_FATAL
}

export interface UpgraderOptions<ConnectionUpgradeEvents extends ProgressEvent = ProgressEvent> extends ProgressOptions<ConnectionUpgradeEvents>, AbortOptions {
  skipEncryption?: boolean
  skipProtection?: boolean
  muxerFactory?: StreamMuxerFactory
  limits?: ConnectionLimits
  initiator?: boolean
}

export type InboundConnectionUpgradeEvents =
ProgressEvent<'upgrader:encrypt-inbound-connection'> |
ProgressEvent<'upgrader:multiplex-inbound-connection'>

export type OutboundConnectionUpgradeEvents =
ProgressEvent<'upgrader:encrypt-outbound-connection'> |
ProgressEvent<'upgrader:multiplex-outbound-connection'>

export interface Upgrader {
  /**
   * Upgrades an outbound connection created by the `dial` method of a transport
   */
  upgradeOutbound(maConn: MultiaddrConnection, opts?: UpgraderOptions<OutboundConnectionUpgradeEvents>): Promise<Connection>

  /**
   * Upgrades an inbound connection received by a transport listener and
   * notifies other libp2p components about the new connection
   */
  upgradeInbound(maConn: MultiaddrConnection, opts?: UpgraderOptions<InboundConnectionUpgradeEvents>): Promise<void>
}
