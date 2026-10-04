const API_URL = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'roam_token'
const USER_KEY = 'roam_user'

const normalizeCar = (car) => {
  const mongoId = car._id ? String(car._id) : null
  return { ...car, _id: mongoId || car._id, id: mongoId || car.id }
}

async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY)
  const isFormData = options.body instanceof FormData
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Request failed')
  return data
}

const json = (method, body) => ({ method, body: JSON.stringify(body) })

export const auth = {
  getUser: () => JSON.parse(localStorage.getItem(USER_KEY) || 'null'),
  isAuthenticated: () => Boolean(localStorage.getItem(TOKEN_KEY)),
  save: ({ token, user }) => { localStorage.setItem(TOKEN_KEY, token); localStorage.setItem(USER_KEY, JSON.stringify(user)); return user },
  setUser: (user) => { localStorage.setItem(USER_KEY, JSON.stringify(user)); return user },
  logout: () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY) },
}

export const api = {
  register: async (payload) => auth.save(await request('/auth/register', json('POST', payload))),
  login: async (payload) => auth.save(await request('/auth/login', json('POST', payload))),
  getProfile: () => request('/users/profile').then(({ user }) => auth.setUser(user)),
  getSiteContent: () => request('/content').then(({ content }) => content),
  updateSiteContent: (content) => request('/content', json('PUT', { content } )).then(({ content: saved }) => saved),
  addContentItem: (collection, item) => request(`/content/items/${collection}`, json('POST', item)),
  updateContentItem: (collection, id, item) => request(`/content/items/${collection}/${id}`, json('PUT', item)),
  deleteContentItem: (collection, id) => request(`/content/items/${collection}/${id}`, { method: 'DELETE' }),
  updateProfile: (payload) => request('/users/profile', json('PUT', payload)).then(({ user }) => { localStorage.setItem(USER_KEY, JSON.stringify(user)); return user }),
  updatePassword: (payload) => request('/users/profile/password', json('PUT', payload)),
  uploadDrivingLicense: (file) => {
    const body = new FormData()
    body.append('license', file)
    return request('/users/profile/driving-license', { method: 'POST', body }).then(({ user }) => { localStorage.setItem(USER_KEY, JSON.stringify(user)); return user })
  },
  getCars: async (params = {}) => {
    const search = new URLSearchParams(params).toString()
    const { cars } = await request(`/cars${search ? `?${search}` : ''}`)
    return cars.map(normalizeCar)
  },
  getCar: (id) => request(`/cars/${id}`).then(({ car }) => normalizeCar(car)),
  checkAvailability: (id, pickupDate, returnDate) => request(`/cars/${id}/availability?${new URLSearchParams({ pickupDate, returnDate })}`),
  createCar: (payload) => request('/cars', json('POST', payload)).then(({ car }) => normalizeCar(car)),
  updateCar: (id, payload) => request(`/cars/${id}`, json('PUT', payload)).then(({ car }) => normalizeCar(car)),
  deleteCar: (id) => request(`/cars/${id}`, { method: 'DELETE' }),
  createBooking: (payload) => request('/bookings', json('POST', payload)),
  createPaymentCheckout: (payload) => request('/payments/checkout', json('POST', payload)),
  getMyBookings: () => request('/bookings/my').then(({ bookings }) => bookings),
  cancelBooking: (id) => request(`/bookings/${id}/cancel`, { method: 'PATCH' }),
  requestBookingChange: (id, payload) => request(`/bookings/${id}/change-request`, json('POST', payload)),
  submitBookingReview: (id, payload) => request(`/bookings/${id}/review`, json('POST', payload)),
  getAdminDashboard: () => request('/admin/dashboard'),
  getAdminUsers: () => request('/admin/users').then(({ users }) => users),
  getAdminBookings: () => request('/admin/bookings').then(({ bookings }) => bookings),
  getAdminPaidBookings: () => request('/admin/paid-bookings').then(({ bookings }) => bookings),
// Admin ke liye (Saari transactions dekhne ke liye):
getAdminTransactions: () => request('/admin/transactions').then(({ transactions }) => transactions),

// Normal User ke liye (Sirf apni transactions/bookings dekhne ke liye):
getMyTransactions: () => request('/bookings/my').then(({ bookings }) => bookings),

  getAdminLicenseUrl: async (id) => {
    const token = localStorage.getItem(TOKEN_KEY)
    const response = await fetch(`${API_URL}/admin/users/${id}/license`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'Unable to open document')
    return URL.createObjectURL(await response.blob())
  },
  setAdminUserActive: (id, isActive) => request(`/admin/users/${id}/status`, json('PATCH', { isActive })),
  reviewAdminLicense: (id, status, rejectionReason = '') => request(`/admin/users/${id}/license`, json('PATCH', { status, rejectionReason })),
  updateBookingStatus: (id, status) => request(`/admin/bookings/${id}/status`, json('PATCH', { status })),
  resolveBookingChange: (id, status) => request(`/admin/bookings/${id}/change-request`, json('PATCH', { status })),
  markTransactionReceived: (id) => request(`/admin/transactions/${id}/received`, json('PATCH', {})),
  refundTransaction: (id, reason) => request(`/admin/transactions/${id}/refund`, json('PATCH', { reason })),
}

export { API_URL }
