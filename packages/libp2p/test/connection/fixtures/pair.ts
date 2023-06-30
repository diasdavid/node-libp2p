import map from 'it-map'
import defer from 'p-defer'
import { Uint8ArrayList } from 'uint8arraylist'
import type { Source, Duplex } from 'it-stream-types'

/**
 * A pair of streams where one drains from the other
 */
export function pair (): Duplex<AsyncGenerator<Uint8ArrayList>, Source<Uint8ArrayList | Uint8Array>, Promise<void>> {
  const deferred = defer<Source<Uint8ArrayList | Uint8Array>>()
  let piped = false

  return {
    sink: async source => {
      if (piped) {
        throw new Error('already piped')
      }

      piped = true
      deferred.resolve(source)
    },
    source: (async function * () {
      const source = await deferred.promise

      yield * map(source, (buf) => buf instanceof Uint8Array ? new Uint8ArrayList(buf) : buf)
    }())
  }
}
