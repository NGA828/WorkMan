import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import EmptyState from '../../components/EmptyState'
import Icon from '../../components/Icon'
import { BookingStatusBadge } from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { getBookings, getConversations, getFavorites, getTechnicians } from '../../services/api'
import { formatCurrency, formatDateTime } from '../../utils/format'
import './dashboard-pages.css'

export default function ClientHome() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [conversations, setConversations] = useState([])
  const [favorites, setFavorites] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    Promise.all([getBookings(), getConversations(), getFavorites(), getTechnicians()])
      .then(([bookingsRes, convRes, favRes, techRes]) => {
        if (!alive) return
        setBookings(bookingsRes.data.bookings?.data || [])
        setConversations(convRes.data.conversations || [])
        setFavorites(favRes.data.technicians || [])
        setTechnicians(techRes.data.technicians?.data || [])
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const nextBooking = useMemo(() => {
    const active = bookings.filter((booking) =>
      ['pending', 'accepted', 'in_progress', 'done'].includes(booking.status)
    )
    if (active.length === 0) return null
    return [...active].sort(
      (a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at)
    )[0]
  }, [bookings])

  const unread = conversations.reduce((sum, conversation) => sum + (conversation.unread_count || 0), 0)
  const completed = bookings.filter((booking) => booking.status === 'completed').length

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    )
  }

  const firstName = user?.name?.split(' ')[0] || ''

  return (
    <div>
      <div className="welcome-banner">
        <div>
          <span className="eyebrow">
            <span className="eyebrow-line" /> YOUR WORKMAN SPACE
          </span>
          <h2>
            Hey {firstName}.<br />
            <em>What&apos;s next?</em>
          </h2>
          <p>Your trusted local help, all in one place — search, book, chat and track from here.</p>
        </div>
        <div className="welcome-actions">
          <Link className="btn btn-lime" to="/dashboard/discover">
            <Icon name="search" size={16} /> Find a technician
          </Link>
          <Link className="btn btn-outline" to="/dashboard/messages">
            <Icon name="chat" size={16} /> Messages{unread > 0 ? ` (${unread})` : ''}
          </Link>
        </div>
      </div>

      <div className="stat-grid">
        <Link className="stat-card" to="/dashboard/bookings">
          <span className="stat-icon lime">
            <Icon name="calendar" size={19} />
          </span>
          <span>
            <b>{bookings.length}</b>
            <small>Total bookings</small>
          </span>
        </Link>
        <Link className="stat-card" to="/dashboard/bookings">
          <span className="stat-icon green">
            <Icon name="check" size={19} />
          </span>
          <span>
            <b>{completed}</b>
            <small>Completed jobs</small>
          </span>
        </Link>
        <Link className="stat-card" to="/dashboard/messages">
          <span className="stat-icon blue">
            <Icon name="chat" size={19} />
          </span>
          <span>
            <b>{unread}</b>
            <small>Unread messages</small>
          </span>
        </Link>
        <Link className="stat-card" to="/dashboard/favorites">
          <span className="stat-icon coral">
            <Icon name="heart" size={19} />
          </span>
          <span>
            <b>{favorites.length}</b>
            <small>Favorite technicians</small>
          </span>
        </Link>
      </div>

      <div className="grid-2">
        <section className="card home-card">
          <div className="section-title">
            <h3>Next booking</h3>
            <Link className="btn btn-ghost btn-sm" to="/dashboard/bookings">
              All bookings <Icon name="arrowRight" size={14} />
            </Link>
          </div>

          {nextBooking ? (
            <div className="next-booking">
              <div className="next-booking-top">
                <Avatar name={nextBooking.technician?.user?.name} size={44} />
                <div className="next-booking-meta">
                  <b>{nextBooking.technician?.user?.name}</b>
                  <small>{nextBooking.service?.name || 'Service'}</small>
                </div>
                <BookingStatusBadge status={nextBooking.status} />
              </div>
              <div className="next-booking-info">
                <span>
                  <Icon name="calendar" size={15} /> {formatDateTime(nextBooking.scheduled_at)}
                </span>
                {nextBooking.transport_fee > 0 && (
                  <span>
                    <Icon name="pin" size={15} /> Transport {formatCurrency(nextBooking.transport_fee)}
                  </span>
                )}
              </div>
              <Link className="btn btn-dark btn-sm" to="/dashboard/bookings">
                Manage booking <Icon name="arrowRight" size={14} />
              </Link>
            </div>
          ) : (
            <EmptyState
              icon="calendar"
              title="No bookings yet"
              text="Find a verified technician and send your first booking request."
            >
              <Link className="btn btn-dark" to="/dashboard/discover">
                Find a technician
              </Link>
            </EmptyState>
          )}
        </section>

        <section className="card home-card">
          <div className="section-title">
            <h3>Verified technicians near you</h3>
            <Link className="btn btn-ghost btn-sm" to="/dashboard/discover">
              See all <Icon name="arrowRight" size={14} />
            </Link>
          </div>

          {technicians.length === 0 ? (
            <EmptyState
              icon="users"
              title="No technicians yet"
              text="Verified professionals will appear here as they join WorkMan."
            />
          ) : (
            <div className="mini-list">
              {technicians.slice(0, 4).map((technician) => (
                <Link
                  className="mini-person"
                  to={`/dashboard/technicians/${technician.id}`}
                  key={technician.id}
                >
                  <Avatar name={technician.user?.name} size={36} />
                  <div>
                    <b>{technician.user?.name}</b>
                    <small>
                      {technician.services?.map((service) => service.name).join(' · ') ||
                        technician.services?.map((service) => service.category?.name).join(' · ') ||
                        'Professional'}
                    </small>
                  </div>
                  <span className="mini-rating">★ {technician.average_rating || '—'}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
