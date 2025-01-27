/* eslint-disable import/export */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unnecessary-boolean-literal-compare */
/* eslint-disable @typescript-eslint/no-empty-interface */

import { type Codec, decodeMessage, type DecodeOptions, encodeMessage, enumeration, message } from 'protons-runtime'
import type { Uint8ArrayList } from 'uint8arraylist'

export interface Message {
  flag?: Message.Flag
  message?: Uint8Array
}

export namespace Message {
  export enum Flag {
    FIN = 'FIN',
    STOP_SENDING = 'STOP_SENDING',
    RESET = 'RESET',
    FIN_ACK = 'FIN_ACK'
  }

  enum __FlagValues {
    FIN = 0,
    STOP_SENDING = 1,
    RESET = 2,
    FIN_ACK = 3
  }

  export namespace Flag {
    export const codec = (): Codec<Flag> => {
      return enumeration<Flag>(__FlagValues)
    }
  }

  let _codec: Codec<Message>

  export const codec = (): Codec<Message> => {
    if (_codec == null) {
      _codec = message<Message>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if (obj.flag != null) {
          w.uint32(8)
          Message.Flag.codec().encode(obj.flag, w)
        }

        if (obj.message != null) {
          w.uint32(18)
          w.bytes(obj.message)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {}

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.flag = Message.Flag.codec().decode(reader)
              break
            }
            case 2: {
              obj.message = reader.bytes()
              break
            }
            default: {
              reader.skipType(tag & 7)
              break
            }
          }
        }

        return obj
      })
    }

    return _codec
  }

  export const encode = (obj: Partial<Message>): Uint8Array => {
    return encodeMessage(obj, Message.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<Message>): Message => {
    return decodeMessage(buf, Message.codec(), opts)
  }
}
