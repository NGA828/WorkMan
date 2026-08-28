import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import EmptyState from '../../components/EmptyState'
import Icon from '../../components/Icon'
import { RatingPill } from '../../components/StarRating'
import { useToast } from '../../context/useToast'
import { createConversation, getFavorites, removeFavorite } from '../../services/api'
import './dashboard-pages.css'

export default function Favorites() {
  const toast = useToast()
  const navigate = useNavigate()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [chatId, setChatId] = useState(null)

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
      toast.info('Removed from your favorites.')
    } catch {
      toast.error('Could not update your favorites. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  const startChat = async (technicianId) => {
    setChatId(technicianId)
    try {
      const { data } = await createConversation(technicianId)
      navigate(`/dashboard/messages?conversation=${data.conversation.id}`)
    } catch {
      toast.error('Could not open the conversation. Please try again.')
      navigate('/dashboard/messages')
    } finally {
      setChatId(null)
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
      {favorites.map((technician, index) => (
        <article
          className="tech-card animate-rise"
          key={technician.id}
          style={{ animationDelay: `${Math.min(index, 12) * 50}ms` }}
        >
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
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => startChat(technician.id)}
              disabled={chatId === technician.id}
            >
              <Icon name="chat" size={13} /> {chatId === technician.id ? 'Opening…' : 'Chat'}
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}
