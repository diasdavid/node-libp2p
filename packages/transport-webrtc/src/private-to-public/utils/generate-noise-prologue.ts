import * as Digest from 'multiformats/hashes/digest'
import { sha256 } from 'multiformats/hashes/sha2'
import { concat } from 'uint8arrays/concat'
import { fromString as uint8arrayFromString } from 'uint8arrays/from-string'
import * as sdp from './sdp.js'
import type { Multiaddr } from '@multiformats/multiaddr'

const PREFIX = uint8arrayFromString('libp2p-webrtc-noise:')

/**
 * Generate a noise prologue from the peer connection's certificate.
 * noise prologue = bytes('libp2p-webrtc-noise:') + noise-responder fingerprint + noise-initiator fingerprint
 */
export function generateNoisePrologue (localFingerprint: string, remoteAddr: Multiaddr, role: 'initiator' | 'responder'): Uint8Array {
  const localFpString = localFingerprint.trim().toLowerCase().replaceAll(':', '')
  const localFpArray = uint8arrayFromString(localFpString, 'hex')
  const local = Digest.create(sha256.code, localFpArray)
  const remote: Uint8Array = sdp.mbdecoder.decode(sdp.certhash(remoteAddr))
  const byteLength = PREFIX.byteLength + local.bytes.byteLength + remote.byteLength

  if (role === 'responder') {
    return concat([PREFIX, local.bytes, remote], byteLength)
  }

  return concat([PREFIX, remote, local.bytes], byteLength)
}
