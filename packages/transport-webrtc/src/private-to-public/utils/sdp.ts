import { InvalidParametersError } from '@libp2p/interface'
import { multiaddr } from '@multiformats/multiaddr'
import { base64url } from 'multiformats/bases/base64'
import { bases, digest } from 'multiformats/basics'
import * as Digest from 'multiformats/hashes/digest'
import { sha256 } from 'multiformats/hashes/sha2'
import { InvalidFingerprintError, UnsupportedHashAlgorithmError } from '../../error.js'
import { MAX_MESSAGE_SIZE } from '../../stream.js'
import { CERTHASH_CODE } from '../transport.js'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { MultihashDigest } from 'multiformats/hashes/interface'

/**
 * Get base2 | identity decoders
 */
// @ts-expect-error - Not easy to combine these types.
export const mbdecoder: any = Object.values(bases).map(b => b.decoder).reduce((d, b) => d.or(b))

const fingerprintRegex = /^a=fingerprint:(?:\w+-[0-9]+)\s(?<fingerprint>(:?[0-9a-fA-F]{2})+)$/m
export function getFingerprintFromSdp (sdp: string | undefined): string | undefined {
  if (sdp == null) {
    return undefined
  }

  const searchResult = sdp.match(fingerprintRegex)
  return searchResult?.groups?.fingerprint
}

/**
 * Get base2 | identity decoders
 */
function ipv (ma: Multiaddr): string {
  for (const proto of ma.protoNames()) {
    if (proto.startsWith('ip')) {
      return proto.toUpperCase()
    }
  }

  return 'IP6'
}

// Extract the certhash from a multiaddr
export function certhash (ma: Multiaddr): string {
  const tups = ma.stringTuples()
  const certhash = tups.filter((tup) => tup[0] === CERTHASH_CODE).map((tup) => tup[1])[0]

  if (certhash === undefined || certhash === '') {
    throw new InvalidParametersError(`Couldn't find a certhash component of multiaddr: ${ma.toString()}`)
  }

  return certhash
}

/**
 * Convert a certhash into a multihash
 */
export function decodeCerthash (certhash: string): MultihashDigest {
  return digest.decode(mbdecoder.decode(certhash))
}

export function certhashToFingerprint (certhash: string): string {
  const mbdecoded = decodeCerthash(certhash)

  return new Array(mbdecoded.bytes.length)
    .fill(0)
    .map((val, index) => {
      return mbdecoded.digest[index].toString(16).padStart(2, '0').toUpperCase()
    })
    .join(':')
}

/**
 * Extract the fingerprint from a multiaddr
 */
export function ma2Fingerprint (ma: Multiaddr): string[] {
  const mhdecoded = decodeCerthash(certhash(ma))
  const prefix = toSupportedHashFunction(mhdecoded.code)
  const fingerprint = mhdecoded.digest.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')
  const sdp = fingerprint.match(/.{1,2}/g)

  if (sdp == null) {
    throw new InvalidFingerprintError(fingerprint, ma.toString())
  }

  return [`${prefix} ${sdp.join(':').toUpperCase()}`, fingerprint]
}

export function fingerprint2Ma (fingerprint: string): Multiaddr {
  const output = fingerprint.split(':').map(str => parseInt(str, 16))
  const encoded = Uint8Array.from(output)
  const digest = Digest.create(sha256.code, encoded)

  return multiaddr(`/certhash/${base64url.encode(digest.bytes)}`)
}

/**
 * Normalize the hash name from a given multihash has name
 */
export function toSupportedHashFunction (code: number): 'sha-1' | 'sha-256' | 'sha-512' {
  switch (code) {
    case 0x11:
      return 'sha-1'
    case 0x12:
      return 'sha-256'
    case 0x13:
      return 'sha-512'
    default:
      throw new UnsupportedHashAlgorithmError(code)
  }
}

/**
 * Create an offer SDP message from a multiaddr
 */
export function responderOfferFromMultiaddr (ma: Multiaddr, ufrag: string): RTCSessionDescriptionInit {
  const { host, port } = ma.toOptions()
  const ipVersion = ipv(ma)

  const sdp = `v=0
o=rtc 779560196 0 IN ${ipVersion} ${host}
s=-
t=0 0
a=group:BUNDLE 0
a=msid-semantic:WMS *
a=ice-options:ice2,trickle
a=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00
m=application ${port} UDP/DTLS/SCTP webrtc-datachannel
c=IN ${ipVersion} ${host}
a=mid:0
a=sendrecv
a=sctp-port:5000
a=max-message-size:16384
a=setup:active
a=ice-ufrag:${ufrag}
a=ice-pwd:${ufrag}
a=candidate:1467250027 1 UDP 1467250027 ${host} ${port} typ host
a=end-of-candidates
`

  return {
    type: 'offer',
    sdp
  }
}

/**
 * Create an answer SDP message from a multiaddr
 */
export function initiatorOfferFromMultiAddr (ma: Multiaddr, ufrag: string): RTCSessionDescriptionInit {
  const { host, port } = ma.toOptions()
  const ipVersion = ipv(ma)
  const [CERTFP] = ma2Fingerprint(ma)
  const sdp = `v=0
o=- 0 0 IN ${ipVersion} ${host}
s=-
c=IN ${ipVersion} ${host}
t=0 0
a=ice-options:ice2,trickle
m=application ${port} UDP/DTLS/SCTP webrtc-datachannel
a=mid:0
a=setup:passive
a=ice-ufrag:${ufrag}
a=ice-pwd:${ufrag}
a=fingerprint:${CERTFP}
a=sctp-port:5000
a=max-message-size:${MAX_MESSAGE_SIZE}
a=candidate:1467250027 1 UDP 1467250027 ${host} ${port} typ host
a=end-of-candidates
`

  return {
    type: 'answer',
    sdp
  }
}

/**
 * Replace (munge) the ufrag and password values in a SDP
 */
export function munge (desc: RTCSessionDescriptionInit, ufrag: string): RTCSessionDescriptionInit {
  if (desc.sdp === undefined) {
    throw new InvalidParametersError("Can't munge a missing SDP")
  }

  const lineBreak = desc.sdp.includes('\r\n') ? '\r\n' : '\n'

  desc.sdp = desc.sdp
    .replace(/\na=ice-ufrag:[^\n]*\n/, '\na=ice-ufrag:' + ufrag + lineBreak)
    .replace(/\na=ice-pwd:[^\n]*\n/, '\na=ice-pwd:' + ufrag + lineBreak)
  return desc
}
