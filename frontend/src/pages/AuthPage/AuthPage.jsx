import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Brand from '../../components/Brand'
import { useAuth } from '../../context/AuthContext'
import './AuthPage.css'

export default function AuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register'
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const [form, setForm] = useState({
    name: '',
    role: 'client',
    email: '',
    phone: '',
    city: '',
    password: '',
    password_confirmation: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value })

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        await register(form)
      } else {
        await login({ email: form.email, password: form.password })
      }
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <Link className="auth-back" to="/">
        ← Back to WorkMan
      </Link>

      <div className="auth-card">
        <div className="auth-brand">
          <Brand />
        </div>

        <div className="eyebrow">{isRegister ? 'Join the community' : 'Welcome back'}</div>
        <h1>
          {isRegister ? (
            <>
              Find your <em>people.</em>
            </>
          ) : (
            <>
              Good to see <em>you.</em>
            </>
          )}
        </h1>
        <p className="auth-sub">
          {isRegister
            ? 'Create an account and get trusted help closer to home.'
            : 'Log in to keep your local jobs moving.'}
        </p>

        <form onSubmit={submit}>
          {isRegister && (
            <>
              <label>
                Full name
                <input
                  required
                  value={form.name}
                  onChange={update('name')}
                  placeholder="Your name"
                />
              </label>

              <fieldset className="role-field">
                <legend>I&apos;m joining as a</legend>
                <div className="role-options">
                  <button
                    type="button"
                    className={form.role === 'client' ? 'role-option selected' : 'role-option'}
                    onClick={() => setForm({ ...form, role: 'client' })}
                  >
                    <b>Client</b>
                    <small>Find trusted help</small>
                  </button>
                  <button
                    type="button"
                    className={form.role === 'provider' ? 'role-option selected' : 'role-option'}
                    onClick={() => setForm({ ...form, role: 'provider' })}
                  >
                    <b>Technician</b>
                    <small>Offer your skills</small>
                  </button>
                </div>
              </fieldset>
            </>
          )}

          <label>
            Email address
            <input
              required
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="you@example.com"
            />
          </label>

          {isRegister && (
            <div className="auth-row">
              <label>
                Phone
                <input value={form.phone} onChange={update('phone')} placeholder="+237 6XX XXX XXX" />
              </label>
              <label>
                City
                <input value={form.city} onChange={update('city')} placeholder="Douala" />
              </label>
            </div>
          )}

          <label>
            Password
            <input
              required
              type="password"
              minLength={8}
              value={form.password}
              onChange={update('password')}
              placeholder="At least 8 characters"
            />
          </label>

          {isRegister && (
            <label>
              Confirm password
              <input
                required
                type="password"
                value={form.password_confirmation}
                onChange={update('password_confirmation')}
                placeholder="Repeat your password"
              />
            </label>
          )}

          {error && <div className="form-error">{error}</div>}

          <button className="btn btn-dark auth-submit" disabled={loading}>
            {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
            <span className="auth-submit-arrow">↗</span>
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? 'Already have an account?' : 'New to WorkMan?'}{' '}
          <Link to={isRegister ? '/login' : '/register'}>
            {isRegister ? 'Log in' : 'Create an account'}
          </Link>
        </p>
      </div>
    </main>
  )
}
