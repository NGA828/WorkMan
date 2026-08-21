import { useCallback, useEffect, useState } from 'react'
import Avatar from '../../components/Avatar'
import EmptyState from '../../components/EmptyState'
import Icon from '../../components/Icon'
import StarRating from '../../components/StarRating'
import { deleteReview, getAdminReviews } from '../../services/api'
import { formatDate } from '../../utils/format'
import './dashboard-pages.css'

export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    getAdminReviews()
      .then(({ data }) => setReviews(data.reviews?.data || []))
      .catch(() => setError('Unable to load reviews.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const remove = async (id) => {
    setBusyId(id)
    setError('')
    try {
      await deleteReview(id)
      setReviews((list) => list.filter((review) => review.id !== id))
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to remove the review.')
    } finally {
      setBusyId(null)
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
      <div className="page-head">
        <div>
          <span className="eyebrow">
            <span className="eyebrow-line" /> TRUST & MODERATION
          </span>
          <h2>
            Watch the <em>reviews.</em>
          </h2>
          <p>Remove inappropriate or fraudulent reviews to keep ratings honest.</p>
        </div>
      </div>

      {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

      {reviews.length === 0 ? (
        <EmptyState icon="star" title="No reviews yet" text="Reviews appear here as completed jobs get rated." />
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {reviews.map((review) => (
            <article className="card booking-card" key={review.id}>
              <div className="booking-card-top">
                <Avatar name={review.client?.name} size={40} />
                <div className="booking-card-meta">
                  <b>
                    {review.client?.name} → {review.technician?.user?.name}
                  </b>
                  <small>
                    Booking #{review.booking_id} · {formatDate(review.created_at)}
                  </small>
                </div>
                <StarRating value={review.rating} size={15} />
              </div>
              {review.body && <div className="booking-notes">{review.body}</div>}
              <div className="booking-actions">
                <button
                  className="btn btn-danger btn-sm"
                  disabled={busyId === review.id}
                  onClick={() => remove(review.id)}
                >
                  <Icon name="trash" size={13} /> Remove review
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
