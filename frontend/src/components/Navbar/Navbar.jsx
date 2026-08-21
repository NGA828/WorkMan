import { useState } from 'react'
import './Navbar.css'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return (
    <header className="navbar">
      <a className="brand" href="#home" onClick={close} aria-label="WorkMan home"><span className="brand-mark">W</span><span>workman<span className="brand-dot">.</span></span></a>
      <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Toggle navigation" aria-expanded={open}><span /><span /></button>
      <nav className={open ? 'nav-links is-open' : 'nav-links'}>
        <a href="#services" onClick={close}>Services</a><a href="#how-it-works" onClick={close}>How it works</a><a href="#about" onClick={close}>About us</a>
      </nav>
      <div className="nav-actions"><a className="login-link" href="/login">Log in</a><a className="button button-dark nav-cta" href="/register">Join WorkMan <span>↗</span></a></div>
    </header>
  )
}
