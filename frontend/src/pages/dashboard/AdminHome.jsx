import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'
import { getAdminSummary } from '../../services/api'
import './dashboard-pages.css'

const LINKS = [
  ['/dashboard/verification', 'shield', 'Verify technicians'],
  ['/dashboard/users', 'users', 'Manage users'],
  ['/dashboard/categories', 'grid', 'Service categories'],
  ['/dashboard/platform-bookings', 'calendar', 'Monitor bookings'],
  ['/dashboard/reviews', 'star', 'Moderate reviews'],
]

export default function AdminHome() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminSummary()
      .then(({ data }) => setSummary(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    )
  }

  const stats = [
    ['users', 'Total users', 'users', 'blue'],
    ['clients', 'Clients', 'user', 'grey'],
    ['technicians', 'Technicians', 'wrench', 'lime'],
    ['pending_verification', 'Pending verification', 'shield', 'gold'],
    ['approved_technicians', 'Approved pros', 'check', 'green'],
    ['categories', 'Categories', 'grid', 'coral'],
    ['bookings', 'Bookings', 'calendar', 'blue'],
    ['reviews', 'Reviews', 'star', 'gold'],
  ]

  return (
    <div>
      <div className="welcome-banner">
        <div>
          <span className="eyebrow">
            <span className="eyebrow-line" /> ADMIN SPACE
          </span>
          <h2>
            Keep good work<br />
            <em>moving.</em>
          </h2>
          <p>Platform overview and quality control — verification, categories, bookings and reports.</p>
        </div>
        <div className="welcome-actions">
          <Link className="btn btn-lime" to="/dashboard/verification">
            <Icon name="shield" size={16} /> Review technicians
          </Link>
        </div>
      </div>

      <div className="stat-grid">
        {stats.map(([key, label, icon, tone]) => (
          <div className="stat-card" key={key}>
            <span className={`stat-icon ${tone}`}>
              <Icon name={icon} size={19} />
            </span>
            <span>
              <b>{summary?.[key] ?? '—'}</b>
              <small>{label}</small>
            </span>
          </div>
        ))}
      </div>

      <div className="section-title">
        <h3>Administration</h3>
      </div>

      <div className="discover-grid">
        {LINKS.map(([to, icon, label]) => (
          <Link className="tech-card" to={to} key={to}>
            <div className="tech-card-top">
              <span className="stat-icon lime" style={{ width: 42, height: 42 }}>
                <Icon name={icon} size={19} />
              </span>
              <div className="tech-card-meta">
                <b>{label}</b>
                <small>Open the workspace</small>
              </div>
            </div>
            <div className="tech-card-footer">
              <span className="results-count">Open</span>
              <Icon name="arrowRight" size={15} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
