import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import Icon from '../../components/Icon'
import { BookingStatusBadge } from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { getBookings, getProfile, setProviderAvailability } from '../../services/api'
import { formatCurrency, formatDateTime } from '../../utils/format'
import './dashboard-pages.css'

export default function ProviderHome() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  const load = async () => {
    try {
      const [profileRes, bookingsRes] = await Promise.all([getProfile(), getBookings()])
      setProfile(profileRes.data.profile)
      setBookings(bookingsRes.data.bookings?.data || [])
    } catch {
      // Handled by the auth layer.
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const toggleAvailability = async () => {
    setToggling(true)
    try {
      const next = !profile?.is_available
      const { data } = await setProviderAvailability(next)
      setProfile(data.profile)
    } catch {
      // Keep current state.
    } finally {
      setToggling(false)
    }
  }

  const stats = useMemo(() => {
    const pending = bookings.filter((booking) => booking.status === 'pending')
    const upcoming = bookings
      .filter((booking) => ['accepted', 'in_progress'].includes(booking.status))
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
    return { pending, upcoming }
  }, [bookings])

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    )
  }

  const firstName = user?.name?.split(' ')[0] || ''

  return (
    <div>
      <div className="welcome-banner">
        <div>
          <span className="eyebrow">
            <span className="eyebrow-line" /> TECHNICIAN SPACE
          </span>
          <h2>
            Hey {firstName}.<br />
            <em>Your next client.</em>
          </h2>
          <p>Manage requests, keep your schedule fresh and grow your reputation — all from here.</p>
        </div>
        <div className="welcome-actions">
          <Link className="btn btn-lime" to="/dashboard/profile-setup">
            <Icon name="wrench" size={16} /> Edit my profile
          </Link>
          <Link className="btn btn-outline" to="/dashboard/jobs" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.35)' }}>
            <Icon name="briefcase" size={16} /> Job requests
          </Link>
        </div>
      </div>

      {profile?.verification_status === 'pending' && (
        <div className="verification-banner pending">
          <Icon name="shield" size={20} />
          <div>
            <b>Your verification is pending</b>
            You are not visible to clients until an administrator approves your ID and profile.
            Make sure your profile is complete to speed things up.
          </div>
        </div>
      )}

      {profile?.verification_status === 'rejected' && (
        <div className="verification-banner rejected">
          <Icon name="shield" size={20} />
          <div>
            <b>Your verification was rejected</b>
            Review your profile information and contact the platform administrator for guidance.
          </div>
        </div>
      )}

      {profile?.verification_status === 'approved' && (
        <div className="verification-banner approved">
          <Icon name="shield" size={20} />
          <div>
            <b>You are verified ✓</b>
            Clients can find you in search results. Keep your availability up to date to get more requests.
          </div>
        </div>
      )}

      <div className="availability-row">
        <div>
          <b>Available for new requests</b>
          <small>{profile?.is_available ? 'You appear in client search results.' : 'Clients cannot book you right now.'}</small>
        </div>
        <button
          type="button"
          className={profile?.is_available ? 'switch on' : 'switch'}
          onClick={toggleAvailability}
          disabled={toggling}
          aria-label="Toggle availability"
          role="switch"
          aria-checked={Boolean(profile?.is_available)}
        />
      </div>

      <div className="stat-grid" style={{ marginTop: 18 }}>
        <Link className="stat-card" to="/dashboard/jobs">
          <span className="stat-icon coral">
            <Icon name="bell" size={19} />
          </span>
          <span>
            <b>{stats.pending.length}</b>
            <small>Pending requests</small>
          </span>
        </Link>
        <Link className="stat-card" to="/dashboard/jobs">
          <span className="stat-icon blue">
            <Icon name="calendar" size={19} />
          </span>
          <span>
            <b>{stats.upcoming.length}</b>
            <small>Upcoming jobs</small>
          </span>
        </Link>
        <span className="stat-card">
          <span className="stat-icon gold">
            <Icon name="star" size={19} />
          </span>
          <span>
            <b>{profile?.average_rating || '—'}</b>
            <small>Your rating</small>
          </span>
        </span>
        <span className="stat-card">
          <span className="stat-icon green">
            <Icon name="check" size={19} />
          </span>
          <span>
            <b>{profile?.reviews_count || 0}</b>
            <small>Reviews</small>
          </span>
        </span>
      </div>

      <div className="grid-2">
        <section className="card home-card">
          <div className="section-title">
            <h3>Pending requests</h3>
            <Link className="btn btn-ghost btn-sm" to="/dashboard/jobs">
              Manage <Icon name="arrowRight" size={14} />
            </Link>
          </div>
          {stats.pending.length === 0 ? (
            <p className="results-count">No pending requests right now.</p>
          ) : (
            stats.pending.slice(0, 3).map((booking) => (
              <div className="mini-person" key={booking.id}>
                <Avatar name={booking.client?.name} size={36} />
                <div>
                  <b>{booking.client?.name}</b>
                  <small>
                    {booking.service?.name || 'Service'} · {formatDateTime(booking.scheduled_at)}
                  </small>
                </div>
                <BookingStatusBadge status={booking.status} />
              </div>
            ))
          )}
        </section>

        <section className="card home-card">
          <div className="section-title">
            <h3>Next jobs</h3>
            <Link className="btn btn-ghost btn-sm" to="/dashboard/jobs">
              All jobs <Icon name="arrowRight" size={14} />
            </Link>
          </div>
          {stats.upcoming.length === 0 ? (
            <p className="results-count">No upcoming jobs yet.</p>
          ) : (
            stats.upcoming.slice(0, 3).map((booking) => (
              <div className="mini-person" key={booking.id}>
                <Avatar name={booking.client?.name} size={36} />
                <div>
                  <b>{booking.client?.name}</b>
                  <small>
                    {formatDateTime(booking.scheduled_at)} ·{' '}
                    {booking.transport_fee ? `Transport ${formatCurrency(booking.transport_fee)}` : 'Transport to be set'}
                  </small>
                </div>
                <BookingStatusBadge status={booking.status} />
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  )
}
