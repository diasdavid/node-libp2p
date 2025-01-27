export async function createDialerRTCPeerConnection (ufrag: string, rtcConfiguration?: RTCConfiguration): Promise<RTCPeerConnection> {
  // ECDSA is preferred over RSA here. From our testing we find that P-256 elliptic
  // curve is supported by Pion, webrtc-rs, as well as Chromium (P-228 and P-384
  // was not supported in Chromium). We use the same hash function as found in the
  // multiaddr if it is supported.
  const certificate = await RTCPeerConnection.generateCertificate({
    name: 'ECDSA',

    // @ts-expect-error missing from lib.dom.d.ts but required by chrome
    namedCurve: 'P-256'
    // hash: sdp.toSupportedHashFunction(hashName)
  })

  return new RTCPeerConnection({
    ...(rtcConfiguration ?? {}),
    certificates: [certificate]
  })
}
