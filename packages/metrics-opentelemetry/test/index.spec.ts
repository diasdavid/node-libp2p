import { expect } from 'aegir/chai'
import { isPromise, isGenerator, isAsyncGenerator, openTelemetryMetrics } from '../src/index.js'

describe('opentelemetry-metrics', () => {
  it('should wrap a method', async () => {
    const metrics = openTelemetryMetrics()({
      nodeInfo: {
        name: 'test',
        version: '1.0.0'
      }
    })

    const target = {
      wrapped: function () {

      }
    }

    const wrapped = metrics.traceFunction('target.wrapped', target.wrapped, {
      optionsIndex: 0
    })

    expect(wrapped).to.not.equal(target.wrapped)
  })
})

describe('isPromise', () => {
  it('should return true if the value is a promise', () => {
    expect(isPromise(Promise.resolve())).to.be.true()
    expect(isPromise(new Promise(() => {}))).to.be.true()
    expect(isPromise(Promise.reject(new Error('test')))).to.be.true()
  })

  it('should return false if the value is not a promise', () => {
    expect(isPromise(1)).to.be.false()
    expect(isPromise('string')).to.be.false()
    expect(isPromise({})).to.be.false()
    expect(isPromise([])).to.be.false()
    expect(isPromise(null)).to.be.false()
    expect(isPromise(undefined)).to.be.false()
    expect(isPromise(() => {})).to.be.false()
    expect(isPromise(async () => {})).to.be.false()
    expect(
      isPromise(function * () {
        yield 1
      })
    ).to.be.false()
    expect(
      isPromise(async function * () {
        yield 1
      })
    ).to.be.false()
    // biome-ignore lint/suspicious/noThenProperty: for testing purposes
    expect(isPromise({ then: 1 })).to.be.false()
  })
})

describe('isGenerator', () => {
  it('should return true if the value is a generator', () => {
    function * gen (): Generator<number> {
      yield 1
    }
    const generator = gen()
    expect(isGenerator(generator)).to.be.true()

    const genObj = (function * () {
      yield 1
    })()
    expect(isGenerator(genObj)).to.be.true()
  })

  it('should return false if the value is not a generator', () => {
    expect(isGenerator(1)).to.be.false()
    expect(isGenerator('string')).to.be.false()
    expect(isGenerator({})).to.be.false()
    expect(isGenerator([])).to.be.false()
    expect(isGenerator(null)).to.be.false()
    expect(isGenerator(undefined)).to.be.false()
    expect(isGenerator(() => {})).to.be.false()
    expect(isGenerator(async () => {})).to.be.false()
    expect(
      isGenerator(function * () {
        yield 1
      })
    ).to.be.false() // generator function, not generator
    expect(
      isGenerator(async function * () {
        yield 1
      })
    ).to.be.false()
    expect(isGenerator(Promise.resolve())).to.be.false()
    expect(isGenerator({ next: () => {} })).to.be.false()
    expect(isGenerator({ [Symbol.iterator]: () => {} })).to.be.false()
  })
})

describe('isAsyncGenerator', () => {
  it('should return true if the value is an async generator', () => {
    async function * asyncGen (): AsyncGenerator<number> {
      yield 1
    }
    const asyncGenerator = asyncGen()
    expect(isAsyncGenerator(asyncGenerator)).to.be.true()

    const asyncGenObj = (async function * () {
      yield 1
    })()
    expect(isAsyncGenerator(asyncGenObj)).to.be.true()
  })

  it('should return false if the value is not an async generator', () => {
    expect(isAsyncGenerator(1)).to.be.false()
    expect(isAsyncGenerator('string')).to.be.false()
    expect(isAsyncGenerator({})).to.be.false()
    expect(isAsyncGenerator([])).to.be.false()
    expect(isAsyncGenerator(null)).to.be.false()
    expect(isAsyncGenerator(undefined)).to.be.false()
    expect(isAsyncGenerator(() => {})).to.be.false()
    expect(isAsyncGenerator(async () => {})).to.be.false()
    expect(
      isAsyncGenerator(function * () {
        yield 1
      })
    ).to.be.false()
    expect(
      isAsyncGenerator(async function * () {
        yield 1
      })
    ).to.be.false() // async generator function, not generator
    expect(isAsyncGenerator(Promise.resolve())).to.be.false()
    expect(isAsyncGenerator({ next: async () => {} })).to.be.false()
    expect(isAsyncGenerator({ [Symbol.asyncIterator]: () => {} })).to.be.false()
  })
})
