import { peerIdFromBytes } from '@libp2p/peer-id'
import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import { expect } from 'aegir/chai'
import { PeerList } from '../src/index.js'

describe('peer-list', () => {
  it('should return a list', async () => {
    const list = new PeerList()
    const peer = await createEd25519PeerId()

    list.push(peer)

    const peer2 = peerIdFromBytes(peer.toBytes())

    expect(list.indexOf(peer2)).to.equal(0)
  })

  it('should create a list with PeerList contents', async () => {
    const list1 = new PeerList()
    const peer = await createEd25519PeerId()

    list1.push(peer)

    const list2 = new PeerList(list1)

    expect(list2.indexOf(peer)).to.equal(0)
  })

  it('should create a list with Array contents', async () => {
    const peer = await createEd25519PeerId()
    const list = new PeerList([peer])

    expect(list.indexOf(peer)).to.equal(0)
  })
})
