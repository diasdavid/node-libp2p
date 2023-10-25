/* eslint-env mocha */

import { EventEmitter } from '@libp2p/interface/events'
import { isStartable } from '@libp2p/interface/startable'
import { mockStream } from '@libp2p/interface-compliance-tests/mocks'
import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import { expect } from 'aegir/chai'
import delay from 'delay'
import { duplexPair } from 'it-pair/duplex'
import { pbStream, type MessageStream } from 'it-protobuf-stream'
import Sinon from 'sinon'
import { stubInterface } from 'sinon-ts'
import { circuitRelayTransport } from '../../src/circuit-relay/index.js'
import { Status, StopMessage } from '../../src/circuit-relay/pb/index.js'
import type { Connection, Stream } from '@libp2p/interface/connection'
import type { ConnectionGater } from '@libp2p/interface/connection-gater'
import type { ContentRouting } from '@libp2p/interface/content-routing'
import type { PeerId } from '@libp2p/interface/peer-id'
import type { PeerStore } from '@libp2p/interface/peer-store'
import type { Transport, Upgrader } from '@libp2p/interface/transport'
import type { AddressManager } from '@libp2p/interface-internal/address-manager'
import type { ConnectionManager } from '@libp2p/interface-internal/connection-manager'
import type { Registrar, StreamHandler } from '@libp2p/interface-internal/registrar'
import type { TransportManager } from '@libp2p/interface-internal/transport-manager'

describe('circuit-relay stop protocol', function () {
  let transport: Transport
  let handler: StreamHandler
  let pbstr: MessageStream<StopMessage>
  let sourcePeer: PeerId
  const stopTimeout = 100
  let localStream: Stream
  let remoteStream: Stream

  beforeEach(async () => {
    const components = {
      addressManager: stubInterface<AddressManager>(),
      connectionManager: stubInterface<ConnectionManager>(),
      contentRouting: stubInterface<ContentRouting>(),
      peerId: await createEd25519PeerId(),
      peerStore: stubInterface<PeerStore>(),
      registrar: stubInterface<Registrar>(),
      transportManager: stubInterface<TransportManager>(),
      upgrader: stubInterface<Upgrader>(),
      connectionGater: stubInterface<ConnectionGater>(),
      events: new EventEmitter()
    }

    transport = circuitRelayTransport({
      stopTimeout
    })(components)

    if (isStartable(transport)) {
      await transport.start()
    }

    sourcePeer = await createEd25519PeerId()

    handler = components.registrar.handle.getCall(0).args[1]

    const [localDuplex, remoteDuplex] = duplexPair<any>()

    localStream = mockStream(localDuplex)
    remoteStream = mockStream(remoteDuplex)

    handler({
      stream: remoteStream,
      connection: stubInterface<Connection>()
    })

    pbstr = pbStream(localStream).pb(StopMessage)
  })

  this.afterEach(async function () {
    if (isStartable(transport)) {
      await transport.stop()
    }
  })

  it('handle stop - success', async function () {
    await pbstr.write({
      type: StopMessage.Type.CONNECT,
      peer: {
        id: sourcePeer.toBytes(),
        addrs: []
      }
    })

    const response = await pbstr.read()
    expect(response.status).to.be.equal(Status.OK)
  })

  it('handle stop error - invalid request - missing type', async function () {
    await pbstr.write({})

    const response = await pbstr.read()
    expect(response.status).to.be.equal(Status.MALFORMED_MESSAGE)
  })

  it('handle stop error - invalid request - wrong type', async function () {
    await pbstr.write({
      type: StopMessage.Type.STATUS,
      peer: {
        id: sourcePeer.toBytes(),
        addrs: []
      }
    })

    const response = await pbstr.read()
    expect(response.status).to.be.equal(Status.UNEXPECTED_MESSAGE)
  })

  it('handle stop error - invalid request - missing peer', async function () {
    await pbstr.write({
      type: StopMessage.Type.CONNECT
    })

    const response = await pbstr.read()
    expect(response.status).to.be.equal(Status.MALFORMED_MESSAGE)
  })

  it('handle stop error - invalid request - invalid peer addr', async function () {
    await pbstr.write({
      type: StopMessage.Type.CONNECT,
      peer: {
        id: sourcePeer.toBytes(),
        addrs: [
          new Uint8Array(32)
        ]
      }
    })

    const response = await pbstr.read()
    expect(response.status).to.be.equal(Status.MALFORMED_MESSAGE)
  })

  it('handle stop error - timeout', async function () {
    const abortSpy = Sinon.spy(remoteStream, 'abort')

    await pbstr.write({
      type: StopMessage.Type.CONNECT,
      peer: {
        id: sourcePeer.toBytes(),
        addrs: []
      }
    })

    // take longer than `stopTimeout` to read the response
    await delay(stopTimeout * 2)

    // should have aborted remote stream
    expect(abortSpy).to.have.property('called', true)
  })
})
