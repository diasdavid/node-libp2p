import { Crypto } from '@peculiar/webcrypto'
import { PeerConnection } from 'node-datachannel'
import { RTCPeerConnection } from 'node-datachannel/polyfill'
import { DEFAULT_STUN_SERVERS } from '../constants.js'
import { generateTransportCertificate } from './generate-certificates.js'
import type { TransportCertificate } from '../../index.js'
import type { CertificateFingerprint } from 'node-datachannel'

const crypto = new Crypto()

interface DirectRTCPeerConnectionInit extends RTCConfiguration {
  certificate: TransportCertificate
  ufrag: string
  role: 'client' | 'server'
  peerConnection: PeerConnection
}

export class DirectRTCPeerConnection extends RTCPeerConnection {
  private readonly peerConnection: PeerConnection
  private readonly ufrag: string

  constructor (init: DirectRTCPeerConnectionInit) {
    super(init)

    this.peerConnection = init.peerConnection
    this.ufrag = init.ufrag
  }

  async createOffer (): Promise<globalThis.RTCSessionDescriptionInit | any> {
    // have to set ufrag before creating offer
    if (this.connectionState === 'new') {
      this.peerConnection?.setLocalDescription('offer', {
        iceUfrag: this.ufrag,
        icePwd: this.ufrag
      })
    }

    return super.createOffer()
  }

  async createAnswer (): Promise<globalThis.RTCSessionDescriptionInit | any> {
    // have to set ufrag before creating answer
    if (this.connectionState === 'new') {
      this.peerConnection?.setLocalDescription('answer', {
        iceUfrag: this.ufrag,
        icePwd: this.ufrag
      })
    }

    return super.createAnswer()
  }

  remoteFingerprint (): CertificateFingerprint {
    if (this.peerConnection == null) {
      throw new Error('Invalid state: peer connection not set')
    }

    return this.peerConnection.remoteFingerprint()
  }
}

function mapIceServers (iceServers?: RTCIceServer[]): string[] {
  return iceServers
    ?.map((server) => {
      const urls = Array.isArray(server.urls) ? server.urls : [server.urls]

      return urls.map((url) => {
        if (server.username != null && server.credential != null) {
          const [protocol, rest] = url.split(/:(.*)/)
          return `${protocol}:${server.username}:${server.credential}@${rest}`
        }
        return url
      })
    })
    .flat() ?? []
}

export async function createDialerRTCPeerConnection (role: 'client' | 'server', ufrag: string, rtcConfiguration?: RTCConfiguration | (() => RTCConfiguration | Promise<RTCConfiguration>), certificate?: TransportCertificate): Promise<DirectRTCPeerConnection> {
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

  return new DirectRTCPeerConnection({
    ...rtcConfig,
    ufrag,
    certificate,
    role,
    peerConnection: new PeerConnection(`${role}-${Date.now()}`, {
      disableFingerprintVerification: true,
      disableAutoNegotiation: true,
      certificatePemFile: certificate.pem,
      keyPemFile: certificate.privateKey,
      maxMessageSize: 16384,
      iceServers: mapIceServers(rtcConfig?.iceServers ?? DEFAULT_STUN_SERVERS.map(urls => ({ urls })))
    })
  })
}
