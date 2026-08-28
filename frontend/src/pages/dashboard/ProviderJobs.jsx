import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import EmptyState from '../../components/EmptyState'
import Icon from '../../components/Icon'
import Modal from '../../components/Modal'
import ReportIssueModal from '../../components/ReportIssueModal'
import { BookingStatusBadge, PaymentStatusBadge } from '../../components/StatusBadge'
import { useToast } from '../../context/useToast'
import { getBookings, updateBookingStatus } from '../../services/api'
import { formatCurrency, formatDateTime } from '../../utils/format'
import './dashboard-pages.css'

const TABS = [
  ['', 'All'],
  ['pending', 'Pending'],
  ['accepted', 'Accepted'],
  ['in_progress', 'In progress'],
  ['done', 'Awaiting confirmation'],
  ['completed', 'Completed'],
]

export default function ProviderJobs() {
  const toast = useToast()
  const [bookings, setBookings] = useState([])
  const [tab, setTab] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const [acceptBooking, setAcceptBooking] = useState(null)
  const [transportFee, setTransportFee] = useState('')
  const [acceptBusy, setAcceptBusy] = useState(false)
  const [acceptError, setAcceptError] = useState('')

  const [reportBooking, setReportBooking] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getBookings()
      .then((response) => setBookings(response.data.bookings?.data || []))
      .catch(() => setError('Unable to load job requests.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const visible = useMemo(
    () => (tab ? bookings.filter((booking) => booking.status === tab) : bookings),
    [bookings, tab]
  )

  const STATUS_TOAST = {
    rejected: 'Booking declined. The client has been notified.',
    in_progress: 'Job started — the client can now track your location.',
    done: 'Work marked as finished. Waiting for the client to confirm.',
  }

  const run = async (id, payload) => {
    setBusyId(id)
    setError('')
    try {
      await updateBookingStatus(id, payload)
      await load()
      if (STATUS_TOAST[payload.status]) toast.success(STATUS_TOAST[payload.status])
    } catch (err) {
      const message = err.response?.data?.message || 'That action could not be completed.'
      setError(message)
      toast.error(message)
    } finally {
      setBusyId(null)
    }
  }

  const accept = async (event) => {
    event.preventDefault()
    setAcceptBusy(true)
    setAcceptError('')
    try {
      await updateBookingStatus(acceptBooking.id, {
        status: 'accepted',
        transport_fee: transportFee || null,
      })
      await load()
      setAcceptBooking(null)
      toast.success('Booking accepted. The client has been notified and can pay the transport fee.')
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to accept the booking.'
      setAcceptError(message)
      toast.error(message)
    } finally {
      setAcceptBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    )
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

      {error && (
        <div className="form-error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState
          icon="briefcase"
          title="No job requests here"
          text="When a client books you, the request appears here so you can accept or decline it."
        >
          <Link className="btn btn-dark" to="/dashboard/profile-setup">
            Make sure my profile is complete
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
                <span>
                  <Icon name="clock" size={15} /> {booking.duration_minutes} min
                </span>
                <span>
                  <Icon name="pin" size={15} /> Transport {formatCurrency(booking.transport_fee)}
                </span>
                <span>
                  <PaymentStatusBadge status={booking.transport_payment_status} />
                </span>
              </div>

              {booking.notes && <div className="booking-notes">{booking.notes}</div>}

              <div className="booking-actions">
                {booking.status === 'pending' && (
                  <>
                    <button
                      className="btn btn-dark btn-sm"
                      disabled={busyId === booking.id}
                      onClick={() => {
                        setTransportFee('')
                        setAcceptError('')
                        setAcceptBooking(booking)
                      }}
                    >
                      <Icon name="check" size={14} /> Accept
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={busyId === booking.id}
                      onClick={() => run(booking.id, { status: 'rejected' })}
                    >
                      Reject
                    </button>
                  </>
                )}

                {booking.status === 'accepted' && (
                  <button
                    className="btn btn-dark btn-sm"
                    disabled={busyId === booking.id}
                    onClick={() => run(booking.id, { status: 'in_progress' })}
                  >
                    Start job
                  </button>
                )}

                {booking.status === 'in_progress' && (
                  <button
                    className="btn btn-lime btn-sm"
                    disabled={busyId === booking.id}
                    onClick={() => run(booking.id, { status: 'done' })}
                  >
                    <Icon name="check" size={14} /> Mark work done
                  </button>
                )}

                {['accepted', 'in_progress'].includes(booking.status) && (
                  <Link className="btn btn-outline btn-sm" to={`/dashboard/tracking/${booking.id}`}>
                    <Icon name="pin" size={14} /> Share location
                  </Link>
                )}

                {booking.status === 'done' && (
                  <span className="results-count" style={{ padding: 8 }}>
                    Waiting for the client to confirm completion…
                  </span>
                )}

                {booking.status === 'completed' && (
                  <span className="results-count" style={{ padding: 8 }}>
                    {booking.transport_payment_status === 'paid'
                      ? '✓ Job completed and transport paid.'
                      : '✓ Job completed.'}
                  </span>
                )}

                <Link className="btn btn-ghost btn-sm" to="/dashboard/messages">
                  <Icon name="chat" size={14} /> Message client
                </Link>

                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--red)' }}
                  onClick={() => setReportBooking(booking)}
                >
                  <Icon name="bell" size={14} /> Report issue
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(acceptBooking)}
        title={`Accept request from ${acceptBooking?.client?.name || ''}`}
        onClose={() => setAcceptBooking(null)}
        width={420}
      >
        {acceptBooking && (
          <form onSubmit={accept} style={{ display: 'grid', gap: 14 }}>
            <p>
              Set the transport fee the client will pay through WorkMan before you travel. The
              service price itself is agreed after diagnosis.
            </p>
            <div className="field">
              <label>Transport fee (FCFA)</label>
              <input
                type="number"
                min="0"
                step="100"
                value={transportFee}
                onChange={(event) => setTransportFee(event.target.value)}
                placeholder="e.g. 1500"
              />
            </div>
            {acceptError && <div className="form-error">{acceptError}</div>}
            <button className="btn btn-dark" disabled={acceptBusy}>
              {acceptBusy ? 'Accepting…' : 'Accept booking'}
            </button>
          </form>
        )}
      </Modal>

      <ReportIssueModal
        open={Boolean(reportBooking)}
        onClose={() => setReportBooking(null)}
        reportedUserId={reportBooking?.client?.id}
        bookingId={reportBooking?.id}
      />
    </div>
  )
}
