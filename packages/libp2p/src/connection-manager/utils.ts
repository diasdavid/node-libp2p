import { type AbortOptions, multiaddr, type Multiaddr } from '@multiformats/multiaddr'
import { type ObjectSchema, array, number, object, string } from 'yup'
import { validateMultiaddr } from '../config/helpers.js'
import { AUTO_DIAL_INTERVAL, AUTO_DIAL_CONCURRENCY, AUTO_DIAL_PRIORITY, MAX_PEER_ADDRS_TO_DIAL, DIAL_TIMEOUT, INBOUND_UPGRADE_TIMEOUT, INBOUND_CONNECTION_THRESHOLD, MAX_INCOMING_PENDING_CONNECTIONS } from './constants.defaults.js'
import { MIN_CONNECTIONS, MAX_CONNECTIONS, MAX_PARALLEL_DIALS } from './constants.js'
import type { ConnectionManagerInit } from '.'
import type { LoggerOptions } from '@libp2p/interface'

/**
 * Resolve multiaddr recursively
 */
export async function resolveMultiaddrs (ma: Multiaddr, options: AbortOptions & LoggerOptions): Promise<Multiaddr[]> {
  // TODO: recursive logic should live in multiaddr once dns4/dns6 support is in place
  // Now only supporting resolve for dnsaddr
  const resolvableProto = ma.protoNames().includes('dnsaddr')

  // Multiaddr is not resolvable? End recursion!
  if (!resolvableProto) {
    return [ma]
  }

  const resolvedMultiaddrs = await resolveRecord(ma, options)
  const recursiveMultiaddrs = await Promise.all(resolvedMultiaddrs.map(async (nm) => {
    return resolveMultiaddrs(nm, options)
  }))

  const addrs = recursiveMultiaddrs.flat()
  const output = addrs.reduce<Multiaddr[]>((array, newM) => {
    if (array.find(m => m.equals(newM)) == null) {
      array.push(newM)
    }
    return array
  }, ([]))

  options.log('resolved %s to', ma, output.map(ma => ma.toString()))

  return output
}

/**
 * Resolve a given multiaddr. If this fails, an empty array will be returned
 */
async function resolveRecord (ma: Multiaddr, options: AbortOptions & LoggerOptions): Promise<Multiaddr[]> {
  try {
    ma = multiaddr(ma.toString()) // Use current multiaddr module
    const multiaddrs = await ma.resolve(options)
    return multiaddrs
  } catch (err) {
    options.log.error(`multiaddr ${ma.toString()} could not be resolved`, err)
    return []
  }
}

export const validateConnectionManagerConfig = (opts: ConnectionManagerInit): ObjectSchema<Record<string, unknown>> => {
  return object({
    maxConnections: number().integer().min(opts?.minConnections ?? MIN_CONNECTIONS, `maxConnections must be greater than or equal to minConnections: ${opts?.minConnections ?? MIN_CONNECTIONS}`).default(MAX_CONNECTIONS),
    minConnections: number().integer().min(0).max(opts?.maxConnections ?? MAX_CONNECTIONS, `minConnections must be less than or equal to maxConnections : ${opts?.maxConnections ?? MAX_CONNECTIONS}`).default(MIN_CONNECTIONS),
    autoDialInterval: number().integer().min(0).default(AUTO_DIAL_INTERVAL),
    autoDialConcurrency: number().integer().min(0).default(AUTO_DIAL_CONCURRENCY),
    autoDialPriority: number().integer().min(0).default(AUTO_DIAL_PRIORITY),
    maxParallelDials: number().integer().min(0).default(MAX_PARALLEL_DIALS),
    maxPeerAddrsToDialed: number().integer().min(0).default(MAX_PEER_ADDRS_TO_DIAL),
    dialTimeout: number().integer().min(0).default(DIAL_TIMEOUT),
    inboundUpgradeTimeout: number().integer().min(0).default(INBOUND_UPGRADE_TIMEOUT),
    allow: array().of(string()).test('is multiaddr', validateMultiaddr).default([]),
    deny: array().of(string()).test('is multiaddr', validateMultiaddr).default([]),
    inboundConnectionThreshold: number().integer().min(0).default(INBOUND_CONNECTION_THRESHOLD),
    maxIncomingPendingConnections: number().integer().min(0).default(MAX_INCOMING_PENDING_CONNECTIONS)
  })
}
