/* eslint-env mocha */

import * as fs from 'fs'

import { connectionPair, mockRegistrar, mockUpgrader } from '@libp2p/interface-mocks'
import { EventEmitter } from '@libp2p/interfaces/events'
import { start, stop } from '@libp2p/interfaces/startable'
import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import { PersistentPeerStore } from '@libp2p/peer-store'
import { expect } from 'aegir/chai'
import { MemoryDatastore } from 'datastore-core'
import { stubInterface } from 'sinon-ts'
import { defaultComponents, type Components } from '../../libp2p/dist/src/components.js'
import { DefaultConnectionManager } from '../../libp2p/dist/src/connection-manager'
import { perfService, type PerfServiceInit } from '../src/index.js'
import type { ConnectionGater } from '@libp2p/interface-connection-gater'
import type { TransportManager } from '@libp2p/interface-transport'
import { generatePerformanceOutput } from '../src/printResults.js'

const defaultInit: PerfServiceInit = {
  protocolName: '/perf/1.0.0',
  maxInboundStreams: 1 << 10,
  maxOutboundStreams: 1 << 10,
  timeout: 1000,
  writeBlockSize: BigInt(64 << 10)
}

async function createComponents (index: number): Promise<Components> {
  const peerId = await createEd25519PeerId()

  const events = new EventEmitter()

  const components = defaultComponents({
    peerId,
    registrar: mockRegistrar(),
    upgrader: mockUpgrader(),
    datastore: new MemoryDatastore(),
    transportManager: stubInterface<TransportManager>(),
    connectionGater: stubInterface<ConnectionGater>(),
    events
  })

  components.peerStore = new PersistentPeerStore(components)
  components.connectionManager = new DefaultConnectionManager(components, {
    minConnections: 50,
    maxConnections: 1000,
    autoDialInterval: 1000,
    inboundUpgradeTimeout: 1000
  })

  return components
}

describe('perf', () => {
  let localComponents: Components
  let remoteComponents: Components

  beforeEach(async () => {
    localComponents = await createComponents(0)
    remoteComponents = await createComponents(1)

    await Promise.all([
      start(localComponents),
      start(remoteComponents)
    ])
  })

  afterEach(async () => {
    await Promise.all([
      stop(localComponents),
      stop(remoteComponents)
    ])
  })

  it('should run perf', async () => {
    const client = perfService(defaultInit)(localComponents)
    const server = perfService(defaultInit)(remoteComponents)

    await start(client)
    await start(server)

    // simulate connection between nodes
    const [localToRemote, remoteToLocal] = connectionPair(localComponents, remoteComponents)
    localComponents.events.safeDispatchEvent('connection:open', { detail: localToRemote })
    remoteComponents.events.safeDispatchEvent('connection:open', { detail: remoteToLocal })

    // Run Perf
    await expect(client.perf(remoteComponents.peerId, 1n << 10n, 1n << 10n)).to.eventually.be.fulfilled()
  })

  it('should output benchmark', async () => {
    const client = perfService(defaultInit)(localComponents)
    const server = perfService(defaultInit)(remoteComponents)

    await start(client)
    await start(server)

    // simulate connection between nodes
    const [localToRemote, remoteToLocal] = connectionPair(localComponents, remoteComponents)
    localComponents.events.safeDispatchEvent('connection:open', { detail: localToRemote })
    remoteComponents.events.safeDispatchEvent('connection:open', { detail: remoteToLocal })

    // Run Perf
    const downloadBandwidth = await client.measureDownloadBandwidth(remoteComponents.peerId, 10n << 20n) >> 10
    // eslint-disable-next-line no-console
    console.log('Download bandwidth: ', downloadBandwidth , ' kiB/s')

    const uploadBandwidth = await client.measureDownloadBandwidth(remoteComponents.peerId, 10n << 20n) >> 10
    // eslint-disable-next-line no-console
    console.log('Upload bandwidth: ', uploadBandwidth, ' kiB/s')

    const { previousDownloadBandwidth, previousUploadBandwidth } = JSON.parse(fs.readFileSync('../perf.txt', 'utf8'))

    const markdownContent = generatePerformanceOutput(downloadBandwidth, previousDownloadBandwidth, uploadBandwidth, previousUploadBandwidth)

    fs.writeFileSync('../perf.txt', JSON.stringify({
      previousDownloadBandwidth: downloadBandwidth ,
      previousUploadBandwidth: uploadBandwidth
    }))

    fs.writeFileSync('../perfReport.md', markdownContent)
  })
})
