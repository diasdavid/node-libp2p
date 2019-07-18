'use strict'

const nextTick = require('async/nextTick')
const { messages, codes } = require('./errors')
const FloodSub = require('libp2p-floodsub')
const promisify = require('promisify-es6')

const errCode = require('err-code')

module.exports = (node) => {
  const floodSub = new FloodSub(node)

  node._floodSub = floodSub

  return {
    subscribe: promisify((topic, options, handler, callback) => {
      if (typeof options === 'function') {
        callback = handler
        handler = options
        options = {}
      }

      if (!node.isStarted() && !floodSub.started) {
        return nextTick(callback, errCode(new Error(messages.NOT_STARTED_YET), codes.PUBSUB_NOT_STARTED))
      }

      function subscribe (cb) {
        if (floodSub.listenerCount(topic) === 0) {
          floodSub.subscribe(topic)
        }

        floodSub.on(topic, handler)
        nextTick(cb)
      }

      subscribe(callback)
    }),

    unsubscribe: promisify((topic, handler, callback) => {
      if (!node.isStarted() && !floodSub.started) {
        return nextTick(callback, errCode(new Error(messages.NOT_STARTED_YET), codes.PUBSUB_NOT_STARTED))
      }
      if (!callback) {
        // we will always be passed a callback because of promisify. If we weren't passed one
        // really it means no handler was passed..
        callback = handler
        handler = null
      }
      if (!handler) {
        floodSub.removeAllListeners(topic)
      } else {
        floodSub.removeListener(topic, handler)
      }

      if (floodSub.listenerCount(topic) === 0) {
        floodSub.unsubscribe(topic)
      }

      if (typeof callback === 'function') {
        nextTick(() => callback())
      }
    }),

    publish: promisify((topic, data, callback) => {
      if (!node.isStarted() && !floodSub.started) {
        return nextTick(callback, errCode(new Error(messages.NOT_STARTED_YET), codes.PUBSUB_NOT_STARTED))
      }

      if (!Buffer.isBuffer(data)) {
        return nextTick(callback, errCode(new Error('data must be a Buffer'), 'ERR_DATA_IS_NOT_A_BUFFER'))
      }

      floodSub.publish(topic, data, callback)
    }),

    ls: promisify((callback) => {
      if (!node.isStarted() && !floodSub.started) {
        return nextTick(callback, errCode(new Error(messages.NOT_STARTED_YET), codes.PUBSUB_NOT_STARTED))
      }

      const subscriptions = Array.from(floodSub.subscriptions)

      nextTick(() => callback(null, subscriptions))
    }),

    peers: promisify((topic, callback) => {
      if (!node.isStarted() && !floodSub.started) {
        return nextTick(callback, errCode(new Error(messages.NOT_STARTED_YET), codes.PUBSUB_NOT_STARTED))
      }

      if (typeof topic === 'function') {
        callback = topic
        topic = null
      }

      const peers = Array.from(floodSub.peers.values())
        .filter((peer) => topic ? peer.topics.has(topic) : true)
        .map((peer) => peer.info.id.toB58String())

      nextTick(() => callback(null, peers))
    }),

    setMaxListeners (n) {
      return floodSub.setMaxListeners(n)
    }
  }
}
