import { noise } from '@chainsafe/libp2p-noise'
import { raceEvent } from 'race-event'
import { WebRTCTransportError } from '../../error.js'
import { WebRTCMultiaddrConnection } from '../../maconn.js'
import { DataChannelMuxerFactory } from '../../muxer.js'
import { createStream } from '../../stream.js'
import { isFirefox } from '../../util.js'
import { generateNoisePrologue } from './generate-noise-prologue.js'
import * as sdp from './sdp.js'
import type { DirectRTCPeerConnection } from './get-rtcpeerconnection.js'
import type { DataChannelOptions } from '../../index.js'
import type { ComponentLogger, Connection, CounterGroup, Logger, Metrics, PeerId, PrivateKey, Upgrader } from '@libp2p/interface'
import type { Multiaddr } from '@multiformats/multiaddr'

export interface ConnectOptions {
  log: Logger
  logger: ComponentLogger
  metrics?: Metrics
  events?: CounterGroup
  remoteAddr: Multiaddr
  role: 'client' | 'server'
  dataChannel?: DataChannelOptions
  upgrader: Upgrader
  peerId: PeerId
  remotePeerId?: PeerId
  signal: AbortSignal
  privateKey: PrivateKey
}

export interface ClientOptions extends ConnectOptions {
  role: 'client'
}

export interface ServerOptions extends ConnectOptions {
  role: 'server'
}

const CONNECTION_STATE_CHANGE_EVENT = isFirefox ? 'iceconnectionstatechange' : 'connectionstatechange'

