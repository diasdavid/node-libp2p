/* eslint-disable @typescript-eslint/consistent-type-assertions */

import { defaultLogger } from '@libp2p/logger'
import { expect } from 'aegir/chai'
import delay from 'delay'
import length from 'it-length'
import * as lengthPrefixed from 'it-length-prefixed'
import { pushable } from 'it-pushable'
import { bytes } from 'multiformats'
import pDefer from 'p-defer'
import { Uint8ArrayList } from 'uint8arraylist'
import { Message } from '../src/private-to-public/pb/message.js'
import { MAX_BUFFERED_AMOUNT, MAX_MESSAGE_SIZE, PROTOBUF_OVERHEAD, type WebRTCStream, createStream } from '../src/stream.js'
import { RTCPeerConnection } from '../src/webrtc/index.js'
import { mockDataChannel, receiveFinAck } from './util.js'
import type { Stream } from '@libp2p/interface'

describe('Max message size', () => {
  it(`sends messages smaller or equal to ${MAX_MESSAGE_SIZE} bytes in one`, async () => {
    const sent: Uint8ArrayList = new Uint8ArrayList()
    const data = new Uint8Array(MAX_MESSAGE_SIZE - PROTOBUF_OVERHEAD)
    const p = pushable<Uint8Array>()
    const channel = mockDataChannel({
      send: (bytes) => {
        sent.append(bytes)
      }
    })

    // Make sure that a message with all fields will be exactly MAX_MESSAGE_SIZE
    const messageLengthEncoded = lengthPrefixed.encode.single(Message.encode({
      flag: Message.Flag.STOP_SENDING,
      message: data
    }))

    expect(messageLengthEncoded.length).eq(MAX_MESSAGE_SIZE)
    const webrtcStream = createStream({
      channel,
      direction: 'outbound',
      closeTimeout: 1,
      logger: defaultLogger()
    })

    p.push(data)
    p.end()
    receiveFinAck(channel)
    await webrtcStream.sink(p)

    expect(length(sent)).to.be.gt(1)

    for (const buf of sent) {
      expect(buf.byteLength).to.be.lessThanOrEqual(MAX_MESSAGE_SIZE)
    }
  })

  it(`sends messages greater than ${MAX_MESSAGE_SIZE} bytes in parts`, async () => {
    const sent: Uint8ArrayList = new Uint8ArrayList()
    const data = new Uint8Array(MAX_MESSAGE_SIZE)
    const p = pushable<Uint8Array>()
    const channel = mockDataChannel({
      send: (bytes) => {
        sent.append(bytes)
      }
    })

    // Make sure that the data that ought to be sent will result in a message with exactly MAX_MESSAGE_SIZE + 1
    // const messageLengthEncoded = lengthPrefixed.encode.single(Message.encode({ message: data })).subarray()
    // expect(messageLengthEncoded.length).eq(MAX_MESSAGE_SIZE + 1)

    const webrtcStream = createStream({
      channel,
      direction: 'outbound',
      logger: defaultLogger()
    })

    p.push(data)
    p.end()
    receiveFinAck(channel)
    await webrtcStream.sink(p)

    expect(length(sent)).to.be.gt(1)

    for (const buf of sent) {
      expect(buf.byteLength).to.be.lessThanOrEqual(MAX_MESSAGE_SIZE)
    }
  })

  it('closes the stream if bufferamountlow timeout', async () => {
    const timeout = 100
    const closed = pDefer()
    const channel = mockDataChannel({
      send: () => {
        throw new Error('Expected to not send')
      },
      bufferedAmount: MAX_BUFFERED_AMOUNT + 1
    })
    const webrtcStream = createStream({
      bufferedAmountLowEventTimeout: timeout,
      closeTimeout: 1,
      channel,
      direction: 'outbound',
      onEnd: () => {
        closed.resolve()
      },
      logger: defaultLogger()
    })

    const t0 = Date.now()

    await expect(webrtcStream.sink([new Uint8Array(1)])).to.eventually.be.rejected
      .with.property('name', 'TimeoutError')
    const t1 = Date.now()
    expect(t1 - t0).greaterThanOrEqual(timeout)
    expect(t1 - t0).lessThan(timeout + 1000) // Some upper bound
    await closed.promise
    expect(webrtcStream.timeline.close).to.be.greaterThan(webrtcStream.timeline.open)
    expect(webrtcStream.timeline.abort).to.be.greaterThan(webrtcStream.timeline.open)
  })
})

const TEST_MESSAGE = 'test_message'

function setup (): { peerConnection: RTCPeerConnection, dataChannel: RTCDataChannel, stream: WebRTCStream } {
  const peerConnection = new RTCPeerConnection()
  const dataChannel = peerConnection.createDataChannel('whatever', { negotiated: true, id: 91 })
  const stream = createStream({ channel: dataChannel, direction: 'outbound', closeTimeout: 1, logger: defaultLogger() })

  return { peerConnection, dataChannel, stream }
}

function generatePbByFlag (flag?: Message.Flag): Uint8Array {
  const buf = Message.encode({
    flag,
    message: bytes.fromString(TEST_MESSAGE)
  })

  return lengthPrefixed.encode.single(buf).subarray()
}

