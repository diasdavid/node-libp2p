import { StreamStateError, TimeoutError } from '@libp2p/interface'
import { AbstractStream, type AbstractStreamInit } from '@libp2p/utils/abstract-stream'
import { anySignal } from 'any-signal'
import * as lengthPrefixed from 'it-length-prefixed'
import { type Pushable, pushable } from 'it-pushable'
import pDefer from 'p-defer'
import pTimeout from 'p-timeout'
import { raceEvent } from 'race-event'
import { raceSignal } from 'race-signal'
import { encodingLength } from 'uint8-varint'
import { Uint8ArrayList } from 'uint8arraylist'
import { Message } from './private-to-public/pb/message.js'
import type { DataChannelOptions } from './index.js'
import type { AbortOptions, ComponentLogger, Direction } from '@libp2p/interface'
import type { DeferredPromise } from 'p-defer'

export interface WebRTCStreamInit extends AbstractStreamInit, DataChannelOptions {
  /**
   * The network channel used for bidirectional peer-to-peer transfers of
   * arbitrary data
   *
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel}
   */
  channel: RTCDataChannel

  logger: ComponentLogger
}

/**
 * How much can be buffered to the DataChannel at once
 */
export const MAX_BUFFERED_AMOUNT = 2 * 1024 * 1024

/**
 * How long time we wait for the 'bufferedamountlow' event to be emitted
 */
export const BUFFERED_AMOUNT_LOW_TIMEOUT = 30 * 1000

/**
 * Max message size that can be sent to the DataChannel. In browsers this is
 * 256KiB but go-libp2p and rust-libp2p only support 16KiB at the time of
 * writing.
 *
 * @see https://blog.mozilla.org/webrtc/large-data-channel-messages/
 * @see https://issues.webrtc.org/issues/40644524
 */
export const MAX_MESSAGE_SIZE = 16 * 1024

/**
 * max protobuf overhead:
 *
 * ```
 * [message-length][flag-field-id+type][flag-field-length][flag-field][message-field-id+type][message-field-length][message-field]
 * ```
 */
function calculateProtobufOverhead (maxMessageSize = MAX_MESSAGE_SIZE): number {
  // these have a fixed size
  const messageLength = encodingLength(maxMessageSize - encodingLength(maxMessageSize))
  const flagField = 1 + encodingLength(Object.keys(Message.Flag).length - 1) // id+type/value
  const messageFieldIdType = 1 // id+type
  const available = maxMessageSize - messageLength - flagField - messageFieldIdType

  // let message-length/message-data fill the rest of the message
  const messageFieldLengthLength = encodingLength(available)

  return messageLength + flagField + messageFieldIdType + messageFieldLengthLength
}

/**
 * The protobuf message overhead includes the maximum amount of all bytes in the
 * protobuf that aren't message field bytes
 */
export const PROTOBUF_OVERHEAD = calculateProtobufOverhead()

/**
 * When closing streams we send a FIN then wait for the remote to
 * reply with a FIN_ACK. If that does not happen within this timeout
 * we close the stream anyway.
 */
export const FIN_ACK_TIMEOUT = 5000

/**
 * When sending data messages, if the channel is not in the "open" state, wait
 * this long for the "open" event to fire.
 */
export const OPEN_TIMEOUT = 5000

export class WebRTCStream extends AbstractStream {
  /**
   * The data channel used to send and receive data
   */
  private readonly channel: RTCDataChannel

  /**
   * push data from the underlying datachannel to the length prefix decoder
   * and then the protobuf decoder.
   */
  private readonly incomingData: Pushable<Uint8Array>

  private readonly maxBufferedAmount: number

  private readonly bufferedAmountLowEventTimeout: number

  /**
   * The maximum size of a message in bytes
   */
  private readonly maxMessageSize: number

  /**
   * When this promise is resolved, the remote has sent us a FIN flag
   */
  private readonly receiveFinAck: DeferredPromise<void>
  private readonly finAckTimeout: number
  private readonly openTimeout: number
  private readonly closeController: AbortController

