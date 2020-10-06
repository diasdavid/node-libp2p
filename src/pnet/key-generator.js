'use strict'

const crypto = require('libp2p-crypto')
const KEY_LENGTH = 32
const uint8ArrayToString = require('uint8arrays/to-string')
const uint8ArrayFromString = require('uint8arrays/from-string')

/**
 * Generates a PSK that can be used in a libp2p-pnet private network
 *
 * @param {Uint8Array} bytes - An object to write the psk into
 * @returns {void}
 */
function generate (bytes) {
  const psk = uint8ArrayToString(crypto.randomBytes(KEY_LENGTH), 'base16')
  const key = uint8ArrayFromString('/key/swarm/psk/1.0.0/\n/base16/\n' + psk)

  bytes.set(key)
}

module.exports = generate
module.exports.NONCE_LENGTH = 24
module.exports.KEY_LENGTH = KEY_LENGTH

if (require.main === module) {
  generate(process.stdout)
}
