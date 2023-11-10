/* eslint-env mocha */

import { peerIdFromString } from '@libp2p/peer-id'
import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import { multiaddr } from '@multiformats/multiaddr'
import { expect } from 'aegir/chai'
import { pEvent } from 'p-event'
import pWaitFor from 'p-wait-for'
import sinon from 'sinon'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { AGENT_VERSION } from '../../src/identify/consts.js'
import { type IdentifyService, identifyService } from '../../src/identify/index.js'
import { createLibp2p } from '../../src/index.js'
import { createBaseOptions } from '../fixtures/base-options.browser.js'
import type { Libp2p, IdentifyResult } from '@libp2p/interface'
import type { PeerId } from '@libp2p/interface/peer-id'

describe('identify', () => {
  let peerId: PeerId
  let libp2p: Libp2p<{ identify: IdentifyService }>
  let remoteLibp2p: Libp2p<{ identify: IdentifyService }>
  const remoteAddr = multiaddr(process.env.RELAY_MULTIADDR)

  before(async () => {
    peerId = await createEd25519PeerId()
  })

  afterEach(async () => {
    sinon.restore()

    if (libp2p != null) {
      await libp2p.stop()
    }
  })

  after(async () => {
    if (remoteLibp2p != null) {
      await remoteLibp2p.stop()
    }
  })

  it('should run identify automatically after connecting', async () => {
    libp2p = await createLibp2p(createBaseOptions({
      peerId,
      services: {
        identify: identifyService()
      }
    }))

    await libp2p.start()

    if (libp2p.services.identify == null) {
      throw new Error('Identity service was not configured')
    }

    const identityServiceIdentifySpy = sinon.spy(libp2p.services.identify, 'identify')

    const connection = await libp2p.dial(remoteAddr)
    expect(connection).to.exist()

    // Wait for peer store to be updated
    expect(identityServiceIdentifySpy.callCount).to.equal(1)

    // The connection should have no open streams
    await pWaitFor(() => connection.streams.length === 0)
    await connection.close()
  })

  it('should emit peer:identify event after connecting', async () => {
    libp2p = await createLibp2p(createBaseOptions({
      peerId,
      services: {
        identify: identifyService()
      }
    }))

    await libp2p.start()

    if (libp2p.services.identify == null) {
      throw new Error('Identity service was not configured')
    }

    const eventPromise = pEvent<'peer:identify', CustomEvent<IdentifyResult>>(libp2p, 'peer:identify')

    const connection = await libp2p.dial(remoteAddr)
    expect(connection).to.exist()

    // Wait for event to be emitted
    const event = await eventPromise

    const remotePeer = peerIdFromString(remoteAddr.getPeerId() ?? '')

    expect(event.detail.peerId.equals(remotePeer)).to.be.true()
    await connection.close()
  })

  it('should store remote agent and protocol versions in metadataBook after connecting', async () => {
    libp2p = await createLibp2p(createBaseOptions({
      peerId,
      services: {
        identify: identifyService()
      }
    }))

    await libp2p.start()

    if (libp2p.services.identify == null) {
      throw new Error('Identity service was not configured')
    }

    const identityServiceIdentifySpy = sinon.spy(libp2p.services.identify, 'identify')

    const connection = await libp2p.dial(remoteAddr)
    expect(connection).to.exist()

    // Wait for peer store to be updated
    expect(identityServiceIdentifySpy.callCount).to.equal(1)

    // The connection should have no open streams
    await pWaitFor(() => connection.streams.length === 0)
    await connection.close()

    const remotePeerId = peerIdFromString(remoteAddr.getPeerId() ?? '')

    const remotePeer = await libp2p.peerStore.get(remotePeerId)
    expect(remotePeer.metadata.get('AgentVersion')).to.exist()
    expect(remotePeer.metadata.get('ProtocolVersion')).to.exist()
  })

  it('should push protocol updates to an already connected peer', async () => {
    libp2p = await createLibp2p(createBaseOptions({
      peerId,
      services: {
        identify: identifyService()
      }
    }))

    await libp2p.start()

    if (libp2p.services.identify == null) {
      throw new Error('Identity service was not configured')
    }

    const identityServiceIdentifySpy = sinon.spy(libp2p.services.identify, 'identify')
    const identityServicePushSpy = sinon.spy(libp2p.services.identify, 'push')
    const connectionPromise = pEvent(libp2p, 'connection:open')
    const connection = await libp2p.dial(remoteAddr)

    expect(connection).to.exist()
    // Wait for connection event to be emitted
    await connectionPromise

    // Wait for identify to finish
    await identityServiceIdentifySpy.firstCall.returnValue
    sinon.stub(libp2p, 'isStarted').returns(true)

    // Cause supported protocols to change
    await libp2p.handle('/echo/2.0.0', () => {})

    // Wait for push to complete
    await pWaitFor(() => identityServicePushSpy.callCount === 1)
    await identityServicePushSpy.firstCall.returnValue

    // Cause supported protocols to change back
    await libp2p.unhandle('/echo/2.0.0')

    // Wait for push to complete a second time
    await pWaitFor(() => identityServicePushSpy.callCount === 2)
    await identityServicePushSpy.secondCall.returnValue

    // Verify the remote peer is notified of both changes
    expect(identityServicePushSpy.callCount).to.equal(2)

    // Verify the streams close
    await pWaitFor(() => connection.streams.length === 0)
  })

  it('should append UserAgent information to default AGENT_VERSION', async () => {
    // Stub environment version for testing dynamic AGENT_VERSION
    sinon.stub(process, 'version').value('vTEST')

    if (typeof globalThis.navigator !== 'undefined') {
      sinon.stub(navigator, 'userAgent').value('vTEST')
    }

    libp2p = await createLibp2p(createBaseOptions({
      peerId,
      services: {
        identify: identifyService()
      }
    }))

    await libp2p.start()

    if (libp2p.services.identify == null) {
      throw new Error('Identity service was not configured')
    }

    const peer = await libp2p.peerStore.get(peerId)
    const storedAgentVersion = peer.metadata.get('AgentVersion')

    expect(AGENT_VERSION + ' UserAgent=vTEST').to.equal(uint8ArrayToString(storedAgentVersion ?? new Uint8Array()))
  })

  it('should store host data and protocol version into peer store', async () => {
    const agentVersion = 'js-project/1.0.0'

    libp2p = await createLibp2p(createBaseOptions({
      peerId,
      services: {
        identify: identifyService({
          agentVersion
        })
      }
    }))

    await libp2p.start()

    if (libp2p.services.identify == null) {
      throw new Error('Identity service was not configured')
    }

    const remotePeer = await libp2p.peerStore.get(peerId)
    expect(remotePeer.metadata.get('AgentVersion')).to.deep.equal(uint8ArrayFromString(agentVersion))
    expect(remotePeer.metadata.get('ProtocolVersion')).to.exist()
  })

  it('should push multiaddr updates to an already connected peer', async () => {
    libp2p = await createLibp2p(createBaseOptions({
      peerId,
      services: {
        identify: identifyService()
      }
    }))

    await libp2p.start()

    if (libp2p.services.identify == null) {
      throw new Error('Identity service was not configured')
    }

    const identityServiceIdentifySpy = sinon.spy(libp2p.services.identify, 'identify')
    const identityServicePushSpy = sinon.spy(libp2p.services.identify, 'push')
    const connectionPromise = pEvent(libp2p, 'connection:open')
    const connection = await libp2p.dial(remoteAddr)

    expect(connection).to.exist()
    // Wait for connection event to be emitted
    await connectionPromise

    // Wait for identify to finish
    await identityServiceIdentifySpy.firstCall.returnValue
    sinon.stub(libp2p, 'isStarted').returns(true)

    await libp2p.peerStore.merge(libp2p.peerId, {
      multiaddrs: [multiaddr('/ip4/180.0.0.1/tcp/15001/ws')]
    })

    // the protocol change event listener in the identity service is async
    await pWaitFor(() => identityServicePushSpy.callCount === 1)

    // Verify the remote peer is notified of change
    expect(identityServicePushSpy.callCount).to.equal(1)

    // Verify the streams close
    await pWaitFor(() => connection.streams.length === 0)
  })
})