describe('Stream Stats', () => {
  let stream: WebRTCStream
  let peerConnection: RTCPeerConnection
  let dataChannel: RTCDataChannel

  beforeEach(async () => {
    ({ stream, peerConnection, dataChannel } = setup())
  })

  afterEach(() => {
    if (peerConnection != null) {
      peerConnection.close()
    }
  })

  it('can construct', () => {
    expect(stream.timeline.close).to.not.exist()
  })

  it('close marks it closed', async () => {
    expect(stream.timeline.close).to.not.exist()

    receiveFinAck(dataChannel)
    await stream.close()

    expect(stream.timeline.close).to.be.a('number')
  })

  it('closeRead marks it read-closed only', async () => {
    expect(stream.timeline.close).to.not.exist()
    await stream.closeRead()
    expect(stream.timeline.close).to.not.exist()
    expect(stream.timeline.closeRead).to.be.greaterThanOrEqual(stream.timeline.open)
  })

  it('closeWrite marks it write-closed only', async () => {
    expect(stream.timeline.close).to.not.exist()

    receiveFinAck(dataChannel)
    await stream.closeWrite()

    expect(stream.timeline.close).to.not.exist()
    expect(stream.timeline.closeWrite).to.be.greaterThanOrEqual(stream.timeline.open)
  })

  it('closeWrite AND closeRead = close', async () => {
    expect(stream.timeline.close).to.not.exist()

    receiveFinAck(dataChannel)
    await Promise.all([
      stream.closeRead(),
      stream.closeWrite()
    ])

    expect(stream.timeline.close).to.be.a('number')
    expect(stream.timeline.closeWrite).to.be.greaterThanOrEqual(stream.timeline.open)
    expect(stream.timeline.closeRead).to.be.greaterThanOrEqual(stream.timeline.open)
  })

  it('abort = close', () => {
    expect(stream.timeline.close).to.not.exist()
    stream.abort(new Error('Oh no!'))
    expect(stream.timeline.close).to.be.a('number')
    expect(stream.timeline.close).to.be.greaterThanOrEqual(stream.timeline.open)
    expect(stream.timeline.closeWrite).to.be.greaterThanOrEqual(stream.timeline.open)
    expect(stream.timeline.closeRead).to.be.greaterThanOrEqual(stream.timeline.open)
  })

  it('reset = close', () => {
    expect(stream.timeline.close).to.not.exist()
    stream.reset() // only resets the write side
    expect(stream.timeline.close).to.be.a('number')
    expect(stream.timeline.close).to.be.greaterThanOrEqual(stream.timeline.open)
    expect(stream.timeline.closeWrite).to.be.greaterThanOrEqual(stream.timeline.open)
    expect(stream.timeline.closeRead).to.be.greaterThanOrEqual(stream.timeline.open)
  })
})

describe('Stream Read Stats Transition By Incoming Flag', () => {
  let dataChannel: RTCDataChannel
  let stream: Stream
  let peerConnection: RTCPeerConnection

  beforeEach(async () => {
    ({ dataChannel, stream, peerConnection } = setup())
  })

  afterEach(() => {
    if (peerConnection != null) {
      peerConnection.close()
    }
  })

  it('no flag, no transition', () => {
    expect(stream.timeline.close).to.not.exist()
    const data = generatePbByFlag()
    dataChannel.onmessage?.(new MessageEvent('message', { data }))

    expect(stream.timeline.close).to.not.exist()
  })

  it('open to read-close by flag:FIN', async () => {
    const data = generatePbByFlag(Message.Flag.FIN)
    dataChannel.dispatchEvent(new MessageEvent('message', { data }))

    await delay(100)

    expect(stream.timeline.closeWrite).to.not.exist()
    expect(stream.timeline.closeRead).to.be.greaterThanOrEqual(stream.timeline.open)
  })

  it('read-close to close by flag:STOP_SENDING', async () => {
    const data = generatePbByFlag(Message.Flag.STOP_SENDING)
    dataChannel.dispatchEvent(new MessageEvent('message', { data }))

    await delay(100)

    expect(stream.timeline.closeWrite).to.be.greaterThanOrEqual(stream.timeline.open)
    expect(stream.timeline.closeRead).to.not.exist()
  })
})

describe('Stream Write Stats Transition By Incoming Flag', () => {
  let dataChannel: RTCDataChannel
  let stream: Stream
  let peerConnection: RTCPeerConnection

  beforeEach(async () => {
    ({ dataChannel, stream, peerConnection } = setup())
  })

  afterEach(() => {
    if (peerConnection != null) {
      peerConnection.close()
    }
  })

  it('open to write-close by flag:STOP_SENDING', async () => {
    const data = generatePbByFlag(Message.Flag.STOP_SENDING)
    dataChannel.dispatchEvent(new MessageEvent('message', { data }))

    await delay(100)

    expect(stream.timeline.closeWrite).to.be.greaterThanOrEqual(stream.timeline.open)
    expect(stream.timeline.closeRead).to.not.exist()
  })

  it('write-close to close by flag:FIN', async () => {
    const data = generatePbByFlag(Message.Flag.FIN)
    dataChannel.dispatchEvent(new MessageEvent('message', { data }))

    await delay(100)

    expect(stream.timeline.closeWrite).to.not.exist()
    expect(stream.timeline.closeRead).to.be.greaterThanOrEqual(stream.timeline.open)
  })
})
