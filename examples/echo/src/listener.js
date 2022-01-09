'use strict'
/* eslint-disable no-console */

/*
 * Listener Node
 */

const PeerId = require('peer-id')
const createLibp2p = require('./libp2p')
const pipe = require('it-pipe')

async function run() {
  const listenerId = await PeerId.createFromJSON(require('./id-l'))

  // Listener libp2p node
  const listenerNode = await createLibp2p({
    addresses: {
      listen: ['/ip4/0.0.0.0/tcp/10333']
    },
    peerId: listenerId
  })

  // Log a message when we receive a connection
  listenerNode.connectionManager.on('peer:connect', (connection) => {
    console.log('received dial to me from:', connection.remotePeer.toB58String())
  })

  // Handle incoming connections for the protocol by piping from the stream
  // back to itself (an echo)
  await listenerNode.handle('/echo/1.0.0', async ({ stream }) => {

    pipe(
      stream.source,
      source => (async function * () {
        for await (const data of source) {
          console.log('received message : ' + data)

          let msg = data.toString()

          yield msg

          if(msg[msg.length-1]==='\n') {
            return
          }
        }
      })(),
      stream.sink
    )
  })

  // Start listening
  await listenerNode.start()

  console.log('Listener ready, listening on:')
  listenerNode.multiaddrs.forEach((ma) => {
    console.log(ma.toString() + '/p2p/' + listenerId.toB58String())
  })
}

run()
