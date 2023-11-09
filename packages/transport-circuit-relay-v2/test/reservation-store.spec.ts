/* eslint-env mocha */

import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import { multiaddr } from '@multiformats/multiaddr'
import { expect } from 'aegir/chai'
import { DEFAULT_DATA_LIMIT, DEFAULT_DURATION_LIMIT } from '../src/constants.js'
import { Status } from '../src/pb/index.js'
import { ReservationStore } from '../src/server/reservation-store.js'

describe('circuit-relay server reservation store', function () {
  it('should add reservation', async function () {
    const store = new ReservationStore({ maxReservations: 2 })
    const peer = await createEd25519PeerId()
    const result = store.reserve(peer, multiaddr())
    expect(result.status).to.equal(Status.OK)
    expect(result.expire).to.not.be.undefined()
    expect(store.hasReservation(peer)).to.be.true()
  })

  it('should add reservation if peer already has reservation', async function () {
    const store = new ReservationStore({ maxReservations: 1 })
    const peer = await createEd25519PeerId()
    store.reserve(peer, multiaddr())
    const result = store.reserve(peer, multiaddr())
    expect(result.status).to.equal(Status.OK)
    expect(result.expire).to.not.be.undefined()
    expect(store.hasReservation(peer)).to.be.true()
  })

  it('should fail to add reservation on exceeding limit', async function () {
    const store = new ReservationStore({ maxReservations: 0 })
    const peer = await createEd25519PeerId()
    const result = store.reserve(peer, multiaddr())
    expect(result.status).to.equal(Status.RESERVATION_REFUSED)
  })

  it('should remove reservation', async function () {
    const store = new ReservationStore({ maxReservations: 10 })
    const peer = await createEd25519PeerId()
    const result = store.reserve(peer, multiaddr())
    expect(result.status).to.equal(Status.OK)
    expect(store.hasReservation(peer)).to.be.true()
    store.removeReservation(peer)
    expect(store.hasReservation(peer)).to.be.false()
    store.removeReservation(peer)
  })

  it('should apply configured default connection limits', async function () {
    const defaultDataLimit = 10n
    const defaultDurationLimit = 10

    const store = new ReservationStore({
      defaultDataLimit,
      defaultDurationLimit
    })
    const peer = await createEd25519PeerId()
    store.reserve(peer, multiaddr())

    const reservation = store.get(peer)

    expect(reservation).to.have.nested.property('limit.data', defaultDataLimit)
    expect(reservation).to.have.nested.property('limit.duration', defaultDurationLimit)
  })

  it('should apply default connection limits', async function () {
    const store = new ReservationStore()
    const peer = await createEd25519PeerId()
    store.reserve(peer, multiaddr())

    const reservation = store.get(peer)

    expect(reservation).to.have.nested.property('limit.data', DEFAULT_DATA_LIMIT)
    expect(reservation).to.have.nested.property('limit.duration', DEFAULT_DURATION_LIMIT)
  })

  it('should not apply default connection limits when they have been disabled', async function () {
    const store = new ReservationStore({
      applyDefaultLimit: false
    })
    const peer = await createEd25519PeerId()
    store.reserve(peer, multiaddr())

    const reservation = store.get(peer)

    expect(reservation).to.not.have.nested.property('limit.data')
    expect(reservation).to.not.have.nested.property('limit.duration')
  })
})
