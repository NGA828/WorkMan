import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import ConfirmDialog from '../../components/ConfirmDialog'
import EmptyState from '../../components/EmptyState'
import Icon from '../../components/Icon'
import Modal from '../../components/Modal'
import ReportIssueModal from '../../components/ReportIssueModal'
import StarRating from '../../components/StarRating'
import { BookingStatusBadge, PaymentStatusBadge } from '../../components/StatusBadge'
import { useToast } from '../../context/useToast'
import {
  cancelBooking,
  clearBooking,
  confirmBooking,
  confirmPayment,
  createConversation,
  createPayment,
  getBookings,
  getPayments,
  releaseTransport,
} from '../../services/api'
import api from '../../services/api'
import { formatCurrency, formatDateTime, formatDate } from '../../utils/format'
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
  ['payments', 'Payments'],
]

const PAYMENT_TYPES = {
  transport_fee: 'Transport fee',
}

function PaymentHistory({ payments, loading }) {
  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <EmptyState
        icon="doc"
        title="No payments yet"
        text="Transport fees you pay through WorkMan will be recorded here. Only the transport fee is paid on the platform — service and material costs are settled directly with the technician after diagnosis."
      >
        <Link className="btn btn-dark" to="/dashboard/discover">
          Find a technician
        </Link>
      </EmptyState>
    )
  }

  const totalPaid = payments
    .filter((payment) => payment.status === 'paid')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="stat-grid" style={{ marginBottom: 4 }}>
        <span className="stat-card">
          <span className="stat-icon green">
            <Icon name="check" size={19} />
          </span>
          <span>
            <b>{payments.filter((p) => p.status === 'paid').length}</b>
            <small>Payments made</small>
          </span>
        </span>
        <span className="stat-card">
          <span className="stat-icon gold">
            <Icon name="doc" size={19} />
          </span>
          <span>
            <b>{formatCurrency(totalPaid)}</b>
            <small>Total transport paid</small>
          </span>
        </span>
      </div>

      {payments.map((payment) => (
        <article className="card booking-card" key={payment.id}>
          <div className="booking-card-top">
            <span className="stat-icon blue" style={{ width: 40, height: 40 }}>
              <Icon name="doc" size={18} />
            </span>
            <div className="booking-card-meta">
              <b>{PAYMENT_TYPES[payment.purpose] || 'Payment'}</b>
              <small>
                Ref {payment.reference} · {payment.provider === 'mtn_momo' ? 'MTN MoMo' : payment.provider === 'orange_money' ? 'Orange Money' : 'WorkMan'}
              </small>
            </div>
            <span className={`badge ${['paid', 'released'].includes(payment.status) ? 'badge-green' : 'badge-gold'}`}>
              {payment.status === 'held' ? 'Held in escrow' : payment.status === 'released' ? 'Released' : payment.status === 'paid' ? 'Paid' : 'Pending'}
            </span>
          </div>

          <div className="booking-details">
            <span>
              <Icon name="pin" size={15} /> {formatCurrency(payment.amount, payment.currency || 'XAF')}
            </span>
            {payment.booking?.scheduled_at && (
              <span>
                <Icon name="calendar" size={15} /> Appointment {formatDate(payment.booking.scheduled_at)}
              </span>
            )}
            {payment.paid_at && (
              <span>
                <Icon name="check" size={15} /> Paid {formatDate(payment.paid_at)}
              </span>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}

const PROVIDERS = [
  ['mtn_momo', 'MTN Mobile Money'],
  ['orange_money', 'Orange Money'],
]

function ReviewForm({ bookingId, onDone }) {
  const toast = useToast()
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
      toast.success(`Thanks! Your ${rating}-star review was submitted.`)
      onDone()
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to submit this review.'
      setError(message)
      toast.error(message)
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
  const toast = useToast()
  const [bookings, setBookings] = useState([])
  const [tab, setTab] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [bookingToClear, setBookingToClear] = useState(null)

  const [payBooking, setPayBooking] = useState(null)
  const [payPurpose, setPayPurpose] = useState('transport_fee')
  const [provider, setProvider] = useState('mtn_momo')
  const [phone, setPhone] = useState('')
  const [payBusy, setPayBusy] = useState(false)
  const [payError, setPayError] = useState('')

  const [payments, setPayments] = useState([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)

  const [reportBooking, setReportBooking] = useState(null)

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

  // Load payment history only when the Payments tab is opened (and once after
  // a payment is completed so the new record shows immediately).
  const loadPayments = useCallback(() => {
    setPaymentsLoading(true)
    getPayments()
      .then((response) => setPayments(response.data.payments?.data || []))
      .catch(() => setPayments([]))
      .finally(() => setPaymentsLoading(false))
  }, [])

  useEffect(() => {
    if (tab === 'payments') loadPayments()
  }, [tab, loadPayments])

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
      const message = err.response?.data?.message || 'That action could not be completed.'
      setError(message)
      toast.error(message)
    } finally {
      setBusyId(null)
    }
  }

  const cancel = (id) =>
    run(id, async () => {
      await cancelBooking(id)
      toast.success('Booking request cancelled.')
    })

  const clear = async () => {
    setError('')
    const id = bookingToClear.id
    setBusyId(id)
    try {
      await clearBooking(id)
      setBookings((list) => list.filter((booking) => booking.id !== id))
      toast.success('Booking cleared from your history.')
      setBookingToClear(null)
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to clear this booking.'
      setError(message)
      toast.error(message)
    } finally {
      setBusyId(null)
    }
  }
  const confirm = (id) =>
    run(id, async () => {
      await confirmBooking(id)
      toast.success('Completion confirmed — thanks for using WorkMan!')
    })

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
    if (!phone.trim()) {
      setPayError('Enter the mobile money phone number to continue.')
      return
    }
    setPayBusy(true)
    setPayError('')
    try {
      const { data } = await createPayment(payBooking.id, provider, phone.trim(), payPurpose)
      // Simulated provider approval (in production this is the MoMo / OM webhook).
      await confirmPayment(data.payment.id)
      await load()
      loadPayments()
      setPayBooking(null)
      setPhone('')
      toast.success(payPurpose === 'transport_fee'
        ? 'Transport fee paid and held in escrow.'
        : 'Service payment completed successfully.')
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to complete the transport payment.'
      setPayError(message)
      toast.error(message)
    } finally {
      setPayBusy(false)
    }

  }

  const release = (booking) =>
    run(booking.id, async () => {
      await releaseTransport(booking.id)
      toast.success('Transport payment released to the technician.')
    })

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    )
  }

  const actionsFor = (booking) => {
    const transportReleased = booking.transport_payment_status === 'released'
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

    if (['accepted', 'done'].includes(booking.status) && booking.transport_payment_status === 'unpaid') {
      actions.push(
        <button key="pay" className="btn btn-dark btn-sm" onClick={() => { setPayPurpose('transport_fee'); setPayBooking(booking) }}>
          Pay transport fee
        </button>
      )
    }

    if (booking.status === 'accepted' && booking.transport_payment_status === 'held') {
      actions.push(
        <button key="release" className="btn btn-lime btn-sm" onClick={() => release(booking)}>
          Release transport payment
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
      const paymentRequired = Number(booking.transport_fee || 0) > 0 && !transportReleased
      actions.push(
        <button
          key="confirm"
          className="btn btn-lime btn-sm"
          disabled={busyId === booking.id || paymentRequired}
          onClick={() => confirm(booking.id)}
          title={paymentRequired ? 'Pay the transport fee first.' : undefined}
        >
          <Icon name="check" size={14} /> Confirm completion
        </button>
      )
      if (paymentRequired) {
        actions.push(
          <span key="payment-required" className="results-count" style={{ padding: 8 }}>
            Pay the transport fee before confirming completion.
          </span>
        )
      }

    }

    if (['completed', 'cancelled', 'rejected'].includes(booking.status)) {
      if (booking.status === 'completed' && booking.service_payment_status !== 'paid') {
        actions.push(
          booking.service?.starting_price > 0 ? (
            <button
              key="service-pay"
              className="btn btn-dark btn-sm"
              onClick={() => {
                setPayPurpose('service_fee')
                setPayBooking(booking)
              }}
            >
              Pay service fee
            </button>
          ) : (
            <span key="service-price-missing" className="results-count" style={{ padding: 8 }}>
              The technician has not configured a service fee yet.
            </span>
          )
        )
      }

      actions.push(
        <button
          key="clear"
          className="btn btn-ghost btn-sm"
          disabled={busyId === booking.id}
          onClick={() => setBookingToClear(booking)}
        >
          <Icon name="x" size={14} /> Clear booking
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

    actions.push(
      <button
        key="report"
        className="btn btn-ghost btn-sm"
        style={{ color: 'var(--red)' }}
        onClick={() => setReportBooking(booking)}
      >
        <Icon name="bell" size={14} /> Report issue
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

      {tab === 'payments' ? (
        <PaymentHistory payments={payments} loading={paymentsLoading} />
      ) : visible.length === 0 ? (
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
          {visible.map((booking, index) => (
            <article
              className="card booking-card animate-rise"
              key={booking.id}
              style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
            >
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
              {booking.attachment_path && (
                <div className="booking-notes" style={{ background: 'var(--blue-soft)' }}>
                  <a href={`/storage/${booking.attachment_path}`} target="_blank" rel="noreferrer">
                    View uploaded photo or video
                  </a>
                </div>
              )}
              {(booking.service_city || booking.service_address) && (
                <div className="booking-notes" style={{ background: 'var(--blue-soft)' }}>
                  <b>Service location</b>
                  <br />
                  {[booking.service_address, booking.service_city].filter(Boolean).join(', ')}
                </div>
              )}

              {booking.status === 'completed' && booking.review && (
                <div className="booking-notes" style={{ background: 'var(--green-soft)', color: '#4c7d2c' }}>
                  ✓ You rated this job ★ {booking.review.rating}
                </div>
              )}

              {booking.status === 'completed' && !booking.review && (
                <ReviewForm bookingId={booking.id} onDone={load} />
              )}

              {['accepted', 'in_progress', 'done'].includes(booking.status) &&
                ['held', 'released'].includes(booking.transport_payment_status) && (
                  <div className="booking-notes" style={{ background: booking.transport_payment_status === 'held' ? 'var(--gold-soft)' : 'var(--green-soft)', color: '#4c7d2c' }}>
                    {booking.transport_payment_status === 'held'
                      ? '✓ Transport fee paid and held in escrow — release it when the technician arrives.'
                      : '✓ Transport fee released to the technician.'}
                  </div>
                )}

              <div className="booking-actions">{actionsFor(booking)}</div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(payBooking)}
        title={payPurpose === 'transport_fee' ? 'Pay transport fee' : 'Pay service fee'}
        onClose={() => {
          setPayBooking(null)
          setPayPurpose('transport_fee')
          setPhone('')
          setPayError('')
        }}
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
              Amount due:{' '}
              <b>
                {formatCurrency(
                  payPurpose === 'transport_fee'
                    ? payBooking.transport_fee
                    : payBooking.service?.starting_price
                )}
              </b>{' '}
              — paid through WorkMan.
            </p>
            <p className="results-count">
              {payPurpose === 'transport_fee'
                ? 'The transport fee will be held in escrow until you release it after the technician arrives.'
                : 'This service payment is based on the technician’s listed starting price.'}
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
            <div className="field">
              <label htmlFor="payment-phone">Mobile money phone number</label>
              <input
                id="payment-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="e.g. 6 70 00 00 00"
                required
              />
            </div>
            {payError && <div className="form-error">{payError}</div>}
            <p className="results-count">
              Development note: provider confirmation is simulated locally.
            </p>
            <button className="btn btn-dark" disabled={payBusy}>
              {payBusy ? (
                <>
                  <span className="btn-spinner" /> Processing payment…
                </>
              ) : (
                `Pay ${formatCurrency(payPurpose === 'transport_fee' ? payBooking.transport_fee : payBooking.service?.starting_price)}`
              )}
            </button>
          </form>
        )}
      </Modal>

      <ReportIssueModal
        open={Boolean(reportBooking)}
        onClose={() => setReportBooking(null)}
        reportedUserId={reportBooking?.technician?.user?.id ?? reportBooking?.technician?.user_id}
        bookingId={reportBooking?.id}
      />
      <ConfirmDialog
        open={Boolean(bookingToClear)}
        title="Clear booking?"
        message="Are you sure you want to clear this booking from your history?"
        busy={busyId !== null}
        confirmLabel="Clear booking"
        onCancel={() => setBookingToClear(null)}
        onConfirm={clear}
      />
    </div>
  )
}
