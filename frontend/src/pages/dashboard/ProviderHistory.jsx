import { useEffect, useMemo, useState } from 'react'
import Avatar from '../../components/Avatar'
import EmptyState from '../../components/EmptyState'
import Icon from '../../components/Icon'
import StarRating from '../../components/StarRating'
import { BookingStatusBadge } from '../../components/StatusBadge'
import { getBookings } from '../../services/api'
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format'
import './dashboard-pages.css'

export default function ProviderHistory() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getBookings()
      .then((response) => setBookings(response.data.bookings?.data || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false))
  }, [])

  const history = useMemo(
    () =>
      bookings
        .filter((booking) => ['completed', 'cancelled', 'rejected'].includes(booking.status))
        .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at)),
    [bookings]
  )

  const stats = useMemo(() => {
    const completed = history.filter((booking) => booking.status === 'completed')
    const ratings = completed
      .map((booking) => booking.review?.rating)
      .filter(Boolean)
    const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null
    return { completed: completed.length, cancelled: history.filter((b) => b.status === 'cancelled').length, avg }
  }, [history])

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div>
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <span className="stat-card">
          <span className="stat-icon green">
            <Icon name="check" size={19} />
          </span>
          <span>
            <b>{stats.completed}</b>
            <small>Completed jobs</small>
          </span>
        </span>
        <span className="stat-card">
          <span className="stat-icon gold">
            <Icon name="star" size={19} />
          </span>
          <span>
            <b>{stats.avg ? stats.avg.toFixed(1) : '—'}</b>
            <small>Avg. rating received</small>
          </span>
        </span>
        <span className="stat-card">
          <span className="stat-icon coral">
            <Icon name="x" size={19} />
          </span>
          <span>
            <b>{stats.cancelled}</b>
            <small>Cancelled / rejected</small>
          </span>
        </span>
      </div>

      {history.length === 0 ? (
        <EmptyState
          icon="clock"
          title="No service history yet"
          text="Completed and past jobs will appear here once you start working with clients."
        />
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {history.map((booking) => (
            <article className="card booking-card" key={booking.id}>
              <div className="booking-card-top">
                <Avatar name={booking.client?.name} size={44} />
                <div className="booking-card-meta">
                  <b>{booking.client?.name}</b>
                  <small>{booking.service?.name || 'Service'}</small>
                </div>
                <BookingStatusBadge status={booking.status} />
              </div>

              <div className="booking-details">
                <span>
                  <Icon name="calendar" size={15} /> {formatDateTime(booking.scheduled_at)}
                </span>
                {booking.transport_fee > 0 && (
                  <span>
                    <Icon name="pin" size={15} /> Transport {formatCurrency(booking.transport_fee)}
                  </span>
                )}
              </div>

              {booking.review && (
                <div
                  className="booking-notes"
                  style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                >
                  <StarRating value={booking.review.rating} size={13} />
                  {booking.review.body && (
                    <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                      "{booking.review.body}"
                    </span>
                  )}
                  <small style={{ marginLeft: 'auto', color: 'var(--muted)' }}>
                    {formatDate(booking.review.created_at)}
                  </small>
                </div>
              )}

              {booking.status === 'completed' && !booking.review && (
                <div className="booking-notes" style={{ color: 'var(--muted)' }}>
                  No review left by client.
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
