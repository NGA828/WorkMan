import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import EmptyState from '../../components/EmptyState'
import Icon from '../../components/Icon'
import { RatingPill } from '../../components/StarRating'
import { getFavorites, removeFavorite } from '../../services/api'
import './dashboard-pages.css'

export default function Favorites() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    getFavorites()
      .then((response) => setFavorites(response.data.technicians || []))
      .catch(() => setFavorites([]))
      .finally(() => setLoading(false))
  }, [])

  const unfavorite = async (id) => {
    setBusyId(id)
    try {
      await removeFavorite(id)
      setFavorites((list) => list.filter((technician) => technician.id !== id))
    } catch {
      // Ignore — keep the current list.
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

  if (favorites.length === 0) {
    return (
      <EmptyState
        icon="heart"
        title="No favorites yet"
        text="Tap the heart on a technician's card to save them here for later."
      >
        <Link className="btn btn-dark" to="/dashboard/discover">
          Browse technicians
        </Link>
      </EmptyState>
    )
  }

  return (
    <div className="discover-grid">
      {favorites.map((technician) => (
        <article className="tech-card" key={technician.id}>
          <div className="tech-card-top">
            <Avatar name={technician.user?.name} size={46} />
            <div className="tech-card-meta">
              <b>{technician.user?.name}</b>
              <small>
                <Icon name="shield" size={12} /> Verified technician
              </small>
            </div>
            <button
              type="button"
              className="fav-btn active"
              onClick={() => unfavorite(technician.id)}
              disabled={busyId === technician.id}
              aria-label="Remove from favorites"
              title="Remove from favorites"
            >
              <Icon name="heart" size={15} />
            </button>
          </div>

          <div className="tech-card-services">
            {(technician.services || []).map((service) => (
              <span className="chip" key={service.id}>
                {service.name}
              </span>
            ))}
          </div>

          <div className="tech-card-stats">
            <RatingPill value={technician.average_rating} count={technician.reviews_count} />
            <span>
              <Icon name="pin" size={13} />
              {(technician.locations || []).map((location) => location.city).join(', ') || '—'}
            </span>
          </div>

          <div className="tech-card-footer">
            <Link className="btn btn-dark btn-sm" to={`/dashboard/technicians/${technician.id}`}>
              View profile <Icon name="arrowRight" size={13} />
            </Link>
            <Link className="btn btn-ghost btn-sm" to={`/dashboard/messages`}>
              <Icon name="chat" size={13} /> Chat
            </Link>
          </div>
        </article>
      ))}
    </div>
  )
}
