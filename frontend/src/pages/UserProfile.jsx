import { useEffect, useState } from 'react'
import { api } from '../api'

function UserProfile({ user, goTo, onLogout, onError }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('history')

  useEffect(() => {
    api.getMyBookings().then(setBookings).catch((error) => onError(error.message)).finally(() => setLoading(false))
  }, [onError])

  const cancel = async (id) => {
    try { await api.cancelBooking(id); setBookings((current) => current.map((booking) => booking._id === id ? { ...booking, status: 'cancelled' } : booking)) } catch (error) { onError(error.message) }
  }

  const paidBookings = bookings.filter((booking) => booking.paymentStatus === 'paid')
  const visibleBookings = activeView === 'paid' ? paidBookings : bookings
  const paidTotal = paidBookings.reduce((total, booking) => total + Number(booking.totalPrice || 0), 0)

  return <section className="profile-page section">
    <div className="profile-header">
      <div><p className="kicker">Your Roam account</p><h1>Hi, {user?.name?.split(' ')[0] || 'there'}.</h1><p>{user?.email}</p></div>
      <div className="avatar">{user?.name?.slice(0, 2).toUpperCase() || 'AM'}</div>
    </div>
    <div className="profile-grid">
      <div className="profile-main">
        <div className="profile-tabs">
          <button className={activeView === 'history' ? 'active' : ''} onClick={() => setActiveView('history')}>Booking history ({bookings.length})</button>
          <button className={activeView === 'paid' ? 'active' : ''} onClick={() => setActiveView('paid')}>Paid orders ({paidBookings.length})</button>
          <button onClick={() => goTo('cars')}>Browse cars</button>
          <button onClick={onLogout}>Log out</button>
        </div>
        <h2 className="profile-list-heading">{activeView === 'paid' ? 'Paid orders.' : 'Booking history.'}</h2>
        {loading && <p>Loading your trips...</p>}
        {!loading && !visibleBookings.length && <div className="empty-state">
          <h2>{activeView === 'paid' ? 'No paid orders yet' : 'No trips yet'}</h2>
          <p>{activeView === 'paid' ? 'Completed demo payments will appear here.' : 'Your next story starts with a car.'}</p>
          <button className="outline-button" onClick={() => goTo('cars')}>Explore cars</button>
        </div>}
        <div className="trip-list">{visibleBookings.map((booking) => <article className="trip-card" key={booking._id}>
          <div className="trip-card-image"><img src={booking.car?.image} alt={booking.car?.name || 'Booked car'} /></div>
          <div className="trip-card-copy">
            <p className="kicker">{booking.status} · {booking.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}</p>
            <h2>{booking.car?.name || 'Car unavailable'}</h2>
            <p className="trip-date">{new Date(booking.pickupDate).toLocaleDateString()} - {new Date(booking.returnDate).toLocaleDateString()}</p>
            <p className="trip-car">{booking.pickupLocation} · ${booking.totalPrice}</p>
            {booking.paymentStatus === 'paid' && <p className="trip-payment">Paid {booking.paidAt ? new Date(booking.paidAt).toLocaleDateString() : ''} · Card ending {booking.cardLast4 || '4242'}</p>}
            {['pending', 'confirmed'].includes(booking.status) && <button className="text-button" onClick={() => cancel(booking._id)}>Cancel booking <span>-&gt;</span></button>}
          </div>
        </article>)}</div>
      </div>
      <aside className="profile-side">
        <div><span className="side-icon">calendar</span><strong>{bookings.length} trips</strong><p>Your Roam journey so far</p></div>
        <div><span className="side-icon">payment</span><strong>${paidTotal.toLocaleString()} paid</strong><p>{paidBookings.length} completed card payments</p></div>
        <div><span className="side-icon">user</span><strong>{user?.role === 'admin' ? 'Admin account' : 'Roam member'}</strong><p>{user?.email}</p></div>
        <button className="outline-button" onClick={() => goTo('cars')}>Book another car</button>
      </aside>
    </div>
  </section>
}

export default UserProfile
