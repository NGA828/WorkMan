import { useEffect, useState } from 'react'
import EmptyState from '../../components/EmptyState'
import { BookingStatusBadge, PaymentStatusBadge } from '../../components/StatusBadge'
import { getAdminBookings } from '../../services/api'
import { formatDateTime } from '../../utils/format'
import './dashboard-pages.css'

export default function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminBookings()
      .then(({ data }) => setBookings(data.bookings?.data || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    )
  }

  if (bookings.length === 0) {
    return <EmptyState icon="calendar" title="No bookings yet" text="Platform bookings will appear here." />
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Booking</th>
            <th>Client</th>
            <th>Technician</th>
            <th>Service</th>
            <th>Scheduled</th>
            <th>Status</th>
            <th>Transport</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id}>
              <td>
                <b style={{ fontSize: 12.5 }}>#{booking.id}</b>
              </td>
              <td>{booking.client?.name}</td>
              <td>{booking.technician?.user?.name}</td>
              <td>{booking.service?.name || '—'}</td>
              <td>{formatDateTime(booking.scheduled_at)}</td>
              <td>
                <BookingStatusBadge status={booking.status} />
              </td>
              <td>
                <PaymentStatusBadge status={booking.transport_payment_status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