  constructor (init: WebRTCStreamInit) {
    // override onEnd to send/receive FIN_ACK before closing the stream
    const originalOnEnd = init.onEnd
    init.onEnd = (err?: Error): void => {
      this.log.trace('readable and writeable ends closed', this.status)

      void Promise.resolve(async () => {
        if (this.timeline.abort != null || this.timeline.reset !== null) {
          return
        }

        // wait for FIN_ACK if we haven't received it already
        try {
          await pTimeout(this.receiveFinAck.promise, {
            milliseconds: this.finAckTimeout
          })
        } catch (err) {
          this.log.error('error receiving FIN_ACK', err)
        }
      })
        .then(() => {
        // stop processing incoming messages
          this.incomingData.end()

          // final cleanup
          originalOnEnd?.(err)
        })
        .catch(err => {
          this.log.error('error ending stream', err)
        })
    }

    super(init)

    this.channel = init.channel
    this.channel.binaryType = 'arraybuffer'
    this.incomingData = pushable<Uint8Array>()
    this.bufferedAmountLowEventTimeout = init.bufferedAmountLowEventTimeout ?? BUFFERED_AMOUNT_LOW_TIMEOUT
    this.maxBufferedAmount = init.maxBufferedAmount ?? MAX_BUFFERED_AMOUNT
    this.maxMessageSize = (init.maxMessageSize ?? MAX_MESSAGE_SIZE) - PROTOBUF_OVERHEAD
    this.receiveFinAck = pDefer()
    this.finAckTimeout = init.closeTimeout ?? FIN_ACK_TIMEOUT
    this.openTimeout = init.openTimeout ?? OPEN_TIMEOUT
    this.closeController = new AbortController()

    // set up initial state
    switch (this.channel.readyState) {
      case 'open':
        this.timeline.open = new Date().getTime()
        break

      case 'closed':
      case 'closing':
        if (this.timeline.close === undefined || this.timeline.close === 0) {
          this.timeline.close = Date.now()
        }
        break
      case 'connecting':
        // noop
        break

      default:
        this.log.error('unknown datachannel state %s', this.channel.readyState)
        throw new StreamStateError('Unknown datachannel state')
    }

    // handle RTCDataChannel events
    this.channel.onopen = (_evt) => {
      this.timeline.open = new Date().getTime()
    }

    this.channel.onclose = (_evt) => {
      this.log.trace('received onclose event')

      // stop any in-progress writes
      this.closeController.abort()

      // if the channel has closed we'll never receive a FIN_ACK so resolve the
      // promise so we don't try to wait later
      this.receiveFinAck.resolve()

      void this.close().catch(err => {
        this.log.error('error closing stream after channel closed', err)
      })
    }

    this.channel.onerror = (evt) => {
      this.log.trace('received onerror event')

      // stop any in-progress writes
      this.closeController.abort()

      const err = (evt as RTCErrorEvent).error
      this.abort(err)
    }

    this.channel.onmessage = async (event: MessageEvent<ArrayBuffer>) => {
      const { data } = event

      if (data === null || data.byteLength === 0) {
        return
      }

      this.incomingData.push(new Uint8Array(data, 0, data.byteLength))
    }

    const self = this

    // pipe framed protobuf messages through a length prefixed decoder, and
    // surface data from the `Message.message` field through a source.
    Promise.resolve().then(async () => {
      for await (const buf of lengthPrefixed.decode(this.incomingData)) {
        const message = self.processIncomingProtobuf(buf)

        if (message != null) {
          self.sourcePush(new Uint8ArrayList(message))
        }
      }
    })
      .catch(err => {
        this.log.error('error processing incoming data channel messages', err)
      })
  }

  sendNewStream (): void {
    // opening new streams is handled by WebRTC so this is a noop
  }

  async _sendMessage (data: Uint8ArrayList, checkBuffer: boolean = true): Promise<void> {
    if (this.channel.readyState === 'closed' || this.channel.readyState === 'closing') {
      throw new StreamStateError(`Invalid datachannel state - ${this.channel.readyState}`)
    }

    if (this.channel.readyState !== 'open') {
      const timeout = AbortSignal.timeout(this.openTimeout)
      const signal = anySignal([
        this.closeController.signal,
        timeout
      ])

      try {
        this.log('channel state is "%s" and not "open", waiting for "open" event before sending data', this.channel.readyState)
        await raceEvent(this.channel, 'open', signal)
      } finally {
        signal.clear()
      }

      this.log('channel state is now "%s", sending data', this.channel.readyState)
    }

    if (checkBuffer && this.channel.bufferedAmount > this.maxBufferedAmount) {
      const timeout = AbortSignal.timeout(this.bufferedAmountLowEventTimeout)
      const signal = anySignal([
        this.closeController.signal,
        timeout
      ])

      try {
        this.log('channel buffer is %d, wait for "bufferedamountlow" event', this.channel.bufferedAmount)
        await raceEvent(this.channel, 'bufferedamountlow', signal)
      } catch (err: any) {
        if (timeout.aborted) {
          throw new TimeoutError(`Timed out waiting for DataChannel buffer to clear after ${this.bufferedAmountLowEventTimeout}ms`)
        }

        throw err
      } finally {
        signal.clear()
      }
    }

    try {
      // send message without copying data
      this.channel.send(data.subarray())
    } catch (err: any) {
      this.log.error('error while sending message', err)
    }
  }

