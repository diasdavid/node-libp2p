import { isIPv4, isIPv6 } from '@chainsafe/is-ip'
import { Netmask } from 'netmask'

const PRIVATE_IP_RANGES = [
  '0.0.0.0/8',
  '10.0.0.0/8',
  '100.64.0.0/10',
  '127.0.0.0/8',
  '169.254.0.0/16',
  '172.16.0.0/12',
  '192.0.0.0/24',
  '192.0.0.0/29',
  '192.0.0.8/32',
  '192.0.0.9/32',
  '192.0.0.10/32',
  '192.0.0.170/32',
  '192.0.0.171/32',
  '192.0.2.0/24',
  '192.31.196.0/24',
  '192.52.193.0/24',
  '192.88.99.0/24',
  '192.168.0.0/16',
  '192.175.48.0/24',
  '198.18.0.0/15',
  '198.51.100.0/24',
  '203.0.113.0/24',
  '240.0.0.0/4',
  '255.255.255.255/32'
]

const NETMASK_RANGES = PRIVATE_IP_RANGES.map(ipRange => new Netmask(ipRange))

function ipv4Check (ipAddr: string): boolean {
  for (const r of NETMASK_RANGES) {
    if (r.contains(ipAddr)) return true
  }

  return false
}

function ipv6Check (ipAddr: string): boolean {
  return /^::$/.test(ipAddr) ||
    /^::1$/.test(ipAddr) ||
    /^::f{4}:(0?a[0-9a-fA-F]{2}):([0-9a-fA-F]{1,4})$/.test(ipAddr) || // 10.0.0.0/8
    /^::f{4}:(7f[0-9a-fA-F]{2}):([0-9a-fA-F]{1,4})$/.test(ipAddr) || // 127.0.0.0/8
    /^::f{4}:(a9fe):([0-9a-fA-F]{1,4})$/.test(ipAddr) || // 169.254.0.0/16
    /^::f{4}:(ac1[0-9a-fA-F]{1}|ac2[0-9a-fA-F]{1}|ac3[0-1a-fA-F]{1}):([0-9a-fA-F]{1,4})$/.test(ipAddr) || // 172.16.0.0/12
    /^::f{4}:(c0a8):([0-9a-fA-F]{1,4})$/.test(ipAddr) || // 192.168.0.0/16
    /^::f{4}:([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/.test(ipAddr) ||
    /^::f{4}:0.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/.test(ipAddr) ||
    /^64:ff9b::([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/.test(ipAddr) ||
    /^100::([0-9a-fA-F]{0,4}):?([0-9a-fA-F]{0,4}):?([0-9a-fA-F]{0,4}):?([0-9a-fA-F]{0,4})$/.test(ipAddr) ||
    /^2001::([0-9a-fA-F]{0,4}):?([0-9a-fA-F]{0,4}):?([0-9a-fA-F]{0,4}):?([0-9a-fA-F]{0,4}):?([0-9a-fA-F]{0,4}):?([0-9a-fA-F]{0,4})$/.test(ipAddr) ||
    /^2001:2[0-9a-fA-F]:([0-9a-fA-F]{0,4}):?([0-9a-fA-F]{0,4}):?([0-9a-fA-F]{0,4}):?([0-9a-fA-F]{0,4}):?([0-9a-fA-F]{0,4}):?([0-9a-fA-F]{0,4})$/.test(ipAddr) ||
    /^2001:db8:([0-9a-fA-F]{0,4}):?([0-9a-fA-F]{0,4}):?([0-9a-fA-F]{0,4}):?([0-9a-fA-F]{0,4}):?([0-9a-fA-F]{0,4}):?([0-9a-fA-F]{0,4})$/.test(ipAddr) ||
    /^2002:([0-9a-fA-F]{0,4}):?([0-9a-fA-F]{0,4}):?([0-9a-fA-F]{0,4}):?([0-9a-fA-F]{0,4}):?([0-9a-fA-F]{0,4}):?([0-9a-fA-F]{0,4}):?([0-9a-fA-F]{0,4})$/.test(ipAddr) ||
    /^f[c-d]([0-9a-fA-F]{2,2}):/i.test(ipAddr) ||
    /^fe[8-9a-bA-B][0-9a-fA-F]:/i.test(ipAddr) ||
    /^ff([0-9a-fA-F]{2,2}):/i.test(ipAddr)
}

export function isPrivateIp (ip: string): boolean | undefined {
  if (isIPv4(ip)) return ipv4Check(ip)
  else if (isIPv6(ip)) return ipv6Check(ip)
  else return undefined
}
