import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const close = () => setOpen(false)

  return (
    <header className="navbar">
      <Link className="brand" to="/" onClick={close} aria-label="WorkMan home">
        <span className="brand-mark">W</span>
        <span>
          workman<span className="brand-dot">.</span>
        </span>
      </Link>

      <button
        className="menu-toggle"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation"
        aria-expanded={open}
      >
        <span />
        <span />
      </button>

      <nav className={open ? 'nav-links is-open' : 'nav-links'}>
        <a href="#for-clients" onClick={close}>
          For clients
        </a>
        <a href="#for-technicians" onClick={close}>
          For technicians
        </a>
        <a href="#services" onClick={close}>
          Services
        </a>
        <a href="#about" onClick={close}>
          About us
        </a>
      </nav>

      <div className="nav-actions">
        {user ? (
          <Link className="button button-dark nav-cta" to="/dashboard">
            Open dashboard <span>↗</span>
          </Link>
        ) : (
          <>
            <Link className="login-link" to="/login">
              Log in
            </Link>
            <Link className="button button-dark nav-cta" to="/register">
              Join WorkMan <span>↗</span>
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
