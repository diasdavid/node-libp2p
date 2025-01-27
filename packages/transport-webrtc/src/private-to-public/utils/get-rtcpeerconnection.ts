import { Crypto } from '@peculiar/webcrypto'
import { PeerConnection } from 'node-datachannel'
import { RTCPeerConnection } from '../../webrtc/index.js'
import { DEFAULT_STUN_SERVERS } from '../constants.js'
import { generateTransportCertificate } from './generate-certificates.js'
import type { TransportCertificate } from '../../index.js'
import type { CertificateFingerprint, IceServer, RTCIceMode } from 'node-datachannel'

const crypto = new Crypto()

/**
 * Convert the lib.dom.d.ts RTCIceServer type into a libdatachannel IceServer
 */
export function toLibdatachannelIceServers (arg?: RTCIceServer[]): IceServer[] | undefined {
  if (arg == null) {
    return
  }

  if (arg.length === 0) {
    return []
  }

  function toLibdatachannelIceServer <T> (arg: string, init: T): T & { hostname: string, port: number } {
    const url = new URL(arg)

    return {
      ...init,
      hostname: url.hostname,
      port: parseInt(url.port)
    }
  }

  const output: IceServer[] = []

  for (const server of arg) {
    if (typeof server.urls === 'string') {
      output.push(toLibdatachannelIceServer(server.urls, server))
      continue
    }

    for (const url of server.urls) {
      output.push(toLibdatachannelIceServer(url, server))
    }
  }

  return output
}

interface DirectRTCPeerConnectionInit extends RTCConfiguration {
  peerConnection: PeerConnection
  ufrag: string
  iceMode?: RTCIceMode
}

export class DirectRTCPeerConnection extends RTCPeerConnection {
  private readonly peerConnection: PeerConnection
  private readonly ufrag: string
  private readonly iceMode?: RTCIceMode

  constructor (init: DirectRTCPeerConnectionInit) {
    super(init)

    this.peerConnection = init.peerConnection
    this.ufrag = init.ufrag
    this.iceMode = init.iceMode
  }

  createDataChannel (label: string, dataChannelDict?: RTCDataChannelInit): RTCDataChannel {
    const channel = super.createDataChannel(label, dataChannelDict)

    // have to set ufrag after first datachannel is created
    if (this.connectionState === 'new') {
      this.peerConnection.setLocalDescription('offer', {
        iceUfrag: this.ufrag,
        icePwd: this.ufrag,
        iceMode: this.iceMode
      })
    }

    return channel
  }

  remoteFingerprint (): CertificateFingerprint {
    return this.peerConnection.remoteFingerprint()
  }
}

export async function createDialerRTCPeerConnection (role: 'listener' | 'dialer', ufrag: string, rtcConfiguration?: RTCConfiguration | (() => RTCConfiguration | Promise<RTCConfiguration>), certificate?: TransportCertificate): Promise<DirectRTCPeerConnection> {
  if (certificate == null) {
    // ECDSA is preferred over RSA here. From our testing we find that P-256
    // elliptic curve is supported by Pion, webrtc-rs, as well as Chromium
    // (P-228 and P-384 was not supported in Chromium). We use the same hash
    // function as found in the multiaddr if it is supported.
    const keyPair = await crypto.subtle.generateKey({
      name: 'ECDSA',
      namedCurve: 'P-256'
    }, true, ['sign', 'verify'])

    certificate = await generateTransportCertificate(keyPair, {
      days: 365
    })
  }

  const rtcConfig = typeof rtcConfiguration === 'function' ? await rtcConfiguration() : rtcConfiguration

  // https://github.com/libp2p/specs/blob/master/webrtc/webrtc-direct.md#browser-to-public-server
  const peerConnection = new PeerConnection(role, {
    disableFingerprintVerification: true,
    disableAutoNegotiation: true,
    certificatePemFile: certificate.pem,
    keyPemFile: certificate.privateKey,
    maxMessageSize: 16384,
    iceServers: toLibdatachannelIceServers(rtcConfig?.iceServers) ?? DEFAULT_STUN_SERVERS
  })

  return new DirectRTCPeerConnection({
    peerConnection,
    ufrag,
    // TODO: workaround for https://github.com/pion/ice/issues/359#issuecomment-2610300555
    iceMode: role === 'listener' ? 'controlled' : 'controlling'
  })
}
