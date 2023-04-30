import mergeOptions from 'merge-options'
import { dnsaddrResolver } from '@multiformats/multiaddr/resolvers'
import { publicAddressesFirst } from '@libp2p/utils/address-sort'
import { FaultTolerance } from '@libp2p/interface-transport'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { Libp2pInit } from './index.js'
import { codes, messages } from './errors.js'
import { CodeError } from '@libp2p/interfaces/errors'
import type { RecursivePartial } from '@libp2p/interfaces'
import type { ServiceMap } from '@libp2p/interface-libp2p'

const DefaultConfig: Partial<Libp2pInit> = {
  addresses: {
    listen: [],
    announce: [],
    noAnnounce: [],
    announceFilter: (multiaddrs: Multiaddr[]) => multiaddrs
  },
  connectionManager: {
    resolvers: {
      dnsaddr: dnsaddrResolver
    },
    addressSorter: publicAddressesFirst
  },
  transportManager: {
    faultTolerance: FaultTolerance.FATAL_ALL
  },
  peerRouting: {
    refreshManager: {
      enabled: true,
      interval: 6e5,
      bootDelay: 10e3
    }
  }
/*

  nat: {
    enabled: true,
    ttl: 7200,
    keepAlive: true
  },
  identify: {
    protocolPrefix: 'ipfs',
    host: {
      agentVersion: AGENT_VERSION
    },
    // https://github.com/libp2p/go-libp2p/blob/8d2e54e1637041d5cf4fac1e531287560bd1f4ac/p2p/protocol/identify/id.go#L48
    timeout: 60000,
    maxInboundStreams: 1,
    maxOutboundStreams: 1,
    maxPushIncomingStreams: 1,
    maxPushOutgoingStreams: 1,
    maxObservedAddresses: 10
  },
  ping: {
    protocolPrefix: 'ipfs',
    // See https://github.com/libp2p/specs/blob/d4b5fb0152a6bb86cfd9ea/ping/ping.md?plain=1#L38-L43
    // The dialing peer MUST NOT keep more than one outbound stream for the ping protocol per peer.
    // The listening peer SHOULD accept at most two streams per peer since cross-stream behavior is
    // non-linear and stream writes occur asynchronously. The listening peer may perceive the
    // dialing peer closing and opening the wrong streams (for instance, closing stream B and
    // opening stream A even though the dialing peer is opening stream B and closing stream A).
    maxInboundStreams: 2,
    maxOutboundStreams: 1,
    timeout: 10000
  },
  fetch: {
    protocolPrefix: 'libp2p',
    maxInboundStreams: 1,
    maxOutboundStreams: 1,
    timeout: 10000
  },
  autonat: {
    protocolPrefix: 'libp2p',
    maxInboundStreams: 1,
    maxOutboundStreams: 1,
    timeout: 30000,
    startupDelay: 5000,
    refreshInterval: 60000
  }

*/
}

export function validateConfig <T extends ServiceMap = {}> (opts: RecursivePartial<Libp2pInit<T>>): Libp2pInit<T> {
  const resultingOptions: Libp2pInit<T> = mergeOptions(DefaultConfig, opts)

  if (resultingOptions.transports == null || resultingOptions.transports.length < 1) {
    throw new CodeError(messages.ERR_TRANSPORTS_REQUIRED, codes.ERR_TRANSPORTS_REQUIRED)
  }

  if (resultingOptions.connectionEncryption == null || resultingOptions.connectionEncryption.length === 0) {
    throw new CodeError(messages.CONN_ENCRYPTION_REQUIRED, codes.CONN_ENCRYPTION_REQUIRED)
  }

  if (resultingOptions.connectionProtector === null && globalThis.process?.env?.LIBP2P_FORCE_PNET != null) { // eslint-disable-line no-undef
    throw new CodeError(messages.ERR_PROTECTOR_REQUIRED, codes.ERR_PROTECTOR_REQUIRED)
  }

  return resultingOptions
}
