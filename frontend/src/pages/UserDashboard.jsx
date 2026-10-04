import { useEffect, useState } from 'react'
import { api } from '../api'

const views = [
  { id: 'rides', label: 'My bookings' },
  { id: 'payments', label: 'Payments & invoices' },
  { id: 'account', label: 'Profile & verification' },
  { id: 'security', label: 'Security' },
]

function UserDashboard({ user, goTo, onLogout, onError }) {
  const [profile, setProfile] = useState(user)
  const [bookings, setBookings] = useState([])
  const [transactions, setTransactions] = useState([])
  const [activeView, setActiveView] = useState('rides')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [printTarget, setPrintTarget] = useState(null)

  const loadDashboard = async () => {
    try {
      const [nextBookings, nextTransactions, nextProfile] = await Promise.all([
        api.getMyBookings(),
        api.getMyTransactions(),
        api.getProfile(),
      ])
      setBookings(nextBookings)
      setTransactions(nextTransactions || [])
      setProfile(nextProfile)
    } catch (error) {
      onError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDashboard() }, [])

  useEffect(() => {
    if (!printTarget) return undefined
    const clearPrintTarget = () => setPrintTarget(null)
    window.addEventListener('afterprint', clearPrintTarget, { once: true })
    window.setTimeout(() => window.print(), 100)
    return () => window.removeEventListener('afterprint', clearPrintTarget)
  }, [printTarget])

  const activeBookings = bookings.filter((booking) => ['pending', 'confirmed', 'active'].includes(booking.status))
  const pastBookings = bookings.filter((booking) => ['completed', 'cancelled', 'rejected'].includes(booking.status))
  const paidTotal = transactions.filter((transaction) => transaction.status === 'received').reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0)

  const updateProfile = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      const updated = await api.updateProfile({ name: form.get('name'), email: form.get('email'), phone: form.get('phone') })
      setProfile(updated)
      setMessage('Profile details saved.')
    } catch (error) { onError(error.message) }
  }

  const uploadLicense = async (event) => {
    event.preventDefault()
    const file = new FormData(event.currentTarget).get('license')
    if (!file?.size) return onError('Choose a PDF, JPG, or PNG document.')
    try {
      setProfile(await api.uploadDrivingLicense(file))
      setMessage('Document uploaded and queued for verification.')
      event.currentTarget.reset()
    } catch (error) { onError(error.message) }
  }

  const updatePassword = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      await api.updatePassword({ currentPassword: form.get('currentPassword'), newPassword: form.get('newPassword') })
      setMessage('Password updated.')
      event.currentTarget.reset()
    } catch (error) { onError(error.message) }
  }

  const requestChange = async (bookingId, request) => {
    try {
      const { booking } = await api.requestBookingChange(bookingId, request)
      setBookings((current) => current.map((item) => item._id === bookingId ? booking : item))
      setMessage('Your request has been sent to the rental team.')
    } catch (error) { onError(error.message) }
  }

  const submitReview = async (bookingId, review) => {
    try {
      const { booking } = await api.submitBookingReview(bookingId, review)
      setBookings((current) => current.map((item) => item._id === bookingId ? booking : item))
      setMessage('Thank you for reviewing your trip.')
    } catch (error) { onError(error.message) }
  }

  const printInvoice = (bookingId) => setPrintTarget(bookingId)
  const paymentNotice = new URLSearchParams(window.location.search).get('payment')

  return <section className="user-dashboard section">
    <header className="user-dashboard-header">
      <div><p className="kicker">Your Roam account</p><h1>Hi, {profile?.name?.split(' ')[0] || 'there'}.</h1><p>{profile?.email}</p></div>
      <div className="avatar">{profile?.name?.slice(0, 2).toUpperCase() || 'AM'}</div>
    </header>
    {paymentNotice && <p className="dashboard-notice" role="status">{paymentNotice === 'success' ? 'Checkout returned successfully. Payment confirmation will appear as soon as Stripe verifies it.' : 'Checkout was cancelled. No payment was collected.'}</p>}
    {message && <p className="dashboard-notice" role="status">{message}<button type="button" onClick={() => setMessage('')}>Dismiss</button></p>}
    <div className="dashboard-metrics grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div><span>Active reservations</span><strong>{activeBookings.length}</strong></div>
      <div><span>Paid with us</span><strong>${paidTotal.toLocaleString()}</strong></div>
      <div><span>License status</span><strong>{labelLicenseStatus(profile?.drivingLicense?.status)}</strong></div>
    </div>
    <div className="user-dashboard-layout">
      <nav className="user-dashboard-nav flex flex-wrap gap-2" aria-label="User dashboard">
        {views.map((view) => <button key={view.id} className={activeView === view.id ? 'active' : ''} onClick={() => setActiveView(view.id)}>{view.label}</button>)}
        <button onClick={() => goTo('cars')}>Browse cars</button>
        <button onClick={onLogout}>Log out</button>
      </nav>
      <main className="user-dashboard-content">
        {loading ? <p>Loading your account...</p> : <>
          {activeView === 'rides' && <RidesPanel activeBookings={activeBookings} pastBookings={pastBookings} onRequestChange={requestChange} onReview={submitReview} onPrint={printInvoice} printTarget={printTarget} />}
          {activeView === 'payments' && <PaymentsPanel transactions={transactions} onPrint={printInvoice} printTarget={printTarget} />}
          {activeView === 'account' && <AccountPanel profile={profile} onSave={updateProfile} onUpload={uploadLicense} />}
          {activeView === 'security' && <SecurityPanel onSubmit={updatePassword} />}
        </>}
      </main>
    </div>
  </section>
}

