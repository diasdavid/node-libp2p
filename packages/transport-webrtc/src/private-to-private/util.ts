import { CodeError } from '@libp2p/interface/errors'
import { logger } from '@libp2p/logger'
import { abortableSource } from 'abortable-iterator'
import { anySignal } from 'any-signal'
import * as lp from 'it-length-prefixed'
import { AbortError, raceSignal } from 'race-signal'
import { isFirefox } from '../util.js'
import { RTCIceCandidate } from '../webrtc/index.js'
import { Message } from './pb/message.js'
import type { Stream } from '@libp2p/interface/connection'
import type { AbortOptions, MessageStream } from 'it-protobuf-stream'
import type { DeferredPromise } from 'p-defer'

const log = logger('libp2p:webrtc:peer:util')

export interface ReadCandidatesOptions extends AbortOptions {
  direction: string
}

export const readCandidatesUntilConnected = async (connectedPromise: DeferredPromise<void>, pc: RTCPeerConnection, stream: MessageStream<Message, Stream>, options: ReadCandidatesOptions): Promise<void> => {
  // if we connect, stop trying to read from the stream
  const controller = new AbortController()
  connectedPromise.promise.then(() => {
    controller.abort()
  }, () => {
    controller.abort()
  })

  const signal = anySignal([
    controller.signal,
    options.signal
  ])

  const source = abortableSource(stream.unwrap().unwrap().source, signal, {
    returnOnAbort: true
  })

  try {
    // read candidates until we are connected or we reach the end of the stream
    for await (const buf of lp.decode(source)) {
      const message = Message.decode(buf)

      if (message.type !== Message.Type.ICE_CANDIDATE) {
        throw new CodeError('ICE candidate message expected', 'ERR_NOT_ICE_CANDIDATE')
      }

      // a null candidate means end-of-candidates
      // see - https://www.w3.org/TR/webrtc/#rtcpeerconnectioniceevent
      const candidate = new RTCIceCandidate(JSON.parse(message.data ?? 'null'))

      log.trace('%s received new ICE candidate', options.direction, candidate)

      try {
        await pc.addIceCandidate(candidate)
      } catch (err) {
        log.error('%s bad candidate received', options.direction, err)
        throw new CodeError('bad candidate received', 'ERR_BAD_ICE_CANDIDATE')
      }
    }
  } catch (err) {
    log.error('%s error parsing ICE candidate', options.direction, err)
  } finally {
    signal.clear()
  }

  if (options.signal?.aborted === true) {
    throw new AbortError('Aborted while reading ICE candidates', 'ERR_ICE_CANDIDATES_READ_ABORTED')
  }

  // read all available ICE candidates, wait for connection state change
  await raceSignal(connectedPromise.promise, options.signal, {
    errorMessage: 'Aborted before connected',
    errorCode: 'ERR_ABORTED_BEFORE_CONNECTED'
  })
}

export function resolveOnConnected (pc: RTCPeerConnection, promise: DeferredPromise<void>): void {
  pc[isFirefox ? 'oniceconnectionstatechange' : 'onconnectionstatechange'] = (_) => {
    log.trace('receiver peerConnectionState state change: %s', pc.connectionState)
    switch (isFirefox ? pc.iceConnectionState : pc.connectionState) {
      case 'connected':
        promise.resolve()
        break
      case 'failed':
      case 'disconnected':
      case 'closed':
        promise.reject(new CodeError('RTCPeerConnection was closed', 'ERR_CONNECTION_CLOSED_BEFORE_CONNECTED'))
        break
      default:
        break
    }
  }
}

export function parseRemoteAddress (sdp: string): string {
  // 'a=candidate:1746876089 1 udp 2113937151 0614fbad-b...ocal 54882 typ host generation 0 network-cost 999'
  const candidateLine = sdp.split('\r\n').filter(line => line.startsWith('a=candidate')).pop()
  const candidateParts = candidateLine?.split(' ')

  if (candidateLine == null || candidateParts == null || candidateParts.length < 5) {
    log('could not parse remote address from', candidateLine)
    return '/webrtc'
  }

  return `/dnsaddr/${candidateParts[4]}/${candidateParts[2].toLowerCase()}/${candidateParts[5]}/webrtc`
}
