import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import EmptyState from '../../components/EmptyState'
import Icon from '../../components/Icon'
import { RatingPill } from '../../components/StarRating'
import { addFavorite, getCategories, getFavorites, getTechnicians, removeFavorite } from '../../services/api'
import './dashboard-pages.css'

export default function Discover() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyFavorite, setBusyFavorite] = useState(null)

  const filters = useMemo(
    () => ({
      q: searchParams.get('q') || '',
      city: searchParams.get('city') || '',
      category: searchParams.get('category') || '',
      min_rating: searchParams.get('min_rating') || '',
      available: searchParams.get('available') === '1',
    }),
    [searchParams]
  )

  const search = useCallback(() => {
    setLoading(true)
    getTechnicians({
      q: filters.q || undefined,
      city: filters.city || undefined,
      category: filters.category || undefined,
      min_rating: filters.min_rating || undefined,
      available: filters.available ? 1 : undefined,
    })
      .then((response) => setItems(response.data.technicians?.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => {
    search()
  }, [search])

  useEffect(() => {
    getCategories().then((response) => setCategories(response.data.categories || [])).catch(() => {})
    getFavorites().then((response) => setFavorites(response.data.technicians || [])).catch(() => {})
  }, [])

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value === '' || value === false || value === null) next.delete(key)
    else next.set(key, value)
    setSearchParams(next, { replace: true })
  }

  const favoriteIds = useMemo(() => new Set(favorites.map((technician) => technician.id)), [favorites])

  const toggleFavorite = async (technicianId, isFavorite) => {
    setBusyFavorite(technicianId)
    try {
      if (isFavorite) {
        await removeFavorite(technicianId)
        setFavorites((list) => list.filter((technician) => technician.id !== technicianId))
      } else {
        await addFavorite(technicianId)
        const { data } = await getFavorites()
        setFavorites(data.technicians || [])
      }
    } catch {
      // Silent — the button simply stays in its previous state.
    } finally {
      setBusyFavorite(null)
    }
  }

  const availabilityLabel = (technician) => {
    if (!technician.is_available) return 'Unavailable'
    if (filters.available) return 'Available today'
    return 'Available now'
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <span className="eyebrow">
            <span className="eyebrow-line" /> FIND YOUR MATCH
          </span>
          <h2>
            Good help, <em>right here.</em>
          </h2>
          <p>Search verified local professionals by name, service or city — then chat, book and track from your dashboard.</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="field">
          <input
            value={filters.q}
            onChange={(event) => setFilter('q', event.target.value)}
            placeholder="What do you need?"
            aria-label="Search"
          />
        </div>
        <div className="field">
          <input
            value={filters.city}
            onChange={(event) => setFilter('city', event.target.value)}
            placeholder="City or neighborhood"
            aria-label="City"
          />
        </div>
        <div className="field">
          <select
            value={filters.category}
            onChange={(event) => setFilter('category', event.target.value)}
            aria-label="Service category"
          >
            <option value="">All services</option>
            {categories.map((category) => (
              <option value={category.id} key={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <select
            value={filters.min_rating}
            onChange={(event) => setFilter('min_rating', event.target.value)}
            aria-label="Minimum rating"
          >
            <option value="">Any rating</option>
            <option value="4.5">4.5 ★ and up</option>
            <option value="4">4 ★ and up</option>
            <option value="3">3 ★ and up</option>
          </select>
        </div>
        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={filters.available}
            onChange={(event) => setFilter('available', event.target.checked ? '1' : '')}
          />
          Available now
        </label>
      </div>

      <p className="results-count">
        {loading ? 'Searching…' : `${items.length} verified professional${items.length === 1 ? '' : 's'} found`}
      </p>

      {loading ? (
        <div className="page-loader">
          <div className="spinner" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="search"
          title="No professionals found yet"
          text="Try another service or location. New verified professionals appear here as they join WorkMan."
        />
      ) : (
        <div className="discover-grid">
          {items.map((technician) => (
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
                  className={favoriteIds.has(technician.id) ? 'fav-btn active' : 'fav-btn'}
                  onClick={() => toggleFavorite(technician.id, favoriteIds.has(technician.id))}
                  disabled={busyFavorite === technician.id}
                  aria-label="Toggle favorite"
                  title="Save to favorites"
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
                {(technician.services || []).length === 0 && <span className="chip">Services coming soon</span>}
              </div>

              <div className="tech-card-stats">
                <RatingPill value={technician.average_rating} count={technician.reviews_count} />
                <span>
                  <Icon name="pin" size={13} />
                  {(technician.locations || []).map((location) => location.city).join(', ') || 'Location to be added'}
                </span>
                <span>
                  <Icon name="clock" size={13} />
                  {availabilityLabel(technician)}
                </span>
              </div>

              <div className="tech-card-footer">
                <Link className="btn btn-dark btn-sm" to={`/dashboard/technicians/${technician.id}`}>
                  View profile <Icon name="arrowRight" size={13} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
