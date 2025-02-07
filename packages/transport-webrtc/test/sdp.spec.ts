import { multiaddr } from '@multiformats/multiaddr'
import { expect } from 'aegir/chai'
import * as underTest from '../src/private-to-public/utils/sdp.js'
import { MAX_MESSAGE_SIZE } from '../src/stream.js'

const sampleMultiAddr = multiaddr('/ip4/0.0.0.0/udp/56093/webrtc/certhash/uEiByaEfNSLBexWBNFZy_QB1vAKEj7JAXDizRs4_SnTflsQ')
const sampleCerthash = 'uEiByaEfNSLBexWBNFZy_QB1vAKEj7JAXDizRs4_SnTflsQ'
const sampleSdp = `v=0
o=- 0 0 IN IP4 0.0.0.0
s=-
c=IN IP4 0.0.0.0
t=0 0
a=ice-lite
m=application 56093 UDP/DTLS/SCTP webrtc-datachannel
a=mid:0
a=setup:passive
a=ice-ufrag:MyUserFragment
a=ice-pwd:MyUserFragment
a=fingerprint:sha-256 72:68:47:CD:48:B0:5E:C5:60:4D:15:9C:BF:40:1D:6F:00:A1:23:EC:90:17:0E:2C:D1:B3:8F:D2:9D:37:E5:B1
a=sctp-port:5000
a=max-message-size:${MAX_MESSAGE_SIZE}
a=candidate:1467250027 1 UDP 1467250027 0.0.0.0 56093 typ host
a=end-of-candidates`

describe('SDP', () => {
  it('converts multiaddr with certhash to an answer SDP', async () => {
    const ufrag = 'MyUserFragment'
    const sdp = underTest.serverAnswerFromMultiaddr(sampleMultiAddr, ufrag)

    expect(sdp.sdp).to.contain(ufrag)
  })

  it('extracts certhash from a multiaddr', () => {
    const certhash = underTest.certhash(sampleMultiAddr)

    expect(certhash).to.equal(sampleCerthash)
  })

  it('decodes a certhash', () => {
    const decoded = underTest.decodeCerthash(sampleCerthash)

    // sha2-256 multihash 0x12 permanent
    // https://github.com/multiformats/multicodec/blob/master/table.csv
    expect(decoded.code).to.equal(0x12)
    expect(decoded.size).to.equal(32)
    expect(decoded.digest.toString()).to.equal('114,104,71,205,72,176,94,197,96,77,21,156,191,64,29,111,0,161,35,236,144,23,14,44,209,179,143,210,157,55,229,177')
  })

  it('converts a multiaddr into a fingerprint', () => {
    const fingerpint = underTest.ma2Fingerprint(sampleMultiAddr)
    expect(fingerpint).to.equal('sha-256 72:68:47:CD:48:B0:5E:C5:60:4D:15:9C:BF:40:1D:6F:00:A1:23:EC:90:17:0E:2C:D1:B3:8F:D2:9D:37:E5:B1')
  })

  it('extracts a fingerprint from sdp', () => {
    const fingerprint = underTest.getFingerprintFromSdp(sampleSdp)
    expect(fingerprint).to.equal('72:68:47:CD:48:B0:5E:C5:60:4D:15:9C:BF:40:1D:6F:00:A1:23:EC:90:17:0E:2C:D1:B3:8F:D2:9D:37:E5:B1')
  })

  it('munges the ufrag and pwd in a SDP', () => {
    const result = underTest.munge({ type: 'answer', sdp: sampleSdp }, 'someotheruserfragmentstring')
    const expected = `v=0
o=- 0 0 IN IP4 0.0.0.0
s=-
c=IN IP4 0.0.0.0
t=0 0
a=ice-lite
m=application 56093 UDP/DTLS/SCTP webrtc-datachannel
a=mid:0
a=setup:passive
a=ice-ufrag:someotheruserfragmentstring
a=ice-pwd:someotheruserfragmentstring
a=fingerprint:sha-256 72:68:47:CD:48:B0:5E:C5:60:4D:15:9C:BF:40:1D:6F:00:A1:23:EC:90:17:0E:2C:D1:B3:8F:D2:9D:37:E5:B1
a=sctp-port:5000
a=max-message-size:${MAX_MESSAGE_SIZE}
a=candidate:1467250027 1 UDP 1467250027 0.0.0.0 56093 typ host
a=end-of-candidates`

    expect(result.sdp).to.equal(expected)
  })

  it('should turn a fingerprint into a multiaddr fragment', () => {
    const input = 'B9:3F:A1:4B:E8:46:73:08:6F:73:51:3E:27:9D:56:B7:29:67:4C:4A:B8:8D:21:EF:BF:E6:BA:16:37:BA:6C:2A'
    const output = underTest.fingerprint2Ma(input)

    expect(output.toString()).to.equal('/certhash/uEiC5P6FL6EZzCG9zUT4nnVa3KWdMSriNIe-_5roWN7psKg')
  })
})
