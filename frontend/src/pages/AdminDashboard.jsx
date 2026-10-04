import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import AdminContentEditor from './AdminContentEditor'

const blankCar = { name: '', type: 'Luxury', seats: 5, transmission: 'Automatic', price: '', location: '', image: '', accent: 'Available now', available: true, maintenance: false }
const sections = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'content', label: 'Site content', icon: 'edit' },
  { id: 'fleet', label: 'Cars', icon: 'car' },
  { id: 'users', label: 'Users', icon: 'users' },
  { id: 'verification', label: 'Verification', icon: 'check' },
  { id: 'bookings', label: 'Bookings', icon: 'calendar' },
  { id: 'transactions', label: 'Transactions', icon: 'payment' },
  { id: 'sales', label: 'Sales', icon: 'sales' },
]

function AdminDashboard({ cars, setCars, onError }) {
  const [stats, setStats] = useState({ users: 0, bookings: 0, activeRentals: 0, availableCars: 0, revenue: 0 })
  const [users, setUsers] = useState([])
  const [bookings, setBookings] = useState([])
  const [paidBookings, setPaidBookings] = useState([])
  const [transactions, setTransactions] = useState([])
  const [form, setForm] = useState(blankCar)
  const [editingId, setEditingId] = useState(null)
  const [activeSection, setActiveSection] = useState('overview')
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const loadAdminData = async () => {
    try {
      const [dashboard, adminUsers, adminBookings, sales, paymentTransactions] = await Promise.all([
        api.getAdminDashboard(),
        api.getAdminUsers(),
        api.getAdminBookings(),
        api.getAdminPaidBookings(),
        api.getAdminTransactions(),
      ])
      setStats(dashboard.stats)
      setUsers(adminUsers)
      setBookings(adminBookings)
      setPaidBookings(sales)
      setTransactions(paymentTransactions)
    } catch (error) {
      onError(error.message)
    }
  }

  useEffect(() => { loadAdminData() }, [])

  const pendingBookings = useMemo(() => bookings.filter((booking) => booking.status === 'pending').length, [bookings])
  const recentBookings = useMemo(() => bookings.slice(0, 5), [bookings])
  const monthlySales = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1)
      const month = date.toLocaleString('en-US', { month: 'short' })
      const sales = paidBookings.reduce((total, booking) => {
        const bookingDate = new Date(booking.paidAt || booking.createdAt)
        const sameMonth = bookingDate.getFullYear() === date.getFullYear() && bookingDate.getMonth() === date.getMonth()
        return sameMonth ? total + Number(booking.totalPrice || 0) : total
      }, 0)
      return { month, sales }
    })
  }, [paidBookings])
  const maxMonthlySales = Math.max(...monthlySales.map((item) => item.sales), 1)
  const fleetUtilization = cars.length ? Math.min(100, Math.round((stats.activeRentals / cars.length) * 100)) : 0

  const navigateTo = (section) => {
    setActiveSection(section)
    document.getElementById(`admin-${section}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const saveCar = async (event) => {
    event.preventDefault()
    try {
      const saved = editingId
        ? await api.updateCar(editingId, form)
        : await api.createCar({ ...form, price: Number(form.price), seats: Number(form.seats) })
      setCars((current) => editingId ? current.map((car) => car.id === editingId ? saved : car) : [saved, ...current])
      setForm(blankCar)
      setEditingId(null)
    } catch (error) {
      onError(error.message)
    }
  }

  const deleteCar = async (id) => {
    try {
      await api.deleteCar(id)
      setCars((current) => current.filter((car) => car.id !== id))
    } catch (error) {
      onError(error.message)
    }
  }

  const updateStatus = async (id, status) => {
    try {
      const { booking } = await api.updateBookingStatus(id, status)
      setBookings((current) => current.map((item) => item._id === id ? booking : item))
    } catch (error) {
      onError(error.message)
    }
  }

  const resolveChange = async (id, status) => {
    try {
      const { booking } = await api.resolveBookingChange(id, status)
      setBookings((current) => current.map((item) => item._id === id ? booking : item))
    } catch (error) { onError(error.message) }
  }

  const setUserActive = async (id, isActive) => {
    try {
      const { user } = await api.setAdminUserActive(id, isActive)
      setUsers((current) => current.map((item) => item._id === id ? { ...item, ...user } : item))
    } catch (error) { onError(error.message) }
  }

  const reviewLicense = async (id, status) => {
    try {
      const { user } = await api.reviewAdminLicense(id, status)
      setUsers((current) => current.map((item) => item._id === id ? { ...item, ...user } : item))
    } catch (error) { onError(error.message) }
  }

  const showLicense = async (id) => {
    const preview = window.open('', '_blank')
    try {
      const url = await api.getAdminLicenseUrl(id)
      if (preview) preview.location = url
      else URL.revokeObjectURL(url)
    } catch (error) {
      preview?.close()
      onError(error.message)
    }
  }

  const updateTransaction = async (transaction, action) => {
    if (action === 'refund' && !window.confirm('Record a refund for this transaction? Stripe refunds are sent to the original payment method.')) return
    try {
      if (action === 'received') await api.markTransactionReceived(transaction._id)
      else await api.refundTransaction(transaction._id, 'Admin dashboard adjustment')
      await loadAdminData()
    } catch (error) { onError(error.message) }
  }

  const updateField = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const editCar = (car) => { setForm(car); setEditingId(car.id); navigateTo('fleet') }
  const startNewCar = () => { setForm(blankCar); setEditingId(null); navigateTo('fleet') }

  return <section className="admin-shell">
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand"><span className="brand-mark">R</span><div><strong>roam<span className="brand-dot">.</span></strong><small>ADMIN CONSOLE</small></div></div>
      <nav className="admin-nav" aria-label="Admin dashboard navigation">
        <p>Workspace</p>
        {sections.map((section) => <button className={activeSection === section.id ? 'active' : ''} key={section.id} onClick={() => navigateTo(section.id)}><span>{section.icon}</span>{section.label}</button>)}
      </nav>
      <div className="admin-sidebar-footer"><span className="admin-status-dot" />System operational</div>
    </aside>
    <div className="admin-main">
      <header className="admin-topbar"><div><p className="kicker">Operations / {sections.find((section) => section.id === activeSection)?.label}</p><h1>Good morning, <em>team.</em></h1></div><div className="admin-date">{today} <span>·</span> Live data</div></header>

      <section className="admin-section" id="admin-overview">
        <div className="admin-section-heading"><div><p className="kicker">At a glance</p><h2>Today&apos;s overview.</h2></div><button className="admin-action-button" onClick={startNewCar}>Add a car <span>+</span></button></div>
        <div className="admin-stats admin-summary-cards"><div><span>Total cars</span><strong>{cars.length}</strong><small>Cars in fleet</small></div><div><span>Total users</span><strong>{stats.users}</strong><small>Registered accounts</small></div><div><span>Total bookings</span><strong>{stats.bookings}</strong><small>All time</small></div><div className="pending-card"><span>Pending bookings</span><strong>{pendingBookings}</strong><small>Needs your attention</small></div></div>
        <div className="admin-stats admin-summary-cards"><div><span>Total revenue</span><strong>${Number(stats.revenue || 0).toLocaleString()}</strong><small>Received payments</small></div><div><span>Active rentals</span><strong>{stats.activeRentals}</strong><small>Currently in progress</small></div><div><span>Available cars</span><strong>{stats.availableCars}</strong><small>Ready to reserve</small></div><div><span>Registered users</span><strong>{stats.users}</strong><small>Active customer accounts</small></div></div>
        <SalesChart data={monthlySales} max={maxMonthlySales} />
        <div className="admin-overview-grid"><div className="admin-panel recent-panel"><div className="admin-panel-heading"><div><p className="kicker">Latest activity</p><h3>Recent bookings</h3></div><button className="text-button" onClick={() => navigateTo('bookings')}>View all <span>-&gt;</span></button></div>{recentBookings.length ? recentBookings.map((booking) => <BookingRow booking={booking} key={booking._id} compact />) : <p className="admin-empty">No bookings yet.</p>}</div><div className="admin-panel admin-brief"><p className="kicker">Fleet health</p><h3>Keep every<br /><em>journey moving.</em></h3><div className="health-line"><span>Fleet utilization</span><strong>{fleetUtilization}%</strong></div><div className="health-track"><span style={{ width: `${fleetUtilization}%` }} /></div><p>Review your cars, bookings, and customers from the workspace.</p></div></div>
      </section>

      <section className="admin-section" id="admin-content">
        <AdminContentEditor />
      </section>

      <section className="admin-section" id="admin-fleet"><div className="admin-section-heading"><div><p className="kicker">Fleet management</p><h2>Cars.</h2></div><button className="admin-action-button" onClick={startNewCar}>Add a car <span>+</span></button></div><div className="admin-content admin-fleet-layout"><div className="admin-panel admin-table"><div className="admin-panel-heading"><div><p className="kicker">Your fleet</p><h3>{cars.length} vehicles</h3></div></div>{cars.length ? cars.map((car) => <div className="fleet-row" key={car.id}><img src={car.image} alt="" /><div><strong>{car.name}</strong><span>{car.location} · {car.type}</span></div><span className="status">{car.available === false ? 'Unavailable' : 'Available'}</span><span className="row-actions"><button className="text-button" onClick={() => editCar(car)}>Edit</button><button className="text-button danger-action" onClick={() => deleteCar(car.id)}>Delete</button></span></div>) : <p className="admin-empty">No cars in the fleet.</p>}</div><CarEditor form={form} editingId={editingId} updateField={updateField} saveCar={saveCar} /></div></section>

      <section className="admin-section" id="admin-users"><div className="admin-section-heading"><div><p className="kicker">Customer management</p><h2>Users.</h2></div><span className="admin-count">{users.length} registered</span></div><div className="admin-panel admin-table admin-users"><div className="users-table" role="table" aria-label="Registered users"><div className="users-row users-header" role="row"><span>Name</span><span>Email</span><span>Phone</span><span>Role</span><span>Registered</span></div>{users.length ? users.map((item) => <div className="users-row" role="row" key={item._id}><strong>{item.name}</strong><span>{item.email}</span><span>{item.phone || 'Not provided'}</span><span className="status">{item.role}</span><span>{new Date(item.createdAt).toLocaleDateString()}</span></div>) : <p className="admin-empty">No users registered.</p>}</div></div></section>

      <section className="admin-section grid" id="admin-verification">
        <div className="admin-section-heading"><div><p className="kicker">Trust & access</p><h2>Verification and accounts.</h2></div><span className="admin-count">{users.filter((item) => item.drivingLicense?.status === 'pending').length} documents awaiting review</span></div>
        <div className="admin-panel admin-table admin-users"><div className="users-table" role="table" aria-label="User verification and account controls">
          <div className="users-row users-header" role="row"><span>User</span><span>License</span><span>Uploaded</span><span>Account</span><span>Controls</span></div>
          {users.filter((item) => item.role === 'user').map((item) => <div className="users-row verification-row" role="row" key={item._id}>
            <span><strong>{item.name}</strong><small>{item.email}</small></span>
            <span className={`status verification-${item.drivingLicense?.status || 'not_submitted'}`}>{item.drivingLicense?.status || 'not submitted'}</span>
            <span>{item.drivingLicense?.uploadedAt ? new Date(item.drivingLicense.uploadedAt).toLocaleDateString() : '—'}</span>
            <span className={`status ${item.isActive === false ? 'inactive' : ''}`}>{item.isActive === false ? 'Blocked' : 'Active'}</span>
            <span className="row-actions">
              {item.drivingLicense?.status && item.drivingLicense.status !== 'not_submitted' && <button className="text-button" onClick={() => showLicense(item._id)}>View ID</button>}
              {item.drivingLicense?.status === 'pending' && <><button className="text-button" onClick={() => reviewLicense(item._id, 'approved')}>Approve ID</button><button className="text-button danger-action" onClick={() => reviewLicense(item._id, 'rejected')}>Reject ID</button></>}
              <button className="text-button" onClick={() => setUserActive(item._id, item.isActive === false)}>{item.isActive === false ? 'Activate' : 'Block account'}</button>
            </span>
          </div>)}
        </div></div>
      </section>

      <section className="admin-section" id="admin-bookings"><div className="admin-section-heading"><div><p className="kicker">Reservation management</p><h2>Bookings.</h2></div><span className="admin-count">{bookings.length} total · {pendingBookings} pending</span></div><div className="admin-panel admin-table">{bookings.length ? bookings.map((booking) => <BookingRow booking={booking} key={booking._id} onStatusChange={updateStatus} onResolveChange={resolveChange} />) : <p className="admin-empty">No bookings yet.</p>}</div></section>

      <section className="admin-section grid" id="admin-transactions">
        <div className="admin-section-heading"><div><p className="kicker">Financial operations</p><h2>Transactions.</h2></div><span className="admin-count">{transactions.length} payment records</span></div>
        <div className="admin-panel admin-table admin-transactions-table"><div className="transaction-row transaction-header"><span>Transaction ID</span><span>User / booking</span><span>Method</span><span>Status</span><span>Date</span><span>Amount</span><span>Actions</span></div>
          {transactions.length ? transactions.map((transaction) => <div className="transaction-row" key={transaction._id}>
            <code>{transaction._id.slice(-8).toUpperCase()}</code>
            <span>{transaction.user?.name || transaction.user?.email || 'Customer'}<small>{transaction.booking?.car?.name || 'Rental booking'}</small></span>
            <span>{transaction.method === 'stripe' ? 'Stripe card' : 'Local / cash'}</span>
            <span className={`status transaction-${transaction.status}`}>{transaction.status}</span>
            <span>{new Date(transaction.paidAt || transaction.createdAt).toLocaleDateString()}</span>
            <strong>${Number(transaction.amount || 0).toLocaleString()}</strong>
            <span className="row-actions">{transaction.status === 'pending' && transaction.method !== 'stripe' && <button className="text-button" onClick={() => updateTransaction(transaction, 'received')}>Mark received</button>}{transaction.status === 'received' && <button className="text-button danger-action" onClick={() => updateTransaction(transaction, 'refund')}>Record refund</button>}</span>
          </div>) : <p className="admin-empty">No transactions have been recorded.</p>}
        </div>
      </section>

      <section className="admin-section" id="admin-sales"><div className="admin-section-heading"><div><p className="kicker">Transactions</p><h2>Paid sales.</h2></div><span className="admin-count">{paidBookings.length} paid bookings</span></div><div className="admin-stats admin-sales-summary"><div><span>Gross paid sales</span><strong>${Number(stats.revenue || 0).toLocaleString()}</strong><small>Successful demo card payments</small></div><div><span>Paid orders</span><strong>{paidBookings.length}</strong><small>Stored in MongoDB</small></div></div><div className="admin-panel admin-table admin-sales-table"><div className="sale-row sale-header"><span>Customer</span><span>Car</span><span>Paid on</span><span>Payment</span><span>Amount</span></div>{paidBookings.length ? paidBookings.map((order) => <div className="sale-row" key={order._id}><span>{order.user?.name || order.user?.email || 'Customer'}</span><span>{order.car?.name || 'Car unavailable'}</span><span>{new Date(order.paidAt || order.createdAt).toLocaleDateString()}</span><span>Card ···· {order.cardLast4 || '4242'}</span><strong>${Number(order.totalPrice || 0).toLocaleString()}</strong></div>) : <p className="admin-empty">No paid transactions yet.</p>}</div><SalesChart data={monthlySales} max={maxMonthlySales} /></section>
    </div>
  </section>
}

function CarEditor({ form, editingId, updateField, saveCar }) {
  return <div className="admin-note admin-editor"><p className="kicker">Car editor</p><h3>{editingId ? 'Edit car.' : 'Add a car.'}</h3><form onSubmit={saveCar} className="admin-car-form">
    {['name', 'location', 'image', 'price', 'seats', 'accent'].map((field) => <input key={field} name={field} value={form[field] ?? ''} onChange={updateField} placeholder={field} required />)}
    <select name="type" value={form.type} onChange={updateField}><option>Luxury</option><option>SUV</option><option>Electric</option><option>Sport</option><option>Sedan</option><option>Compact</option></select>
    <select name="available" value={String(form.available !== false && form.available !== 'false')} onChange={updateField} aria-label="Car booking availability"><option value="true">Available for booking</option><option value="false">Unavailable for booking</option></select>
    <select name="maintenance" value={String(form.maintenance === true || form.maintenance === 'true')} onChange={updateField} aria-label="Car maintenance state"><option value="false">Not in maintenance</option><option value="true">Under maintenance</option></select>
    <button className="outline-button" type="submit">{editingId ? 'Save changes' : 'Add car'}</button>
  </form></div>
}

function SalesChart({ data, max }) {
  const total = data.reduce((sum, item) => sum + item.sales, 0)
  return <div className="admin-panel sales-chart-panel"><div className="admin-panel-heading"><div><p className="kicker">Performance</p><h3>Monthly sales</h3></div><strong className="sales-total">${total.toLocaleString()}</strong></div><div className="sales-chart" aria-label="Monthly sales bar chart" role="img">{data.map((item) => <div className="sales-column" key={item.month}><span className="sales-value">{item.sales ? `$${item.sales.toLocaleString()}` : '-'}</span><div className="sales-bar-track"><span className="sales-bar" style={{ height: `${Math.max((item.sales / max) * 100, item.sales ? 8 : 2)}%` }} /></div><small>{item.month}</small></div>)}</div><div className="sales-legend"><span><i />Revenue from paid orders</span><span>Last 6 months</span></div></div>
}

function BookingRow({ booking, onStatusChange, onResolveChange, compact = false }) {
  const requestIsPending = booking.changeRequest?.status === 'pending'
  return <div className={compact ? 'booking-row compact' : 'booking-row'}>
    <div className="booking-avatar">{booking.user?.name?.slice(0, 2).toUpperCase() || 'R'}</div>
    <div className="booking-person"><strong>{booking.user?.name || booking.user?.email || 'Guest'}</strong><span>{booking.car?.name || 'Car'} · {new Date(booking.createdAt).toLocaleDateString()}</span></div>
    <span className={`booking-status ${booking.status}`}>{booking.status}{booking.paymentStatus === 'paid' ? ' · Paid' : ''}</span>
    {!compact && <>
      <span className="booking-dates">{new Date(booking.pickupDate).toLocaleDateString()} - {new Date(booking.returnDate).toLocaleDateString()}</span>
      <strong className="booking-total">${booking.totalPrice}</strong>
      <div className="booking-row-actions">
        <select value={booking.status} onChange={(event) => onStatusChange(booking._id, event.target.value)} aria-label={`Update status for ${booking.user?.name || 'booking'}`}>
          <option value="pending">pending</option><option value="confirmed">confirmed</option><option value="active">in progress</option><option value="completed">completed</option><option value="cancelled">cancelled</option><option value="rejected">rejected</option>
        </select>
        {booking.status === 'pending' && <><button className="text-button" onClick={() => onStatusChange(booking._id, 'confirmed')}>Approve</button><button className="text-button danger-action" onClick={() => onStatusChange(booking._id, 'rejected')}>Reject</button></>}
        {requestIsPending && <span className="change-request-controls"><small>{booking.changeRequest.kind} request</small><button className="text-button" onClick={() => onResolveChange(booking._id, 'approved')}>Accept request</button><button className="text-button danger-action" onClick={() => onResolveChange(booking._id, 'rejected')}>Decline request</button></span>}
      </div>
    </>}
  </div>
}

export default AdminDashboard
