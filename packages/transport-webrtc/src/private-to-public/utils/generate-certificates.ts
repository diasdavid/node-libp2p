import { Crypto } from '@peculiar/webcrypto'
import * as x509 from '@peculiar/x509'
import { base64url } from 'multiformats/bases/base64'
import { sha256 } from 'multiformats/hashes/sha2'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import type { TransportCertificate } from '../..'

const crypto = new Crypto()
x509.cryptoProvider.set(crypto)

const ONE_DAY_MS = 86400000

export interface GenerateTransportCertificateOptions {
  days: number
  start?: Date
  extensions?: any[]
}

export async function generateTransportCertificate (keyPair: CryptoKeyPair, options: GenerateTransportCertificateOptions): Promise<TransportCertificate> {
  const notBefore = options.start ?? new Date()
  notBefore.setMilliseconds(0)
  const notAfter = new Date(notBefore.getTime() + (options.days * ONE_DAY_MS))
  notAfter.setMilliseconds(0)

  const cert = await x509.X509CertificateGenerator.createSelfSigned({
    serialNumber: (BigInt(Math.random().toString().replace('.', '')) * 100000n).toString(16),
    name: 'CN=ca.com, C=US, L=CA, O=example, ST=CA',
    notBefore,
    notAfter,
    signingAlgorithm: {
      name: 'ECDSA'
    },
    keys: keyPair,
    extensions: [
      new x509.BasicConstraintsExtension(false, undefined, true)
    ]
  })

  const exported = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
  const privateKeyPem = [
    '-----BEGIN PRIVATE KEY-----',
    ...uint8ArrayToString(new Uint8Array(exported), 'base64pad').split(/(.{64})/).filter(Boolean),
    '-----END PRIVATE KEY-----'
  ].join('\n')

  return {
    privateKey: privateKeyPem,
    pem: cert.toString('pem'),
    certhash: base64url.encode((await sha256.digest(new Uint8Array(cert.rawData))).bytes)
  }
}
