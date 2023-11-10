/* eslint-env mocha */

import suite from '@libp2p/interface-compliance-tests/connection-encryption'
import { defaultLogger } from '@libp2p/logger'
import { plaintext } from '../src/index.js'

describe('plaintext compliance', () => {
  suite({
    async setup () {
      return plaintext()({
        logger: defaultLogger()
      })
    },
    async teardown () {

    }
  })
})
