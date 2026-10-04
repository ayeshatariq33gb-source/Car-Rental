import { icons } from '../data/icons'

function Navbar({ page, user, menuOpen, setMenuOpen, goTo, onLogout, onAbout, onContact }) {
  return (
    <header className="navbar">
      <button className="brand" onClick={() => goTo('home')} aria-label="Go to home"><span className="brand-mark">R</span><span>roam<span className="brand-dot">.</span></span></button>
      <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
        <button className={page === 'home' ? 'active' : ''} onClick={() => goTo('home')}>Home</button>
        <button className={page === 'cars' || page === 'details' ? 'active' : ''} onClick={() => goTo('cars')}>Cars</button>
        <button className={page === 'about' ? 'active' : ''} onClick={onAbout}>About</button><button onClick={onContact}>Contact</button>
      </nav>
      <div className="nav-actions"><button className="profile-button" onClick={() => goTo(String(user?.role).toLowerCase() === 'admin' ? 'admin' : 'profile')} aria-label="Open profile"><span>{icons.user}</span></button>{user ? <button className="login-button" onClick={onLogout}>Log out</button> : <button className="login-button" onClick={() => goTo('login')}>Log in</button>}<button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? 'x' : 'menu'}</button></div>
    </header>
  )
}

export default Navbar
