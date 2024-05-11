import { peerIdFromBytes } from '@libp2p/peer-id'
import { Libp2pRecord } from '@libp2p/record'
import { isPrivateIp } from '@libp2p/utils/private-ip'
import { Key } from 'interface-datastore/key'
import { sha256 } from 'multiformats/hashes/sha2'
import { concat as uint8ArrayConcat } from 'uint8arrays/concat'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { xor as uint8ArrayXor } from 'uint8arrays/xor'
import { RECORD_KEY_PREFIX } from './constants.js'
import type { PeerId, PeerInfo } from '@libp2p/interface'
import type { Multiaddr } from '@multiformats/multiaddr'

// const IPNS_PREFIX = uint8ArrayFromString('/ipns/')
const PK_PREFIX = uint8ArrayFromString('/pk/')

export function removePrivateAddressesMapper (peer: PeerInfo): PeerInfo {
  return {
    ...peer,
    multiaddrs: peer.multiaddrs.filter(multiaddr => {
      const [[type, addr]] = multiaddr.stringTuples()

      // treat /dns, /dns4, and /dns6 addrs as public
      if (type === 53 || type === 54 || type === 55) {
        // localhost can be a dns address but it's private
        if (addr === 'localhost') {
          return false
        }

        return true
      }

      if (type !== 4 && type !== 6) {
        return false
      }

      if (addr == null) {
        return false
      }

      const isPrivate = isPrivateIp(addr)

      if (isPrivate == null) {
        // not an ip address
        return true
      }

      return !isPrivate
    })
  }
}

export function removePublicAddressesMapper (peer: PeerInfo): PeerInfo {
  return {
    ...peer,
    multiaddrs: peer.multiaddrs.filter(multiaddr => {
      const [[type, addr]] = multiaddr.stringTuples()

      if (addr === 'localhost') {
        return true
      }

      if (type !== 4 && type !== 6) {
        return false
      }

      if (addr == null) {
        return false
      }

      const isPrivate = isPrivateIp(addr)

      if (isPrivate == null) {
        // not an ip address
        return false
      }

      return isPrivate
    })
  }
}

export function passthroughMapper (info: PeerInfo): PeerInfo {
  return info
}

/**
 * Creates a DHT ID by hashing a given Uint8Array
 */
export async function convertBuffer (buf: Uint8Array): Promise<Uint8Array> {
  const multihash = await sha256.digest(buf)

  return multihash.digest
}

/**
 * Creates a DHT ID by hashing a Peer ID
 */
export async function convertPeerId (peerId: PeerId): Promise<Uint8Array> {
  return convertBuffer(peerId.toBytes())
}

/**
 * Convert a Uint8Array to their SHA2-256 hash
 */
export function bufferToKey (buf: Uint8Array): Key {
  return new Key('/' + uint8ArrayToString(buf, 'base32'), false)
}

/**
 * Convert a Uint8Array to their SHA2-256 hash
 */
export function bufferToRecordKey (buf: Uint8Array): Key {
  return new Key(`${RECORD_KEY_PREFIX}/${uint8ArrayToString(buf, 'base32')}`, false)
}

/**
 * Generate the key for a public key.
 */
export function keyForPublicKey (peer: PeerId): Uint8Array {
  return uint8ArrayConcat([
    PK_PREFIX,
    peer.toBytes()
  ])
}

export function isPublicKeyKey (key: Uint8Array): boolean {
  return uint8ArrayToString(key.subarray(0, 4)) === '/pk/'
}

export function isIPNSKey (key: Uint8Array): boolean {
  return uint8ArrayToString(key.subarray(0, 4)) === '/ipns/'
}

export function fromPublicKeyKey (key: Uint8Array): PeerId {
  return peerIdFromBytes(key.subarray(4))
}

/**
 * Create a new put record, encodes and signs it if enabled
 */
export function createPutRecord (key: Uint8Array, value: Uint8Array): Uint8Array {
  const timeReceived = new Date()
  const rec = new Libp2pRecord(key, value, timeReceived)

  return rec.serialize()
}

export function debounce (callback: () => void, wait: number = 100): () => void {
  let timeout: ReturnType<typeof setTimeout>

  return (): void => {
    clearTimeout(timeout)
    timeout = setTimeout(() => { callback() }, wait)
  }
}

// see https://github.com/multiformats/multiaddr/blob/master/protocols.csv
const P2P_CIRCUIT_CODE = 290
const DNS4_CODE = 54
const DNS6_CODE = 55
const DNSADDR_CODE = 56
const IP4_CODE = 4
const IP6_CODE = 41

export function multiaddrIsPublic (multiaddr: Multiaddr): boolean {
  const tuples = multiaddr.stringTuples()

  // p2p-circuit should not enable server mode
  for (const tuple of tuples) {
    if (tuple[0] === P2P_CIRCUIT_CODE) {
      return false
    }
  }

  // dns4 or dns6 or dnsaddr
  if (tuples[0][0] === DNS4_CODE || tuples[0][0] === DNS6_CODE || tuples[0][0] === DNSADDR_CODE) {
    return true
  }

  // ip4 or ip6
  if (tuples[0][0] === IP4_CODE || tuples[0][0] === IP6_CODE) {
    const result = isPrivateIp(`${tuples[0][1]}`)
    const isPublic = result == null || !result

    return isPublic
  }

  return false
}

export function getDistance (from: Uint8Array, to: Uint8Array): bigint {
  return BigInt('0x' + uint8ArrayToString(uint8ArrayXor(from, to), 'base16'))
}
