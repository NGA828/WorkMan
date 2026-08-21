import { Link } from 'react-router-dom'

export default function Brand({ to = '/', small = false }) {
  return (
    <Link to={to} className={small ? 'brand brand-small' : 'brand'} aria-label="WorkMan home">
      <span className="brand-mark">W</span>
      <span>
        workman<span className="brand-dot">.</span>
      </span>
    </Link>
  )
}
