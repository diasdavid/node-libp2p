/* eslint-env mocha */

import { expect } from 'aegir/chai'
import { pEvent } from 'p-event'
import { type FetchService, fetchService } from '../../src/fetch/index.js'
import { identifyService } from '../../src/identify/index.js'
import { createLibp2p } from '../../src/index.js'
import { type PingService, pingService } from '../../src/ping/index.js'
import { createBaseOptions } from '../fixtures/base-options.js'
import type { Libp2p } from '@libp2p/interface'

describe('Protocol prefix is configurable', () => {
  let libp2p: Libp2p<{ identify: unknown, ping: PingService, fetch: FetchService }>

  afterEach(async () => {
    if (libp2p != null) {
      await libp2p.stop()
    }
  })

  it('protocolPrefix is provided', async () => {
    const testProtocol = 'test-protocol'
    libp2p = await createLibp2p(createBaseOptions({
      services: {
        identify: identifyService({
          protocolPrefix: testProtocol
        }),
        ping: pingService({
          protocolPrefix: testProtocol
        }),
        fetch: fetchService({
          protocolPrefix: testProtocol
        })
      },
      start: false
    }))

    const eventPromise = pEvent(libp2p, 'self:peer:update')
    await libp2p.start()
    await eventPromise

    const peer = await libp2p.peerStore.get(libp2p.peerId)
    expect(peer.protocols).to.include.members([
      `/${testProtocol}/fetch/0.0.1`,
      `/${testProtocol}/id/1.0.0`,
      `/${testProtocol}/id/push/1.0.0`,
      `/${testProtocol}/ping/1.0.0`
    ])
  })

  it('protocolPrefix is not provided', async () => {
    libp2p = await createLibp2p(createBaseOptions({
      services: {
        identify: identifyService(),
        ping: pingService(),
        fetch: fetchService()
      },
      start: false
    }))

    const eventPromise = pEvent(libp2p, 'self:peer:update')
    await libp2p.start()
    await eventPromise

    const peer = await libp2p.peerStore.get(libp2p.peerId)
    expect(peer.protocols).to.include.members([
      '/ipfs/id/1.0.0',
      '/ipfs/id/push/1.0.0',
      '/ipfs/ping/1.0.0',
      '/libp2p/fetch/0.0.1'
    ])
  })
})
