import { FaultTolerance } from '@libp2p/interface'
import { defaultAddressSort } from '@libp2p/utils/address-sort'
import { dnsaddrResolver } from '@multiformats/multiaddr/resolvers'
import mergeOptions from 'merge-options'
import { object } from 'yup'
import { validateAddressManagerConfig } from '../address-manager/utils.js'
import { validateConnectionManagerConfig } from '../connection-manager/utils.js'
import type { ConnectionManagerInit } from '../connection-manager/index.js'
import type { Libp2pInit } from '../index.js'
import type { ServiceMap, RecursivePartial } from '@libp2p/interface'

const defaultConfig: Partial<Libp2pInit> = {
  connectionManager: {
    resolvers: {
      dnsaddr: dnsaddrResolver
    },
    addressSorter: defaultAddressSort
  },
  transportManager: {
    faultTolerance: FaultTolerance.FATAL_ALL
  }
}

export function validateConfig<T extends ServiceMap = Record<string, unknown>> (opts: RecursivePartial<Libp2pInit<T>>): Libp2pInit<T> {
  const libp2pConfig = object({
    addresses: validateAddressManagerConfig(),
    connectionManager: validateConnectionManagerConfig(opts?.connectionManager as ConnectionManagerInit)
  })

  const parsedOpts = libp2pConfig.validateSync(opts)

  const resultingOptions: Libp2pInit<T> = mergeOptions(defaultConfig, parsedOpts)

  return resultingOptions
}
