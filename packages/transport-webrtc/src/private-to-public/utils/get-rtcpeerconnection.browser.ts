export async function createDialerRTCPeerConnection (role: 'client' | 'server', ufrag: string, rtcConfiguration?: RTCConfiguration | (() => RTCConfiguration | Promise<RTCConfiguration>), certificate?: RTCCertificate): Promise<RTCPeerConnection> {
  if (certificate == null) {
    // ECDSA is preferred over RSA here. From our testing we find that P-256 elliptic
    // curve is supported by Pion, webrtc-rs, as well as Chromium (P-228 and P-384
    // was not supported in Chromium). We use the same hash function as found in the
    // multiaddr if it is supported.
    certificate = await RTCPeerConnection.generateCertificate({
      name: 'ECDSA',

      // @ts-expect-error missing from lib.dom.d.ts but required by chrome
      namedCurve: 'P-256'
      // hash: sdp.toSupportedHashFunction(hashName)
    })
  }

  const rtcConfig = typeof rtcConfiguration === 'function' ? await rtcConfiguration() : rtcConfiguration

  return new RTCPeerConnection({
    ...(rtcConfig ?? {}),
    certificates: [certificate]
  })
}