  async sendData (data: Uint8ArrayList): Promise<void> {
    this.log.trace('-> will send %d bytes', data.byteLength)

    // sending messages is an async operation so use a copy of the list as it
    // may be changed beneath us
    data = data.sublist()

    while (data.byteLength > 0) {
      const toSend = Math.min(data.byteLength, this.maxMessageSize)
      const buf = data.subarray(0, toSend)
      const msgbuf = Message.encode({ message: buf })
      const sendbuf = lengthPrefixed.encode.single(msgbuf)
      this.log.trace('-> sending message %s', this.channel.readyState)
      await this._sendMessage(sendbuf)
      this.log.trace('-> sent message %s', this.channel.readyState)

      data.consume(toSend)
    }

    this.log.trace('-> sent data %s', this.channel.readyState)
  }

  async sendReset (): Promise<void> {
    try {
      await this._sendFlag(Message.Flag.RESET)
    } catch (err) {
      this.log.error('failed to send reset - %e', err)
    }
  }

  async sendCloseWrite (options: AbortOptions): Promise<void> {
    if (this.channel.readyState !== 'open') {
      this.receiveFinAck.resolve()
      return
    }

    const sent = await this._sendFlag(Message.Flag.FIN)

    if (sent) {
      this.log.trace('awaiting FIN_ACK')
      try {
        await raceSignal(this.receiveFinAck.promise, options?.signal, {
          errorMessage: 'sending close-write was aborted before FIN_ACK was received',
          errorName: 'FinAckNotReceivedError'
        })
      } catch (err) {
        this.log.error('failed to await FIN_ACK', err)
      }
    } else {
      this.log.trace('sending FIN failed, not awaiting FIN_ACK')
    }

    // if we've attempted to receive a FIN_ACK, do not try again
    this.receiveFinAck.resolve()
  }

  async sendCloseRead (): Promise<void> {
    if (this.channel.readyState !== 'open') {
      return
    }

    await this._sendFlag(Message.Flag.STOP_SENDING)
  }

  /**
   * Handle incoming
   */
  private processIncomingProtobuf (buffer: Uint8ArrayList): Uint8Array | undefined {
    const message = Message.decode(buffer)

    if (message.flag !== undefined) {
      this.log.trace('incoming flag %s, write status "%s", read status "%s"', message.flag, this.writeStatus, this.readStatus)

      if (message.flag === Message.Flag.FIN) {
        // We should expect no more data from the remote, stop reading
        this.remoteCloseWrite()

        this.log.trace('sending FIN_ACK')
        void this._sendFlag(Message.Flag.FIN_ACK)
          .catch(err => {
            this.log.error('error sending FIN_ACK immediately', err)
          })
      }

      if (message.flag === Message.Flag.RESET) {
        // Stop reading and writing to the stream immediately
        this.reset()
      }

      if (message.flag === Message.Flag.STOP_SENDING) {
        // The remote has stopped reading
        this.remoteCloseRead()
      }

      if (message.flag === Message.Flag.FIN_ACK) {
        this.log.trace('received FIN_ACK')
        this.receiveFinAck.resolve()
      }
    }

    // ignore data messages if we've closed the readable end already
    if (this.readStatus === 'ready') {
      return message.message
    }
  }

  private async _sendFlag (flag: Message.Flag): Promise<boolean> {
    if (this.channel.readyState !== 'open') {
      // flags can be sent while we or the remote are closing the datachannel so
      // if the channel isn't open, don't try to send it but return false to let
      // the caller know and act if they need to
      this.log.trace('not sending flag %s because channel is "%s" and not "open"', this.channel.readyState, flag.toString())
      return false
    }

    this.log.trace('sending flag %s', flag.toString())
    const msgbuf = Message.encode({ flag })
    const prefixedBuf = lengthPrefixed.encode.single(msgbuf)

    try {
      await this._sendMessage(prefixedBuf, false)

      return true
    } catch (err: any) {
      this.log.error('could not send flag %s - %e', flag.toString(), err)
    }

    return false
  }
}

export interface WebRTCStreamOptions extends DataChannelOptions {
  /**
   * The network channel used for bidirectional peer-to-peer transfers of
   * arbitrary data
   *
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel}
   */
  channel: RTCDataChannel

  /**
   * The stream direction
   */
  direction: Direction

  /**
   * A callback invoked when the channel ends
   */
  onEnd?(err?: Error | undefined): void

  logger: ComponentLogger
}

export function createStream (options: WebRTCStreamOptions): WebRTCStream {
  const { channel, direction } = options

  return new WebRTCStream({
    id: direction === 'inbound' ? (`i${channel.id}`) : `r${channel.id}`,
    log: options.logger.forComponent(`libp2p:webrtc:stream:${direction}:${channel.id}`),
    ...options
  })
}
