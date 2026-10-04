import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { api, auth } from './api'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import AdminDashboard from './pages/AdminDashboard'
import About from './pages/About'
import Booking from './pages/Booking'
import CarDetails from './pages/CarDetails'
import Cars from './pages/Cars'
import Contact from './pages/Contact'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import UserDashboard from './pages/UserDashboard'

const pagePaths = {
  home: '/',
  admin: '/AdminDashboard',
  profile: '/profile',
  login: '/login',
  register: '/register',
  cars: '/cars',
  about: '/about',
  contact: '/contact',
}

const pathPages = Object.fromEntries(Object.entries(pagePaths).map(([page, path]) => [path, page]))

function App() {
  const [page, setPage] = useState(() => pathPages[window.location.pathname] || 'home')
  const [cars, setCars] = useState([])
  const [selectedCar, setSelectedCar] = useState(null)
  const [query, setQuery] = useState('')
  const [type, setType] = useState('All')
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState(auth.getUser())
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth.isAuthenticated()) return
    api.getProfile().then(setUser).catch(() => {
      auth.logout()
      setUser(null)
    })
  }, [])

  const loadCars = async () => {
    try { setCars(await api.getCars()) } catch (requestError) { setError(requestError.message) } finally { setLoading(false) }
  }

  useEffect(() => { loadCars() }, [])

  const filteredCars = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return cars.filter((car) => {
      if (car.available === false || car.maintenance) return false
      const searchable = `${car.name || ''} ${car.location || ''} ${car.type || ''}`.toLowerCase()
      const matchesQuery = searchable.includes(normalizedQuery)
      const matchesType = type === 'All' || String(car.type || '').toLowerCase() === type.toLowerCase()
      return matchesQuery && matchesType
    })
  }, [cars, query, type])

  const goTo = (nextPage) => {
    setError('')
    setPage(nextPage)
    setMenuOpen(false)
    const nextPath = pagePaths[nextPage]
    if (nextPath && window.location.pathname !== nextPath) window.history.pushState({}, '', nextPath)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const handlePopState = () => setPage(pathPages[window.location.pathname] || 'home')
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    const role = String(user?.role || '').toLowerCase()
    const target = page === 'admin' && user && role !== 'admin' ? 'profile' : page === 'profile' && role === 'admin' ? 'admin' : null
    if (target) {
      setPage(target)
      window.history.replaceState({}, '', pagePaths[target])
    }
  }, [page, user])

  const showDetails = (car) => { setSelectedCar(car); goTo('details') }
  const handleLogin = async (credentials) => { try { const nextUser = await api.login(credentials); setUser(nextUser); const role = String(nextUser.role || 'user').toLowerCase(); goTo(role === 'admin' ? 'admin' : 'profile') } catch (requestError) { setError(requestError.message) } }
  const handleRegister = async (details) => { try { const nextUser = await api.register(details); setUser(nextUser); goTo('profile') } catch (requestError) { setError(requestError.message) } }
  const handleLogout = () => { auth.logout(); setUser(null); goTo('home') }
  const handleBooking = async (details) => {
    try {
      if (!selectedCar) throw new Error('Select a car before booking')
      return await api.createPaymentCheckout({ ...details, car: selectedCar._id || selectedCar.id })
    } catch (requestError) {
      setError(requestError.message)
      return false
    }
  }

  const renderPage = () => {
    if (loading && page === 'home') return <div className="loading-state">Loading the Roam fleet...</div>
    if (page === 'admin' && String(user?.role).toLowerCase() !== 'admin') return user ? <UserDashboard user={user} goTo={goTo} onLogout={handleLogout} onError={setError} /> : <Login goTo={goTo} onSubmit={handleLogin} />
    if (page === 'profile' && String(user?.role).toLowerCase() === 'admin') return <AdminDashboard cars={cars} setCars={setCars} onError={setError} />
    if (page === 'profile' && !user) return <Login goTo={goTo} onSubmit={handleLogin} />
    if (page === 'booking' && !user) return <Login goTo={goTo} onSubmit={handleLogin} />
    switch (page) {
      case 'cars': return <Cars cars={filteredCars} loading={loading} query={query} setQuery={setQuery} type={type} setType={setType} onDetails={showDetails} />
      case 'details': return <CarDetails car={selectedCar} goTo={goTo} />
      case 'booking': return <Booking car={selectedCar} goTo={goTo} onSubmit={handleBooking} />
      case 'login': return <Login goTo={goTo} onSubmit={handleLogin} />
      case 'register': return <Register goTo={goTo} onSubmit={handleRegister} />
      case 'profile': return <UserDashboard user={user} goTo={goTo} onLogout={handleLogout} onError={setError} />
      case 'admin': return <AdminDashboard cars={cars} setCars={setCars} onError={setError} />
      case 'about': return <About goTo={goTo} />
      case 'contact': return <Contact />
      default: return <Home cars={cars} query={query} setQuery={setQuery} goTo={goTo} onDetails={showDetails} />
    }
  }

  const isAuthPage = page === 'login' || page === 'register'
  return <><Navbar page={page} user={user} menuOpen={menuOpen} setMenuOpen={setMenuOpen} goTo={goTo} onLogout={handleLogout} onAbout={() => goTo('about')} onContact={() => goTo('contact')} />{error && <div className="api-error" role="alert">{error}<button onClick={() => setError('')}>x</button></div>}<main>{renderPage()}</main>{!isAuthPage && <Footer goTo={goTo} onAbout={() => goTo('about')} />}</>
}

export default App
