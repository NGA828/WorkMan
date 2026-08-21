import Icon from './Icon'

export default function StarRating({ value = 0, size = 14, interactive = false, onChange = null }) {
  const stars = [1, 2, 3, 4, 5]
  const rounded = Math.round((Number(value) || 0) * 2) / 2

  if (!interactive) {
    return (
      <span className="stars" style={{ fontSize: size }}>
        {stars.map((star) => (
          <span
            key={star}
            className={rounded >= star ? 'star filled' : rounded >= star - 0.5 ? 'star half' : 'star'}
          >
            ★
          </span>
        ))}
      </span>
    )
  }

  return (
    <span className="stars stars-interactive" style={{ fontSize: size }}>
      {stars.map((star) => (
        <button
          type="button"
          key={star}
          className={Number(value) >= star ? 'star filled' : 'star'}
          onClick={() => onChange && onChange(star)}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </span>
  )
}

export function RatingPill({ value, count }) {
  return (
    <span className="rating-pill-inline" title={`${value || 0} out of 5 from ${count || 0} reviews`}>
      <Icon name="star" size={12} strokeWidth={0} className="rating-pill-star" />
      <b>{value || '—'}</b>
      {count !== undefined && count !== null && <small>({count})</small>}
    </span>
  )
}
