import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import EmptyState from '../../components/EmptyState'
import Icon from '../../components/Icon'
import Modal from '../../components/Modal'
import StarRating from '../../components/StarRating'
import { BookingStatusBadge, PaymentStatusBadge } from '../../components/StatusBadge'
import {
  cancelBooking,
  confirmBooking,
  confirmPayment,
  createConversation,
  createPayment,
  getBookings,
} from '../../services/api'
import api from '../../services/api'
import { formatCurrency, formatDateTime } from '../../utils/format'
import './dashboard-pages.css'

const TABS = [
  ['', 'All'],
  ['pending', 'Pending'],
  ['accepted', 'Accepted'],
  ['in_progress', 'In progress'],
  ['done', 'Awaiting confirmation'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
  ['rejected', 'Rejected'],
]

const PROVIDERS = [
  ['mtn_momo', 'MTN Mobile Money'],
  ['orange_money', 'Orange Money'],
]

function ReviewForm({ bookingId, onDone }) {
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    if (!rating) {
      setError('Please choose a star rating.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await api.post('/reviews', { booking_id: bookingId, rating, body })
      onDone()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to submit this review.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="review-inline" onSubmit={submit}>
      <div className="review-inline-head">
        <b>How did it go?</b>
        <StarRating value={rating} size={24} interactive onChange={setRating} />
      </div>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Share a few words about the service…"
        rows={2}
      />
      {error && <div className="form-error">{error}</div>}
      <button className="btn btn-dark btn-sm" disabled={busy}>
        {busy ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  )
}

export default function Bookings() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [tab, setTab] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const [payBooking, setPayBooking] = useState(null)
  const [provider, setProvider] = useState('mtn_momo')
  const [payBusy, setPayBusy] = useState(false)
  const [payError, setPayError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    getBookings()
      .then((response) => setBookings(response.data.bookings?.data || []))
      .catch(() => setError('Unable to load your bookings.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const visible = useMemo(
    () => (tab ? bookings.filter((booking) => booking.status === tab) : bookings),
    [bookings, tab]
  )

  const run = async (id, action) => {
    setBusyId(id)
    setError('')
    try {
      await action()
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'That action could not be completed.')
    } finally {
      setBusyId(null)
    }
  }

  const cancel = (id) => run(id, () => cancelBooking(id))
  const confirm = (id) => run(id, () => confirmBooking(id))

  const messageTechnician = async (technicianProfileId) => {
    try {
      const { data } = await createConversation(technicianProfileId)
      navigate(`/dashboard/messages?conversation=${data.conversation.id}`)
    } catch {
      navigate('/dashboard/messages')
    }
  }

  const payTransport = async (event) => {
    event.preventDefault()
    setPayBusy(true)
    setPayError('')
    try {
      const { data } = await createPayment(payBooking.id, provider)
      // Simulated provider approval (in production this is the MoMo / OM webhook).
      await confirmPayment(data.payment.id)
      await load()
      setPayBooking(null)
    } catch (err) {
      setPayError(err.response?.data?.message || 'Unable to complete the transport payment.')
    } finally {
      setPayBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    )
  }

  const actionsFor = (booking) => {
    const paid = booking.transport_payment_status === 'paid'
    const actions = []

    if (booking.status === 'pending') {
      actions.push(
        <button
          key="cancel"
          className="btn btn-danger btn-sm"
          disabled={busyId === booking.id}
          onClick={() => cancel(booking.id)}
        >
          Cancel request
        </button>
      )
    }

    if (booking.status === 'accepted' && !paid) {
      actions.push(
        <button key="pay" className="btn btn-dark btn-sm" onClick={() => setPayBooking(booking)}>
          Pay transport fee
        </button>
      )
    }

    if (['accepted', 'in_progress'].includes(booking.status)) {
      actions.push(
        <Link key="track" className="btn btn-outline btn-sm" to={`/dashboard/tracking/${booking.id}`}>
          <Icon name="pin" size={14} /> Track technician
        </Link>
      )
    }

    if (booking.status === 'done') {
      actions.push(
        <button
          key="confirm"
          className="btn btn-lime btn-sm"
          disabled={busyId === booking.id}
          onClick={() => confirm(booking.id)}
        >
          <Icon name="check" size={14} /> Confirm completion
        </button>
      )
    }

    actions.push(
      <button
        key="chat"
        className="btn btn-ghost btn-sm"
        onClick={() => messageTechnician(booking.technician_profile_id)}
      >
        <Icon name="chat" size={14} /> Message
      </button>
    )

    return actions
  }

  return (
    <div>
      <div className="tabs">
        {TABS.map(([value, label]) => (
          <button
            key={value}
            className={tab === value ? 'tab active' : 'tab'}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

      {visible.length === 0 ? (
        <EmptyState
          icon="calendar"
          title={tab ? `No ${tab.replace('_', ' ')} bookings` : 'No bookings yet'}
          text="When you send a booking request, it will appear here with every action you need."
        >
          <Link className="btn btn-dark" to="/dashboard/discover">
            Find a technician
          </Link>
        </EmptyState>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {visible.map((booking) => (
            <article className="card booking-card" key={booking.id}>
              <div className="booking-card-top">
                <Avatar name={booking.technician?.user?.name} size={44} />
                <div className="booking-card-meta">
                  <b>{booking.technician?.user?.name}</b>
                  <small>{booking.service?.name || 'Service'}</small>
                </div>
                <BookingStatusBadge status={booking.status} />
              </div>

              <div className="booking-details">
                <span>
                  <Icon name="calendar" size={15} /> {formatDateTime(booking.scheduled_at)}
                </span>
                <span>
                  <Icon name="clock" size={15} /> {booking.duration_minutes} min
                </span>
                <span>
                  <Icon name="pin" size={15} />
                  Transport {formatCurrency(booking.transport_fee)}
                </span>
                <span>
                  <PaymentStatusBadge status={booking.transport_payment_status} />
                </span>
              </div>

              {booking.notes && <div className="booking-notes">{booking.notes}</div>}

              {booking.status === 'completed' && booking.review && (
                <div className="booking-notes" style={{ background: 'var(--green-soft)', color: '#4c7d2c' }}>
                  ✓ You rated this job ★ {booking.review.rating}
                </div>
              )}

              {booking.status === 'completed' && !booking.review && (
                <ReviewForm bookingId={booking.id} onDone={load} />
              )}

              {['accepted', 'in_progress', 'done'].includes(booking.status) &&
                booking.transport_payment_status === 'paid' && (
                  <div className="booking-notes" style={{ background: 'var(--green-soft)', color: '#4c7d2c' }}>
                    ✓ Transport fee paid through WorkMan
                  </div>
                )}

              <div className="booking-actions">{actionsFor(booking)}</div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(payBooking)}
        title="Pay transport fee"
        onClose={() => setPayBooking(null)}
        width={420}
      >
        {payBooking && (
          <form onSubmit={payTransport} style={{ display: 'grid', gap: 14 }}>
            <div className="next-booking-info">
              <span>
                <Icon name="pin" size={15} /> {payBooking.technician?.user?.name}
              </span>
              <span>
                <Icon name="calendar" size={15} /> {formatDateTime(payBooking.scheduled_at)}
              </span>
            </div>
            <p>
              Amount due: <b>{formatCurrency(payBooking.transport_fee)}</b> — paid through WorkMan
              before the technician travels. The service price itself is agreed after diagnosis.
            </p>
            <div className="field">
              <label>Payment provider</label>
              <select value={provider} onChange={(event) => setProvider(event.target.value)}>
                {PROVIDERS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {payError && <div className="form-error">{payError}</div>}
            <p className="results-count">
              Development note: provider confirmation is simulated locally.
            </p>
            <button className="btn btn-dark" disabled={payBusy}>
              {payBusy ? 'Processing payment…' : `Pay ${formatCurrency(payBooking.transport_fee)}`}
            </button>
          </form>
        )}
      </Modal>
    </div>
  )
}
