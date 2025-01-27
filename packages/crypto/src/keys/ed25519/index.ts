import crypto from 'crypto'
import { concat as uint8arrayConcat } from 'uint8arrays/concat'
import { fromString as uint8arrayFromString } from 'uint8arrays/from-string'
import { toString as uint8arrayToString } from 'uint8arrays/to-string'
import type { Uint8ArrayKeyPair } from '../interface.js'
import type { Uint8ArrayList } from 'uint8arraylist'

const keypair = crypto.generateKeyPairSync

const PUBLIC_KEY_BYTE_LENGTH = 32
const PRIVATE_KEY_BYTE_LENGTH = 64 // private key is actually 32 bytes but for historical reasons we concat private and public keys
const KEYS_BYTE_LENGTH = 32
const SIGNATURE_BYTE_LENGTH = 64

export { PUBLIC_KEY_BYTE_LENGTH as publicKeyLength }
export { PRIVATE_KEY_BYTE_LENGTH as privateKeyLength }

function derivePublicKey (privateKey: Uint8Array): Uint8Array {
  const keyObject = crypto.createPrivateKey({
    format: 'jwk',
    key: {
      crv: 'Ed25519',
      x: '',
      d: uint8arrayToString(privateKey, 'base64url'),
      kty: 'OKP'
    }
  })
  const jwk = keyObject.export({
    format: 'jwk'
  })

  if (jwk.x == null || jwk.x === '') {
    throw new Error('Could not export JWK public key')
  }

  return uint8arrayFromString(jwk.x, 'base64url')
}

export function generateKey (): Uint8ArrayKeyPair {
  const key = keypair('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'jwk' },
    privateKeyEncoding: { type: 'pkcs8', format: 'jwk' }
  })

  // @ts-expect-error node types are missing jwk as a format
  const privateKeyRaw = uint8arrayFromString(key.privateKey.d, 'base64url')
  // @ts-expect-error node types are missing jwk as a format
  const publicKeyRaw = uint8arrayFromString(key.publicKey.x, 'base64url')

  return {
    privateKey: uint8arrayConcat([privateKeyRaw, publicKeyRaw], privateKeyRaw.byteLength + publicKeyRaw.byteLength),
    publicKey: publicKeyRaw
  }
}

/**
 * Generate keypair from a 32 byte uint8array
 */
export function generateKeyFromSeed (seed: Uint8Array): Uint8ArrayKeyPair {
  if (seed.length !== KEYS_BYTE_LENGTH) {
    throw new TypeError('"seed" must be 32 bytes in length.')
  } else if (!(seed instanceof Uint8Array)) {
    throw new TypeError('"seed" must be a node.js Buffer, or Uint8Array.')
  }

  // based on node forges algorithm, the seed is used directly as private key
  const publicKeyRaw = derivePublicKey(seed)

  return {
    privateKey: uint8arrayConcat([seed, publicKeyRaw], seed.byteLength + publicKeyRaw.byteLength),
    publicKey: publicKeyRaw
  }
}

export function hashAndSign (key: Uint8Array, msg: Uint8Array | Uint8ArrayList): Buffer {
  if (!(key instanceof Uint8Array)) {
    throw new TypeError('"key" must be a node.js Buffer, or Uint8Array.')
  }

  let privateKey: Uint8Array
  let publicKey: Uint8Array

  if (key.byteLength === PRIVATE_KEY_BYTE_LENGTH) {
    privateKey = key.subarray(0, 32)
    publicKey = key.subarray(32)
  } else if (key.byteLength === KEYS_BYTE_LENGTH) {
    privateKey = key.subarray(0, 32)
    publicKey = derivePublicKey(privateKey)
  } else {
    throw new TypeError('"key" must be 64 or 32 bytes in length.')
  }

  const obj = crypto.createPrivateKey({
    format: 'jwk',
    key: {
      crv: 'Ed25519',
      d: uint8arrayToString(privateKey, 'base64url'),
      x: uint8arrayToString(publicKey, 'base64url'),
      kty: 'OKP'
    }
  })

  return crypto.sign(null, msg instanceof Uint8Array ? msg : msg.subarray(), obj)
}

export function hashAndVerify (key: Uint8Array, sig: Uint8Array, msg: Uint8Array | Uint8ArrayList): boolean {
  if (key.byteLength !== PUBLIC_KEY_BYTE_LENGTH) {
    throw new TypeError('"key" must be 32 bytes in length.')
  } else if (!(key instanceof Uint8Array)) {
    throw new TypeError('"key" must be a node.js Buffer, or Uint8Array.')
  }

  if (sig.byteLength !== SIGNATURE_BYTE_LENGTH) {
    throw new TypeError('"sig" must be 64 bytes in length.')
  } else if (!(sig instanceof Uint8Array)) {
    throw new TypeError('"sig" must be a node.js Buffer, or Uint8Array.')
  }

  const obj = crypto.createPublicKey({
    format: 'jwk',
    key: {
      crv: 'Ed25519',
      x: uint8arrayToString(key, 'base64url'),
      kty: 'OKP'
    }
  })

  return crypto.verify(null, msg instanceof Uint8Array ? msg : msg.subarray(), obj, sig)
}
