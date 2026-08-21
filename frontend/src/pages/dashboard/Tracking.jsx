import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import EmptyState from '../../components/EmptyState'
import Icon from '../../components/Icon'
import { BookingStatusBadge } from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { getBooking, getBookingLocation, updateBookingLocation } from '../../services/api'
import { formatDateTime, haversineKm, relativeTime } from '../../utils/format'
import './dashboard-pages.css'

// Demo map window around Douala, Cameroon.
const MAP = {
  latMin: 4.02,
  latMax: 4.08,
  lngMin: 9.68,
  lngMax: 9.73,
}

// The client's (approximate) destination point used for the demo map.
const DESTINATION = { latitude: 4.042, longitude: 9.701 }

// Simulated route the technician travels along while sharing location.
const ROUTE_START = { latitude: 4.0544, longitude: 9.6961 }

function project(lat, lng) {
  const x = ((lng - MAP.lngMin) / (MAP.lngMax - MAP.lngMin)) * 100
  const y = ((MAP.latMax - lat) / (MAP.latMax - MAP.latMin)) * 100
  return { left: `${Math.min(96, Math.max(4, x))}%`, top: `${Math.min(92, Math.max(8, y))}%` }
}

export default function Tracking() {
  const { bookingId } = useParams()
  const { isProvider } = useAuth()

  const [booking, setBooking] = useState(null)
  const [location, setLocation] = useState(null)
  const [sharing, setSharing] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const stepRef = useRef(0)

  const loadBooking = useCallback(() => {
    getBooking(bookingId)
      .then(({ data }) => setBooking(data.booking))
      .catch(() => setNotFound(true))
  }, [bookingId])

  const loadLocation = useCallback(() => {
    getBookingLocation(bookingId)
      .then(({ data }) => setLocation(data.location))
      .catch(() => {})
  }, [bookingId])

  useEffect(() => {
    loadBooking()
    loadLocation()
  }, [loadBooking, loadLocation])

  // Client: poll the technician's position while the page is open.
  useEffect(() => {
    if (isProvider) return undefined
    const timer = setInterval(loadLocation, 4000)
    return () => clearInterval(timer)
  }, [isProvider, loadLocation])

  const pushLocation = async (coords) => {
    try {
      const { data } = await updateBookingLocation(bookingId, coords)
      setLocation(data.location)
    } catch {
      setSharing(false)
    }
  }

  // Technician: simulate the journey in small steps, one position per 2.5s.
  useEffect(() => {
    if (!sharing || !isProvider) return undefined

    const timer = setInterval(() => {
      stepRef.current += 1
      const progress = Math.min(stepRef.current / 36, 1)
      const jitter = (Math.random() - 0.5) * 0.002
      const coords = {
        latitude: ROUTE_START.latitude + (DESTINATION.latitude - ROUTE_START.latitude) * progress + jitter,
        longitude: ROUTE_START.longitude + (DESTINATION.longitude - ROUTE_START.longitude) * progress + jitter,
      }
      pushLocation(coords)
      if (progress >= 1) setSharing(false)
    }, 2500)

    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharing, isProvider])

  const startSharing = () => {
    stepRef.current = 0
    setSharing(true)
    pushLocation(ROUTE_START)
  }

  if (notFound) {
    return (
      <EmptyState
        icon="pin"
        title="Booking not found"
        text="This booking may belong to another account."
      >
        <Link className="btn btn-dark" to="/dashboard/bookings">
          Back to bookings
        </Link>
      </EmptyState>
    )
  }

  if (!booking) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    )
  }

  const hasLocation = Boolean(location)
  const distance = hasLocation
    ? haversineKm(location.latitude, location.longitude, DESTINATION.latitude, DESTINATION.longitude)
    : null

  const markerPos = hasLocation ? project(Number(location.latitude), Number(location.longitude)) : null
  const homePos = project(DESTINATION.latitude, DESTINATION.longitude)

  return (
    <div className="tracking-layout">
      <section className="map-panel">
        <div className="map-grid" />
        <div className="map-road h" />
        <div className="map-road v" />

        {homePos && (
          <div className="map-marker home" style={{ left: homePos.left, top: homePos.top }}>
            <span className="map-marker-pin">
              <Icon name="home" size={14} />
            </span>
            <span className="map-marker-label">
              {isProvider ? 'Client' : 'Your location'}
            </span>
          </div>
        )}

        {markerPos && (
          <div className="map-marker" style={{ left: markerPos.left, top: markerPos.top }}>
            <span className="map-marker-pin">
              <Icon name="wrench" size={14} />
            </span>
            <span className="map-marker-label">{booking.technician?.user?.name?.split(' ')[0]}</span>
          </div>
        )}

        <div className="map-badge">
          {hasLocation ? (
            <>
              <b>{distance ? `${distance.toFixed(1)} km away` : 'Arriving…'}</b>
              <small>Updated {relativeTime(location.recorded_at)}</small>
            </>
          ) : (
            <>
              <b>No live position yet</b>
              <small>Location appears when the technician shares it.</small>
            </>
          )}
        </div>
      </section>

      <aside className="tracking-side">
        <section className="card booking-card">
          <div className="booking-card-top">
            <Avatar name={booking.technician?.user?.name} size={40} />
            <div className="booking-card-meta">
              <b>{isProvider ? booking.client?.name : booking.technician?.user?.name}</b>
              <small>{booking.service?.name || 'Service'}</small>
            </div>
            <BookingStatusBadge status={booking.status} />
          </div>

          <div className="booking-details">
            <span>
              <Icon name="calendar" size={15} /> {formatDateTime(booking.scheduled_at)}
            </span>
          </div>

          <div className="booking-actions">
            {isProvider ? (
              <>
                {['accepted', 'in_progress'].includes(booking.status) && (
                  <button
                    className={sharing ? 'btn btn-outline btn-sm' : 'btn btn-dark btn-sm'}
                    onClick={sharing ? () => setSharing(false) : startSharing}
                  >
                    <Icon name="pin" size={14} />
                    {sharing ? 'Stop sharing' : 'Share my location'}
                  </button>
                )}
                <Link className="btn btn-ghost btn-sm" to="/dashboard/jobs">
                  Back to job requests
                </Link>
              </>
            ) : (
              <Link className="btn btn-outline btn-sm" to="/dashboard/bookings">
                Back to bookings
              </Link>
            )}
          </div>

          <p className="results-count">
            GPS tracking gives the client confidence that the technician is really travelling to
            the appointment. The technician&apos;s position is shared only for accepted bookings.
          </p>
        </section>
      </aside>
    </div>
  )
}