function RidesPanel({ activeBookings, pastBookings, onRequestChange, onReview, onPrint, printTarget }) {
  return <>
    <section className="dashboard-panel">
      <div className="dashboard-panel-heading"><div><p className="kicker">On the road</p><h2>Active bookings</h2></div><span>{activeBookings.length} reservations</span></div>
      {activeBookings.length ? <div className="grid gap-4 lg:grid-cols-2">{activeBookings.map((booking) => <ActiveBookingCard key={booking._id} booking={booking} onRequestChange={onRequestChange} onPrint={onPrint} printTarget={printTarget} />)}</div> : <p className="dashboard-empty">No active reservations. Your next trip starts with a car.</p>}
    </section>
    <section className="dashboard-panel">
      <div className="dashboard-panel-heading"><div><p className="kicker">Your trips</p><h2>Past booking history</h2></div><span>{pastBookings.length} bookings</span></div>
      {pastBookings.length ? <div className="dashboard-table-wrap"><table className="dashboard-table">
        <thead><tr><th>Vehicle</th><th>Dates & location</th><th>Status</th><th>Rating / review</th><th>Summary</th></tr></thead>
        <tbody>{pastBookings.map((booking) => <tr className={printTarget === booking._id ? 'print-target' : ''} key={booking._id}>
          <td><strong>{booking.car?.name || 'Car unavailable'}</strong></td>
          <td>{dateRange(booking)}<br />{booking.pickupLocation}</td>
          <td><StatusBadge value={booking.status} /></td>
          <td>{booking.review?.submittedAt ? <span>{'★'.repeat(booking.review.rating)} {booking.review.comment}</span> : booking.status === 'completed' ? <ReviewForm onSubmit={(review) => onReview(booking._id, review)} /> : 'Not available'}</td>
          <td><button className="text-button" onClick={() => onPrint(booking._id)}>Print invoice</button></td>
        </tr>)}</tbody>
      </table></div> : <p className="dashboard-empty">Completed or cancelled trips will appear here.</p>}
    </section>
  </>
}

function ActiveBookingCard({ booking, onRequestChange, onPrint, printTarget }) {
  const [requestOpen, setRequestOpen] = useState(false)
  const [requestKind, setRequestKind] = useState('cancellation')
  const pendingRequest = booking.changeRequest?.status === 'pending'
  return <article className={`active-booking-card${printTarget === booking._id ? ' print-target' : ''}`}>
    <img src={booking.car?.image} alt={booking.car?.name || 'Rental car'} />
    <div className="active-booking-copy">
      <div className="dashboard-row"><h3>{booking.car?.name || 'Car unavailable'}</h3><StatusBadge value={booking.status} /></div>
      <p>{dateRange(booking)}</p><p>{booking.pickupLocation}</p>
      <p><PaymentBadge value={booking.paymentStatus} /> · ${Number(booking.totalPrice || 0).toLocaleString()}</p>
      {pendingRequest && <p className="request-pending">{booking.changeRequest.kind} request awaiting review</p>}
      <div className="dashboard-actions print-hide">
        <button className="text-button" onClick={() => onPrint(booking._id)}>Print invoice</button>
        {!pendingRequest && <button className="text-button" onClick={() => setRequestOpen((open) => !open)}>Request change</button>}
      </div>
      {requestOpen && !pendingRequest && <form className="request-form grid gap-3 sm:grid-cols-2 print-hide" onSubmit={(event) => {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        onRequestChange(booking._id, { kind: requestKind, pickupDate: form.get('pickupDate'), returnDate: form.get('returnDate'), message: form.get('message') })
        setRequestOpen(false)
      }}>
        <label>Request type<select value={requestKind} onChange={(event) => setRequestKind(event.target.value)}><option value="cancellation">Cancellation</option><option value="reschedule">Reschedule</option></select></label>
        {requestKind === 'reschedule' && <><label>New pick-up date<input name="pickupDate" type="date" required /></label><label>New return date<input name="returnDate" type="date" required /></label></>}
        <label className="request-message">Message<textarea name="message" maxLength="500" rows="2" /></label>
        <button className="outline-button" type="submit">Send request</button>
      </form>}
    </div>
  </article>
}

