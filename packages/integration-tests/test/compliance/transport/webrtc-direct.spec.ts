import tests from '@libp2p/interface-compliance-tests/transport'
import { webRTCDirect } from '@libp2p/webrtc'
import { WebRTCDirect } from '@multiformats/multiaddr-matcher'
import { isNode, isElectron } from 'wherearewe'

describe('WebRTC-Direct interface-transport compliance', () => {
  if (!isNode && !isElectron) {
    return
  }

  tests({
    async setup () {
      const dialer = {
        transports: [
          webRTCDirect()
        ],
        connectionMonitor: {
          enabled: false
        }
      }

      return {
        dialer,
        listener: {
          addresses: {
            listen: [
              '/ip4/127.0.0.1/udp/0/webrtc-direct',
              '/ip4/127.0.0.1/udp/0/webrtc-direct'
            ]
          },
          ...dialer
        },
        dialMultiaddrMatcher: WebRTCDirect,
        listenMultiaddrMatcher: WebRTCDirect
      }
    },
    async teardown () {}
  })
})
