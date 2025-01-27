/* eslint-disable @typescript-eslint/no-floating-promises */

import { generateKeyPair } from '@libp2p/crypto/keys'
import { transportSymbol } from '@libp2p/interface'
import { defaultLogger } from '@libp2p/logger'
import { peerIdFromPrivateKey } from '@libp2p/peer-id'
import { multiaddr } from '@multiformats/multiaddr'
import { expect } from 'aegir/chai'
import { stubInterface } from 'sinon-ts'
import { WebRTCDirectTransport, type WebRTCDirectTransportComponents } from '../src/private-to-public/transport.js'
import type { TransportManager } from '@libp2p/interface-internal'

describe('WebRTCDirect Transport', () => {
  let components: WebRTCDirectTransportComponents

  before(async () => {
    const privateKey = await generateKeyPair('Ed25519')

    components = {
      peerId: peerIdFromPrivateKey(privateKey),
      logger: defaultLogger(),
      transportManager: stubInterface<TransportManager>(),
      privateKey
    }
  })

  it('can construct', () => {
    const t = new WebRTCDirectTransport(components)
    expect(t.constructor.name).to.equal('WebRTCDirectTransport')
  })

  it('toString property getter', () => {
    const t = new WebRTCDirectTransport(components)
    const s = t[Symbol.toStringTag]
    expect(s).to.equal('@libp2p/webrtc-direct')
  })

  it('symbol property getter', () => {
    const t = new WebRTCDirectTransport(components)
    const s = t[transportSymbol]
    expect(s).to.equal(true)
  })

  it('transport filter filters out invalid multiaddrs', async () => {
    const valid = [
      multiaddr('/ip4/1.2.3.4/udp/1234/webrtc-direct/certhash/uEiAUqV7kzvM1wI5DYDc1RbcekYVmXli_Qprlw3IkiEg6tQ/p2p/12D3KooWGDMwwqrpcYKpKCgxuKT2NfqPqa94QnkoBBpqvCaiCzWd')
    ]
    const invalid = [
      multiaddr('/ip4/1.2.3.4/udp/1234/webrtc/certhash/uEiAUqV7kzvM1wI5DYDc1RbcekYVmXli_Qprlw3IkiEg6tQ'),
      multiaddr('/ip4/1.2.3.4/tcp/1234/webrtc-direct/p2p/12D3KooWGDMwwqrpcYKpKCgxuKT2NfqPqa94QnkoBBpqvCaiCzWd'),
      multiaddr('/ip4/1.2.3.4/udp/1234/certhash/uEiAUqV7kzvM1wI5DYDc1RbcekYVmXli_Qprlw3IkiEg6tQ/p2p/12D3KooWGDMwwqrpcYKpKCgxuKT2NfqPqa94QnkoBBpqvCaiCzWd')
    ]

    const t = new WebRTCDirectTransport(components)

    expect(t.listenFilter([
      ...valid,
      ...invalid
    ])).to.deep.equal(valid)
  })
})
