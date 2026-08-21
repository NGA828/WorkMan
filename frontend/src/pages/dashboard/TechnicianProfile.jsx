import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import EmptyState from '../../components/EmptyState'
import Icon from '../../components/Icon'
import Modal from '../../components/Modal'
import StarRating, { RatingPill } from '../../components/StarRating'
import {
  addFavorite,
  createBooking,
  createConversation,
  getFavorites,
  getTechnician,
  getTechnicianReviews,
  removeFavorite,
} from '../../services/api'
import { DAY_NAMES, formatCurrency, formatDate, formatHoursRow } from '../../utils/format'
import './dashboard-pages.css'

export default function TechnicianProfile() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [technician, setTechnician] = useState(null)
  const [reviews, setReviews] = useState([])
  const [favorite, setFavorite] = useState(false)
  const [loading, setLoading] = useState(true)

  const [bookOpen, setBookOpen] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [duration, setDuration] = useState(60)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [bookingMessage, setBookingMessage] = useState(null)
  const [bookingError, setBookingError] = useState(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    Promise.all([getTechnician(id), getTechnicianReviews(id), getFavorites()])
      .then(([techRes, reviewsRes, favRes]) => {
        if (!alive) return
        setTechnician(techRes.data.technician)
        setReviews(reviewsRes.data.reviews?.data || [])
        setFavorite((favRes.data.technicians || []).some((item) => item.id === Number(id)))
      })
      .catch(() => setTechnician(false))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [id])

  const services = useMemo(() => technician?.services || [], [technician])
  const locations = useMemo(() => technician?.locations || [], [technician])
  const workingHours = useMemo(() => {
    const rows = technician?.working_hours || []
    return DAY_NAMES.map((name, day) => ({
      name,
      row: rows.find((item) => Number(item.day_of_week) === day),
    }))
  }, [technician])

  const toggleFavorite = async () => {
    if (favorite) {
      await removeFavorite(id).catch(() => {})
      setFavorite(false)
    } else {
      await addFavorite(id).catch(() => {})
      setFavorite(true)
    }
  }

  const startChat = async () => {
    try {
      const { data } = await createConversation(id)
      navigate(`/dashboard/messages?conversation=${data.conversation.id}`)
    } catch {
      navigate('/dashboard/messages')
    }
  }

  const submitBooking = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setBookingError(null)
    setBookingMessage(null)
    try {
      await createBooking({
        technician_profile_id: id,
        service_id: services[0]?.id || null,
        scheduled_at: scheduledAt,
        duration_minutes: duration,
        notes,
      })
      setBookingMessage(
        'Booking request sent. The technician will review it and reply shortly — you can follow it from My bookings.'
      )
      setScheduledAt('')
      setNotes('')
    } catch (error) {
      setBookingError(error.response?.data?.message || 'Unable to send the booking request.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    )
  }

  if (!technician) {
    return (
      <EmptyState
        icon="eye"
        title="This profile is not available"
        text="The technician may have been removed or is not verified yet."
      >
        <Link className="btn btn-dark" to="/dashboard/discover">
          Back to search
        </Link>
      </EmptyState>
    )
  }

  return (
    <div>
      <div className="profile-hero">
        <Avatar name={technician.user?.name} size={84} />
        <div className="profile-hero-meta">
          <h2>{technician.user?.name}</h2>
          <span className="profile-verified">
            <Icon name="shield" size={13} /> Verified technician
          </span>
          <p>
            {technician.bio || 'This technician is ready to share more about their work.'}
          </p>
          <div className="profile-stat-row">
            <span>
              <b>
                <RatingPill value={technician.average_rating} count={technician.reviews_count} />
              </b>
              <small>Rating</small>
            </span>
            <span>
              <b>{technician.years_experience ?? '—'}</b>
              <small>Years experience</small>
            </span>
            <span>
              <b>{locations.map((location) => location.city).join(', ') || '—'}</b>
              <small>Service area</small>
            </span>
            <span>
              <b>{technician.is_available ? 'Available' : 'Unavailable'}</b>
              <small>Current status</small>
            </span>
          </div>
        </div>
        <div className="profile-actions">
          <button
            type="button"
            className={favorite ? 'fav-btn active' : 'fav-btn'}
            onClick={toggleFavorite}
            aria-label="Toggle favorite"
            title="Save to favorites"
          >
            <Icon name="heart" size={17} />
          </button>
          <button type="button" className="btn btn-outline" onClick={startChat}>
            <Icon name="chat" size={15} /> Chat
          </button>
          <button type="button" className="btn btn-dark" onClick={() => setBookOpen(true)}>
            <Icon name="calendar" size={15} /> Book
          </button>
        </div>
      </div>

      <div className="profile-grid">
        <section className="card profile-card">
          <h3>Services &amp; prices</h3>
          {services.length === 0 ? (
            <p className="results-count">No services listed yet.</p>
          ) : (
            services.map((service) => (
              <div className="service-row" key={service.id}>
                <div>
                  <b>{service.name}</b>
                  <small>{service.description}</small>
                </div>
                {service.starting_price && <b>{formatCurrency(service.starting_price)}+</b>}
              </div>
            ))
          )}
        </section>

        <section className="card profile-card">
          <h3>Working hours</h3>
          {workingHours.map(({ name, row }) => (
            <div className="hours-row" key={name}>
              <b>{name}</b>
              <span>{formatHoursRow(row)}</span>
            </div>
          ))}
        </section>

        <section className="card profile-card">
          <h3>Service areas</h3>
          <div className="tech-card-services">
            {locations.length === 0 ? (
              <p className="results-count">Service areas to be added.</p>
            ) : (
              locations.map((location) => (
                <span className="chip" key={location.id}>
                  <Icon name="pin" size={12} />
                  {location.city}
                  {location.neighborhood ? ` — ${location.neighborhood}` : ''}
                </span>
              ))
            )}
          </div>
        </section>

        <section className="card profile-card">
          <h3>Recent reviews</h3>
          {reviews.length === 0 ? (
            <p className="results-count">No reviews yet — be the first after your booking.</p>
          ) : (
            reviews.map((review) => (
              <div className="review-item" key={review.id}>
                <Avatar name={review.client?.name} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="review-item-head">
                    <b style={{ fontSize: 12.5 }}>{review.client?.name}</b>
                    <StarRating value={review.rating} size={12} />
                  </div>
                  {review.body && <p>{review.body}</p>}
                  <small>{formatDate(review.created_at)}</small>
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      <Modal
        open={bookOpen}
        title={`Book ${technician.user?.name}`}
        onClose={() => setBookOpen(false)}
      >
        <form onSubmit={submitBooking} style={{ display: 'grid', gap: 14 }}>
          <p>
            Send a booking request with your preferred date and time. The technician confirms
            availability and the transport fee is paid through WorkMan after acceptance.
          </p>
          <div className="field">
            <label>Preferred date and time</label>
            <input
              required
              type="datetime-local"
              value={scheduledAt}
              min={new Date().toISOString().slice(0, 16)}
              onChange={(event) => setScheduledAt(event.target.value)}
            />
          </div>
          <div className="field">
            <label>Duration</label>
            <select value={duration} onChange={(event) => setDuration(Number(event.target.value))}>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
              <option value={180}>3 hours</option>
            </select>
          </div>
          <div className="field">
            <label>What do you need help with?</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add a few details about the job…"
            />
          </div>
          {bookingError && <div className="form-error">{bookingError}</div>}
          {bookingMessage && <div className="success-message">{bookingMessage}</div>}
          <button className="btn btn-dark" disabled={submitting}>
            {submitting ? 'Sending request…' : 'Send booking request'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
