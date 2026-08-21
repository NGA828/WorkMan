export function formatCurrency(amount, currency = 'XAF') {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return '—'
  const value = Number(amount).toLocaleString('en-US')
  const label = currency === 'XAF' ? 'FCFA' : currency
  return `${value} ${label}`
}

export function formatDate(value, options = {}) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  })
}

export function formatTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function formatDateTime(value) {
  if (!value) return '—'
  return `${formatDate(value)}, ${formatTime(value)}`
}

export function relativeTime(value) {
  if (!value) return '—'
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} d ago`
  return formatDate(value)
}

export function initials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function formatHoursRow(row) {
  if (!row || !row.is_available) return 'Closed'
  const start = row.starts_at ? row.starts_at.slice(0, 5) : null
  const end = row.ends_at ? row.ends_at.slice(0, 5) : null
  if (!start || !end) return 'Open'
  return `${start} – ${end}`
}

export const BOOKING_STATUSES = {
  pending: { label: 'Pending', badge: 'badge-gold' },
  accepted: { label: 'Accepted', badge: 'badge-blue' },
  in_progress: { label: 'In progress', badge: 'badge-blue' },
  done: { label: 'Awaiting confirmation', badge: 'badge-gold' },
  rejected: { label: 'Rejected', badge: 'badge-red' },
  cancelled: { label: 'Cancelled', badge: 'badge-grey' },
  completed: { label: 'Completed', badge: 'badge-green' },
}

export const VERIFICATION_STATUSES = {
  pending: { label: 'Pending', badge: 'badge-gold' },
  approved: { label: 'Verified', badge: 'badge-green' },
  rejected: { label: 'Rejected', badge: 'badge-red' },
}

export const PAYMENT_STATUSES = {
  unpaid: { label: 'Unpaid', badge: 'badge-grey' },
  paid: { label: 'Paid', badge: 'badge-green' },
}

export function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
