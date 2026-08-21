import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <Link className="brand footer-brand" to="/" aria-label="WorkMan home">
          <span className="brand-mark">W</span>
          <span>
            workman<span className="brand-dot">.</span>
          </span>
        </Link>
        <p>Good work, closer to home.</p>
        <div className="footer-links">
          <a href="#about">About</a>
          <a href="mailto:hello@workman.local">Contact</a>
          <a href="#home">Terms</a>
          <a href="#home">Privacy</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 WorkMan. Made for better days.</span>
        <span>
          Built around your neighborhood <i>✦</i>
        </span>
      </div>
    </footer>
  )
}
