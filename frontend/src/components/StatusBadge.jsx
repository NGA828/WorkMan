import { BOOKING_STATUSES, PAYMENT_STATUSES, VERIFICATION_STATUSES } from '../utils/format'

export function BookingStatusBadge({ status }) {
  const meta = BOOKING_STATUSES[status] || { label: status, badge: 'badge-grey' }
  return <span className={`badge ${meta.badge}`}>{meta.label}</span>
}

export function PaymentStatusBadge({ status }) {
  const meta = PAYMENT_STATUSES[status] || { label: status, badge: 'badge-grey' }
  return <span className={`badge ${meta.badge}`}>{meta.label}</span>
}

export function VerificationBadge({ status }) {
  const meta = VERIFICATION_STATUSES[status] || { label: status, badge: 'badge-grey' }
  return <span className={`badge ${meta.badge}`}>{meta.label}</span>
}
