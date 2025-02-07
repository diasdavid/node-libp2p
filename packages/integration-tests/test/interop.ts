import fs from 'fs'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { circuitRelayServer, circuitRelayTransport } from '@libp2p/circuit-relay-v2'
import { privateKeyFromProtobuf } from '@libp2p/crypto/keys'
import { createClient } from '@libp2p/daemon-client'
import { createServer } from '@libp2p/daemon-server'
import { floodsub } from '@libp2p/floodsub'
import { identify } from '@libp2p/identify'
import { UnsupportedError, interopTests } from '@libp2p/interop'
import { kadDHT, passthroughMapper } from '@libp2p/kad-dht'
import { logger } from '@libp2p/logger'
import { mplex } from '@libp2p/mplex'
import { plaintext } from '@libp2p/plaintext'
import { tcp } from '@libp2p/tcp'
import { tls } from '@libp2p/tls'
import { webRTCDirect } from '@libp2p/webrtc'
import { multiaddr } from '@multiformats/multiaddr'
import { execa } from 'execa'
import { path as p2pd } from 'go-libp2p'
import { createLibp2p, type Libp2pOptions, type ServiceFactoryMap } from 'libp2p'
import pDefer from 'p-defer'
import type { ServiceMap, PrivateKey } from '@libp2p/interface'
import type { SpawnOptions, Daemon, DaemonFactory } from '@libp2p/interop'

/**
 * @packageDocumentation
 *
 * To enable debug logging, run the tests with the following env vars:
 *
 * ```console
 * DEBUG=libp2p*,go-libp2p:* npm run test:interop
 * ```
 */

async function createGoPeer (options: SpawnOptions): Promise<Daemon> {
  const controlPort = Math.floor(Math.random() * (50000 - 10000 + 1)) + 10000
  const apiAddr = multiaddr(`/ip4/127.0.0.1/tcp/${controlPort}`)

  const log = logger(`go-libp2p:${controlPort}`)

  const opts = [
    `-listen=${apiAddr.toString()}`
  ]

  if (options.noListen === true) {
    opts.push('-noListenAddrs')
  } else {
    if (options.transport == null || options.transport === 'tcp') {
      opts.push('-hostAddrs=/ip4/127.0.0.1/tcp/0')
    } else if (options.transport === 'webtransport') {
      opts.push('-hostAddrs=/ip4/127.0.0.1/udp/0/quic-v1/webtransport')
    } else if (options.transport === 'webrtc-direct') {
      opts.push('-hostAddrs=/ip4/127.0.0.1/udp/0/webrtc-direct')
    } else {
      throw new UnsupportedError()
    }
  }

  if (options.encryption != null) {
    opts.push(`-${options.encryption}=true`)
  }

  if (options.dht === true) {
    opts.push('-dhtServer')
  }

  if (options.relay === true) {
    opts.push('-relay')
  }

  if (options.pubsub === true) {
    opts.push('-pubsub')
  }

  if (options.pubsubRouter != null) {
    opts.push(`-pubsubRouter=${options.pubsubRouter}`)
  }

  if (options.key != null) {
    opts.push(`-id=${options.key}`)
  }

  if (options.muxer === 'mplex') {
    opts.push('-muxer=mplex')
  } else {
    opts.push('-muxer=yamux')
  }

  const deferred = pDefer()
  const proc = execa(p2pd(), opts, {
    env: {
      GOLOG_LOG_LEVEL: 'debug'
    }
  })

  proc.stdout?.on('data', (buf: Buffer) => {
    const str = buf.toString()
    log(str)

    // daemon has started
    if (str.includes('Control socket:')) {
      deferred.resolve()
    }
  })

  proc.stderr?.on('data', (buf) => {
    log.error(buf.toString())
  })

  await deferred.promise

  return {
    client: createClient(apiAddr),
    stop: async () => {
      proc.kill()
    }
  }
}

async function createJsPeer (options: SpawnOptions): Promise<Daemon> {
  let privateKey: PrivateKey | undefined

  if (options.key != null) {
    const keyFile = fs.readFileSync(options.key)
    privateKey = privateKeyFromProtobuf(keyFile)
  }

  const opts: Libp2pOptions<ServiceMap> = {
    privateKey,
    addresses: {
      listen: []
    },
    transports: [
      tcp(),
      circuitRelayTransport(),
      webRTCDirect()
    ],
    streamMuxers: [],
    connectionEncrypters: [noise()]
  }

  if (options.noListen !== true) {
    if (options.transport == null || options.transport === 'tcp') {
      opts.addresses?.listen?.push('/ip4/127.0.0.1/tcp/0')
    } else if (options.transport === 'webrtc-direct') {
      opts.addresses?.listen?.push('/ip4/127.0.0.1/udp/0/webrtc-direct')
    } else {
      throw new UnsupportedError()
    }
  }

  if (options.transport === 'webtransport') {
    throw new UnsupportedError()
  }

  const services: ServiceFactoryMap = {
    identify: identify()
  }

  if (options.encryption === 'noise') {
    opts.connectionEncrypters?.push(noise())
  } else if (options.encryption === 'tls') {
    opts.connectionEncrypters?.push(tls())
  } else if (options.encryption === 'plaintext') {
    opts.connectionEncrypters?.push(plaintext())
  }

  if (options.muxer === 'mplex') {
    opts.streamMuxers?.push(mplex())
  } else {
    opts.streamMuxers?.push(yamux())
  }

  if (options.pubsub === true) {
    if (options.pubsubRouter === 'floodsub') {
      services.pubsub = floodsub()
    } else {
      services.pubsub = gossipsub()
    }
  }

  if (options.relay === true) {
    services.relay = circuitRelayServer()
  }

  if (options.dht === true) {
    services.dht = kadDHT({
      protocol: '/ipfs/kad/1.0.0',
      peerInfoMapper: passthroughMapper,
      clientMode: false
    })
  }

  const node: any = await createLibp2p({
    ...opts,
    services
  })

  const server = createServer(multiaddr('/ip4/127.0.0.1/tcp/0'), node)
  await server.start()

  return {
    client: createClient(server.getMultiaddr()),
    stop: async () => {
      await server.stop()
      await node.stop()
    }
  }
}

async function main (): Promise<void> {
  const factory: DaemonFactory = {
    async spawn (options: SpawnOptions) {
      if (options.type === 'go') {
        return createGoPeer(options)
      }

      return createJsPeer(options)
    }
  }

  await interopTests(factory)
}

main().catch(err => {
  console.error(err) // eslint-disable-line no-console
  process.exit(1)
})
