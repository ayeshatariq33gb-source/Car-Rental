function Login({ goTo, onSubmit }) {
  return <AuthLayout title="Good to see you." subtitle="Sign in to manage your trips and saved cars." submitLabel="Log in" switchLabel="New to Roam?" switchAction="Create an account" onSwitch={() => goTo('register')} goTo={goTo} onSubmit={onSubmit} />
}

function AuthLayout({ title, subtitle, submitLabel, switchLabel, switchAction, onSwitch, goTo, onSubmit, showName = false }) {
  return <section className="auth-page"><div className="auth-visual"><img src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=85" alt="Classic car on a road" /><div><span className="brand-mark">R</span><p>Make room for<br /><em>the unexpected.</em></p></div></div><div className="auth-form"><button className="back-button" onClick={() => goTo('home')}><span>&lt;-</span> Back home</button><div className="auth-inner"><p className="kicker">Welcome to Roam</p><h1>{title}</h1><p className="auth-subtitle">{subtitle}</p><form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); onSubmit({ name: form.get('name'), email: form.get('email'), phone: form.get('phone'), password: form.get('password') }) }}>{showName && <label>Full name<input name="name" placeholder="Your name" required /></label>}{showName && <label>Phone number<input name="phone" type="tel" placeholder="+1 555 123 4567" required /></label>}<label>Email address<input name="email" type="email" placeholder="you@example.com" required /></label><label>Password<input name="password" type="password" placeholder="Enter your password" required /></label><button className="primary-button" type="submit">{submitLabel} <span>-&gt;</span></button></form><p className="switch-auth">{switchLabel} <button onClick={onSwitch}>{switchAction}</button></p></div></div></section>
}

export { AuthLayout }
export default Login
