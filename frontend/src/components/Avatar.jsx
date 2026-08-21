import { initials } from '../utils/format'

const HUES = ['#c7d4ab', '#f1b5a5', '#d8c5b4', '#b9c9dd', '#e8d3a9', '#c9b8d8']

export default function Avatar({ name = '', size = 40, hue = null }) {
  const color = hue ?? HUES[(name || '?').length % HUES.length]
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, background: color, fontSize: Math.round(size * 0.38) }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}
