/* eslint-env mocha */

import {
  InvalidCryptoExchangeError,
  UnexpectedPeerError
} from '@libp2p/interface'
import { mockMultiaddrConnPair } from '@libp2p/interface-compliance-tests/mocks'
import { defaultLogger } from '@libp2p/logger'
import { peerIdFromBytes } from '@libp2p/peer-id'
import { createEd25519PeerId, createRSAPeerId } from '@libp2p/peer-id-factory'
import { multiaddr } from '@multiformats/multiaddr'
import { expect } from 'aegir/chai'
import sinon from 'sinon'
import { tls } from '../src/index.js'
import type { ConnectionEncrypter, PeerId } from '@libp2p/interface'

describe('tls', () => {
  let localPeer: PeerId
  let remotePeer: PeerId
  let wrongPeer: PeerId
  let encrypter: ConnectionEncrypter

  beforeEach(async () => {
    [localPeer, remotePeer, wrongPeer] = await Promise.all([
      createEd25519PeerId(),
      createEd25519PeerId(),
      createEd25519PeerId()
    ])

    encrypter = tls()({
      peerId: await createEd25519PeerId(),
      logger: defaultLogger()
    })
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should verify the public key and id match', async () => {
    const { inbound, outbound } = mockMultiaddrConnPair({
      remotePeer,
      addrs: [
        multiaddr('/ip4/127.0.0.1/tcp/1234'),
        multiaddr('/ip4/127.0.0.1/tcp/1235')
      ]
    })

    await Promise.all([
      encrypter.secureInbound(inbound, remotePeer),
      encrypter.secureOutbound(outbound, wrongPeer)
    ]).then(() => expect.fail('should have failed'), (err) => {
      expect(err).to.exist()
      expect(err).to.have.property('code', UnexpectedPeerError.code)
    })
  })

  it('should fail if the peer does not provide its public key', async () => {
    const peer = await createRSAPeerId()
    remotePeer = peerIdFromBytes(peer.toBytes())

    encrypter = tls()({
      peerId: remotePeer,
      logger: defaultLogger()
    })

    const { inbound, outbound } = mockMultiaddrConnPair({
      remotePeer,
      addrs: [
        multiaddr('/ip4/127.0.0.1/tcp/1234'),
        multiaddr('/ip4/127.0.0.1/tcp/1235')
      ]
    })

    await expect(Promise.all([
      encrypter.secureInbound(inbound),
      encrypter.secureOutbound(outbound, localPeer)
    ]))
      .to.eventually.be.rejected.with.property('code', InvalidCryptoExchangeError.code)
  })
})