function ReviewForm({ onSubmit }) {
  return <form className="review-form" onSubmit={(event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onSubmit({ rating: Number(form.get('rating')), comment: form.get('comment') })
  }}>
    <select name="rating" aria-label="Rating" defaultValue="5"><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select>
    <textarea name="comment" placeholder="Write a review" maxLength="1200" rows="2" />
    <button className="text-button" type="submit">Submit review</button>
  </form>
}

function PaymentsPanel({ transactions, onPrint, printTarget }) {
  return <section className="dashboard-panel">
    <div className="dashboard-panel-heading"><div><p className="kicker">Your account</p><h2>Payments & invoices</h2></div><span>{transactions.length} transactions</span></div>
    {transactions.length ? <div className="dashboard-table-wrap"><table className="dashboard-table">
      <thead><tr><th>Transaction</th><th>Booking</th><th>Method</th><th>Status</th><th>Amount</th><th>Invoice</th></tr></thead>
      <tbody>{transactions.map((transaction) => <tr className={printTarget === transaction.booking?._id ? 'print-target' : ''} key={transaction._id}>
        <td>{transaction._id.slice(-8).toUpperCase()}</td>
        <td>{transaction.booking?.car?.name || 'Rental booking'}<br />{transaction.booking ? dateRange(transaction.booking) : ''}</td>
        <td>{transaction.method === 'stripe' ? 'Card · Stripe' : 'Local / cash'}</td>
        <td><TransactionBadge value={transaction.status} /></td>
        <td>{formatMoney(transaction.amount, transaction.currency)}</td>
        <td>{transaction.booking && <button className="text-button" onClick={() => onPrint(transaction.booking._id)}>Print / PDF</button>}</td>
      </tr>)}</tbody>
    </table></div> : <p className="dashboard-empty">Payment records appear after you request a reservation.</p>}
  </section>
}

function AccountPanel({ profile, onSave, onUpload }) {
  const license = profile?.drivingLicense || {}
  return <div className="grid gap-5 lg:grid-cols-2">
    <section className="dashboard-panel">
      <p className="kicker">Contact details</p><h2>Profile information</h2>
      <form className="dashboard-form grid gap-3" onSubmit={onSave}>
        <label>Full name<input name="name" defaultValue={profile?.name || ''} maxLength="80" required /></label>
        <label>Email<input name="email" type="email" defaultValue={profile?.email || ''} required /></label>
        <label>Phone<input name="phone" type="tel" defaultValue={profile?.phone || ''} /></label>
        <button className="outline-button" type="submit">Save profile</button>
      </form>
    </section>
    <section className="dashboard-panel">
      <div className="dashboard-row"><div><p className="kicker">Identity</p><h2>Driving license</h2></div><StatusBadge value={license.status || 'not_submitted'} /></div>
      {license.fileName && <p>Current document: {license.fileName}</p>}
      {license.rejectionReason && <p className="form-error">{license.rejectionReason}</p>}
      <form className="dashboard-form grid gap-3" onSubmit={onUpload}>
        <label>Upload PDF, JPG, or PNG (max 5 MB)<input name="license" type="file" accept="application/pdf,image/jpeg,image/png" required /></label>
        <button className="outline-button" type="submit">Upload for verification</button>
      </form>
    </section>
  </div>
}

function SecurityPanel({ onSubmit }) {
  return <section className="dashboard-panel dashboard-security">
    <p className="kicker">Account security</p><h2>Change password</h2>
    <form className="dashboard-form grid gap-3" onSubmit={onSubmit}>
      <label>Current password<input name="currentPassword" type="password" autoComplete="current-password" required /></label>
      <label>New password<input name="newPassword" type="password" autoComplete="new-password" minLength="8" required /></label>
      <button className="outline-button" type="submit">Update password</button>
    </form>
  </section>
}

function StatusBadge({ value }) {
  const label = value === 'active' ? 'In Progress' : labelLicenseStatus(value)
  return <span className={`dashboard-badge status-${value}`}>{label}</span>
}

function PaymentBadge({ value }) {
  const label = value === 'paid' ? 'Paid' : value === 'deposit_pending' ? 'Deposit Pending' : value === 'refunded' ? 'Refunded' : 'Unpaid'
  return <span className={`dashboard-badge payment-${value}`}>{label}</span>
}

function TransactionBadge({ value }) {
  const label = value === 'received' ? 'Received' : value === 'refunded' ? 'Refunded' : value === 'failed' ? 'Failed' : 'Pending'
  return <span className={`dashboard-badge payment-${value}`}>{label}</span>
}

function labelLicenseStatus(value = 'not_submitted') {
  return ({ not_submitted: 'Not submitted', pending: 'Pending review', approved: 'Verified', rejected: 'Rejected' })[value] || value
}

function dateRange(booking) {
  return `${new Date(booking.pickupDate).toLocaleDateString()} - ${new Date(booking.returnDate).toLocaleDateString()}`
}

function formatMoney(amount, currency = 'usd') {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: String(currency).toUpperCase() }).format(Number(amount || 0))
}

export default UserDashboard