export async function connect (peerConnection: DirectRTCPeerConnection, ufrag: string, options: ClientOptions): Promise<Connection>
export async function connect (peerConnection: DirectRTCPeerConnection, ufrag: string, options: ServerOptions): Promise<void>
export async function connect (peerConnection: DirectRTCPeerConnection, ufrag: string, options: ConnectOptions): Promise<any> {
  // create data channel for running the noise handshake. Once the data
  // channel is opened, the remote will initiate the noise handshake. This
  // is used to confirm the identity of the peer.
  const handshakeDataChannel = peerConnection.createDataChannel('', { negotiated: true, id: 0 })

  if (options.role === 'client') {
    // the client has to set the local offer before the remote answer

    // Create offer and munge sdp with ufrag == pwd. This allows the remote to
    // respond to STUN messages without performing an actual SDP exchange.
    // This is because it can infer the passwd field by reading the USERNAME
    // attribute of the STUN message.
    options.log.trace('client creating local offer')
    const offerSdp = await peerConnection.createOffer()
    options.log.trace('client created local offer %s', offerSdp.sdp)
    const mungedOfferSdp = sdp.munge(offerSdp, ufrag)
    options.log.trace('client setting local offer %s', mungedOfferSdp.sdp)
    await peerConnection.setLocalDescription(mungedOfferSdp)

    const answerSdp = sdp.serverAnswerFromMultiaddr(options.remoteAddr, ufrag)
    options.log.trace('client setting server description %s', answerSdp.sdp)
    await peerConnection.setRemoteDescription(answerSdp)
  } else {
    // the server has to set the remote offer before the local answer
    const offerSdp = sdp.clientOfferFromMultiAddr(options.remoteAddr, ufrag)
    options.log.trace('server setting client %s %s', offerSdp.type, offerSdp.sdp)
    await peerConnection.setRemoteDescription(offerSdp)

    // Create offer and munge sdp with ufrag == pwd. This allows the remote to
    // respond to STUN messages without performing an actual SDP exchange.
    // This is because it can infer the passwd field by reading the USERNAME
    // attribute of the STUN message.
    options.log.trace('server creating local answer')
    const answerSdp = await peerConnection.createAnswer()
    options.log.trace('server created local answer')
    const mungedAnswerSdp = sdp.munge(answerSdp, ufrag)
    options.log.trace('server setting local description %s', mungedAnswerSdp.sdp)
    await peerConnection.setLocalDescription(mungedAnswerSdp)
  }

  options.log.trace('%s wait for handshake channel to open', options.role)
  await raceEvent(handshakeDataChannel, 'open', options.signal)

  options.log.trace('%s handshake channel opened', options.role)

  if (options.role === 'server') {
    // now that the connection has been opened, add the remote's certhash to
    // it's multiaddr so we can complete the noise handshake
    const remoteFingerprint = peerConnection.remoteFingerprint()?.value ?? ''
    options.remoteAddr = options.remoteAddr.encapsulate(sdp.fingerprint2Ma(remoteFingerprint))
  }

  // Do noise handshake.
  // Set the Noise Prologue to libp2p-webrtc-noise:<FINGERPRINTS> before
  // starting the actual Noise handshake.
  // <FINGERPRINTS> is the concatenation of the of the two TLS fingerprints
  // of A (responder) and B (initiator) in their byte representation.
  const localFingerprint = sdp.getFingerprintFromSdp(peerConnection.localDescription?.sdp)

  if (localFingerprint == null) {
    throw new WebRTCTransportError('Could not get fingerprint from local description sdp')
  }

  options.log.trace('%s performing noise handshake', options.role)
  const noisePrologue = generateNoisePrologue(localFingerprint, options.remoteAddr, options.role)

  // Since we use the default crypto interface and do not use a static key
  // or early data, we pass in undefined for these parameters.
  const connectionEncrypter = noise({ prologueBytes: noisePrologue })(options)

  const wrappedChannel = createStream({
    channel: handshakeDataChannel,
    direction: 'inbound',
    logger: options.logger,
    ...(options.dataChannel ?? {})
  })
  const wrappedDuplex = {
    ...wrappedChannel,
    sink: wrappedChannel.sink.bind(wrappedChannel),
    source: (async function * () {
      for await (const list of wrappedChannel.source) {
        for (const buf of list) {
          yield buf
        }
      }
    }())
  }

  // Creating the connection before completion of the noise
  // handshake ensures that the stream opening callback is set up
  const maConn = new WebRTCMultiaddrConnection(options, {
    peerConnection,
    remoteAddr: options.remoteAddr,
    timeline: {
      open: Date.now()
    },
    metrics: options.events
  })

  peerConnection.addEventListener(CONNECTION_STATE_CHANGE_EVENT, () => {
    switch (peerConnection.connectionState) {
      case 'failed':
      case 'disconnected':
      case 'closed':
        maConn.close().catch((err) => {
          options.log.error('error closing connection', err)
        })
        break
      default:
        break
    }
  })

  // Track opened peer connection
  options.events?.increment({ peer_connection: true })

  const muxerFactory = new DataChannelMuxerFactory(options, {
    peerConnection,
    metrics: options.events,
    dataChannelOptions: options.dataChannel
  })

  if (options.role === 'client') {
    // For outbound connections, the remote is expected to start the noise handshake.
    // Therefore, we need to secure an inbound noise connection from the remote.
    options.log.trace('%s secure inbound', options.role)
    await connectionEncrypter.secureInbound(wrappedDuplex, {
      remotePeer: options.remotePeerId
    })

    options.log.trace('%s upgrade outbound', options.role)
    return options.upgrader.upgradeOutbound(maConn, { skipProtection: true, skipEncryption: true, muxerFactory })
  }

  // For inbound connections, we are expected to start the noise handshake.
  // Therefore, we need to secure an outbound noise connection from the remote.
  options.log.trace('%s secure outbound', options.role)
  const result = await connectionEncrypter.secureOutbound(wrappedDuplex, {
    remotePeer: options.remotePeerId
  })
  maConn.remoteAddr = maConn.remoteAddr.encapsulate(`/p2p/${result.remotePeer}`)

  options.log.trace('%s upgrade inbound', options.role)

  await options.upgrader.upgradeInbound(maConn, {
    skipProtection: true,
    skipEncryption: true,
    muxerFactory
  })
}
