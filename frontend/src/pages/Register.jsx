import { AuthLayout } from './Login'

function Register({ goTo, onSubmit }) {
  return <AuthLayout title="Start wandering." subtitle="Create an account and make your next trip yours." submitLabel="Create account" switchLabel="Already have an account?" switchAction="Log in" onSwitch={() => goTo('login')} goTo={goTo} onSubmit={onSubmit} showName />
}

export default Register
