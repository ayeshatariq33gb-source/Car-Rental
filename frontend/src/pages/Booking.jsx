import { useEffect, useState } from 'react'
import { api } from '../api'

function Booking({ car, goTo, onSubmit }) {
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [method, setMethod] = useState('stripe')
  const [dates, setDates] = useState({ pickupDate: '', returnDate: '' })
  const [availability, setAvailability] = useState(null)

  useEffect(() => {
    if (!dates.pickupDate || !dates.returnDate || dates.returnDate <= dates.pickupDate) {
      setAvailability(null)
      return
    }
    if (!car) return
    api.checkAvailability(car._id || car.id, dates.pickupDate, dates.returnDate).then(setAvailability).catch(() => setAvailability(null))
  }, [car, dates.pickupDate, dates.returnDate])

  if (!car) return <section className="empty-state section"><h2>Select a car first</h2><button className="outline-button" onClick={() => goTo('cars')}>Browse cars</button></section>

  const submitPayment = async (event) => {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    const form = new FormData(event.currentTarget)
    try {
      const success = await onSubmit({
        pickupDate: form.get('pickupDate'),
        returnDate: form.get('returnDate'),
        pickupLocation: form.get('pickupLocation'),
        method: form.get('paymentMethod'),
      })
      if (success?.checkoutUrl) window.location.assign(success.checkoutUrl)
      else if (success?.booking) setSent(true)
    } finally {
      setSubmitting(false)
    }
  }

  return <section className="booking-page section">
    <button className="back-button" onClick={() => goTo('details')}><span>&lt;-</span> Back to car</button>
    <div className="booking-layout">
      <div className="booking-summary">
        <img src={car.image} alt={car.name} />
        <p className="kicker">Your selected car</p>
        <h1>{car.name}</h1>
        <p>{car.location} · {car.type} · {car.seats} seats</p>
        <strong>${car.price}<small> / day</small></strong>
      </div>
      <div className="booking-panel standalone">
        <p className="kicker">Secure checkout</p>
        <h2>Plan your escape.</h2>
        {sent ? <div className="success-message">
          <strong>Reservation request received.</strong>
          <p>Your {car.name} is reserved as a cash payment request. The booking will remain pending until the team confirms it.</p>
          <button className="outline-button" onClick={() => goTo('profile')}>View my trips</button>
        </div> : <form onSubmit={submitPayment}>
          <input name="pickupLocation" aria-label="Pick-up location" placeholder="Pick-up location" required />
          <div className="form-row">
            <input name="pickupDate" type="date" aria-label="Pick-up date" required onChange={(event) => setDates((current) => ({ ...current, pickupDate: event.target.value }))} />
            <input name="returnDate" type="date" aria-label="Return date" required onChange={(event) => setDates((current) => ({ ...current, returnDate: event.target.value }))} />
          </div>
          {availability?.available === false && <p className="booking-unavailable">Already booked for these dates</p>}
          {availability?.available && <p className="booking-available">Available for these dates</p>}
          <fieldset className="payment-options">
            <legend>Payment option</legend>
            <label><input type="radio" name="paymentMethod" value="stripe" checked={method === 'stripe'} onChange={() => setMethod('stripe')} /> Credit or debit card via Stripe</label>
            <label><input type="radio" name="paymentMethod" value="cash" checked={method === 'cash'} onChange={() => setMethod('cash')} /> Local / cash payment</label>
          </fieldset>
          <p className="demo-card-note">Card payments are entered securely on Stripe. We never store card numbers or security codes.</p>
          <button className="primary-button" type="submit" disabled={submitting || availability?.available === false}>
            {submitting ? 'Preparing checkout...' : method === 'cash' ? 'Request cash reservation' : 'Continue to secure payment'} <span>-&gt;</span>
          </button>
        </form>}
      </div>
    </div>
  </section>
}

export default Booking
