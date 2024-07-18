/* eslint-env mocha */

import { multiaddr } from '@multiformats/multiaddr'
import { expect } from 'aegir/chai'
import { isPrivate } from '../../src/multiaddr/is-private.js'

describe('multiaddr isPrivate', () => {
  it('identifies private ip4 multiaddrs', () => {
    [
      multiaddr('/ip4/127.0.0.1/tcp/1000'),
      multiaddr('/ip4/10.0.0.1/tcp/1000'),
      multiaddr('/ip4/192.168.0.1/tcp/1000'),
      multiaddr('/ip4/172.16.0.1/tcp/1000')
    ].forEach(ma => {
      expect(isPrivate(ma)).to.eql(true)
    })
  })

  it('identifies public ip4 multiaddrs', () => {
    [
      multiaddr('/ip4/101.0.26.90/tcp/1000'),
      multiaddr('/ip4/40.1.20.9/tcp/1000'),
      multiaddr('/ip4/92.168.0.1/tcp/1000'),
      multiaddr('/ip4/2.16.0.1/tcp/1000')
    ].forEach(ma => {
      expect(isPrivate(ma)).to.eql(false)
    })
  })

  it('identifies private ip6 multiaddrs', () => {
    [
      multiaddr('/ip6/fd52:8342:fc46:6c91:3ac9:86ff:fe31:7095/tcp/1000'),
      multiaddr('/ip6/fd52:8342:fc46:6c91:3ac9:86ff:fe31:1/tcp/1000'),
      multiaddr('/ip6/::ffff:0a00:0001/tcp/1000'), // 10.0.0.1
      multiaddr('/ip6/::ffff:ac10:0001/tcp/1000'), // 172.16.0.1
      multiaddr('/ip6/::ffff:c0a8:0001/tcp/1000'), // 192.168.0.1
      multiaddr('/ip6/::ffff:7f00:0001/tcp/1000') // 127.0.0.1
    ].forEach(ma => {
      try {
        expect(isPrivate(ma)).to.eql(true)
      } catch (error) {
        throw new Error(`Failed for ${ma.toString()}`)
      }
    })
  })

  it('identifies public ip6 multiaddrs', () => {
    [
      multiaddr('/ip6/2001:8a0:7ac5:4201:3ac9:86ff:fe31:7095/tcp/1000'),
      multiaddr('/ip6/2000:8a0:7ac5:4201:3ac9:86ff:fe31:7095/tcp/1000'),
      multiaddr('/ip6/::ffff:6500:1a5a/tcp/1000'), // 101.0.26.90
      multiaddr('/ip6/::ffff:2801:1409/tcp/1000'), // 40.1.20.9
      multiaddr('/ip6/::ffff:5ca8:0001/tcp/1000'), // 92.168.0.1 (not a private range)
      multiaddr('/ip6/::ffff:0200:0010/tcp/1000') // 2.16.0.1 (not a private range)
    ].forEach(ma => {
      expect(isPrivate(ma)).to.eql(false)
    })
  })

  it('identifies other multiaddrs as not private addresses', () => {
    [
      multiaddr('/dns4/wss0.bootstrap.libp2p.io/tcp/443'),
      multiaddr('/dns6/wss0.bootstrap.libp2p.io/tcp/443')
    ].forEach(ma => {
      expect(isPrivate(ma)).to.eql(false)
    })
  })

  it('identifies non-public addresses', () => {
    [
      multiaddr('/ip4/127.0.0.1/tcp/1000/p2p-circuit'),
      multiaddr('/unix/foo/bar/baz.sock'),
      multiaddr('/ip4/127.0.0.1/sctp/1000')
    ].forEach(ma => {
      expect(isPrivate(ma)).to.eql(true)
    })
  })
})
