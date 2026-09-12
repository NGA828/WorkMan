import 'leaflet/dist/leaflet.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Link, useParams } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import EmptyState from '../../components/EmptyState'
import Icon from '../../components/Icon'
import { BookingStatusBadge } from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/useToast'
import {
  getBooking,
  getBookingLocation,
  stopBookingLocation,
  updateBookingLocation,
} from '../../services/api'
import { formatDateTime, haversineKm, relativeTime } from '../../utils/format'
import './dashboard-pages.css'

const technicianIcon = L.divIcon({
  className: 'tracking-marker tracking-marker-technician',
  html: '<span>🔧</span>',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
})

const clientIcon = L.divIcon({
  className: 'tracking-marker tracking-marker-client',
  html: '<span>🏠</span>',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
})

function FitMapToMarkers({ points }) {
  const map = useMap()

  useEffect(() => {
    if (points.length === 1) {
      map.setView(points[0], 15)
    } else if (points.length > 1) {
      map.fitBounds(points, { padding: [45, 45], maxZoom: 16 })
    }
  }, [map, points])

  return null
}

function TrackingMap({ technicianPosition, clientPosition, isProvider, technicianName }) {
  const displayPositions = useMemo(() => {
    if (!technicianPosition || !clientPosition) {
      return { technician: technicianPosition, client: clientPosition }
    }

    const sameLocation =
      Math.abs(technicianPosition.latitude - clientPosition.latitude) < 0.0002 &&
      Math.abs(technicianPosition.longitude - clientPosition.longitude) < 0.0002

    if (!sameLocation) {
      return { technician: technicianPosition, client: clientPosition }
    }

    // Keep both markers visible when GPS reports the same location.
    const offset = 0.00018
    return {
      technician: {
        latitude: technicianPosition.latitude + offset,
        longitude: technicianPosition.longitude - offset,
      },
      client: {
        latitude: clientPosition.latitude - offset,
        longitude: clientPosition.longitude + offset,
      },
    }
  }, [technicianPosition, clientPosition])

  const points = useMemo(
    () => [displayPositions.technician, displayPositions.client]
      .filter(Boolean)
      .map(({ latitude, longitude }) => [latitude, longitude]),
    [displayPositions]
  )
  const center = points[0] || [4.0511, 9.7679]

  return (
    <MapContainer className="tracking-map" center={center} zoom={13} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitMapToMarkers points={points} />
      {displayPositions.client && (
        <>
          <Marker position={[displayPositions.client.latitude, displayPositions.client.longitude]} icon={clientIcon}>
            <Popup>{isProvider ? 'Client location' : 'Your location'}</Popup>
          </Marker>
          <CircleMarker
            center={[clientPosition.latitude, clientPosition.longitude]}
            radius={18}
            pathOptions={{ color: '#4d7ec9', fillColor: '#4d7ec9', fillOpacity: 0.12 }}
          />
        </>
      )}
      {displayPositions.technician && (
        <Marker position={[displayPositions.technician.latitude, displayPositions.technician.longitude]} icon={technicianIcon}>
          <Popup>{isProvider ? 'Your location' : `${technicianName} location`}</Popup>
        </Marker>
      )}
    </MapContainer>
  )
}

export default function Tracking() {
  const { bookingId } = useParams()
  const { isProvider } = useAuth()
  const toast = useToast()
  const [booking, setBooking] = useState(null)
  const [location, setLocation] = useState(null)
  const [sharing, setSharing] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [permissionMessage, setPermissionMessage] = useState('')
  const sharingRef = useRef(false)

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

  useEffect(() => {
    const timer = setInterval(loadLocation, 4000)
    return () => clearInterval(timer)
  }, [loadLocation])

  const shareCurrentPosition = useCallback(() => {
    if (!sharingRef.current) return

    if (!navigator.geolocation) {
      setPermissionMessage('This browser does not support location sharing.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        if (!sharingRef.current) return
        try {
          const { data } = await updateBookingLocation(bookingId, {
            latitude: coords.latitude,
            longitude: coords.longitude,
          })
          if (!sharingRef.current) return
          setLocation(data.location)
          setPermissionMessage('')
        } catch (error) {
          if (!sharingRef.current) return
          sharingRef.current = false
          setSharing(false)
          const message =
            error.response?.data?.message ||
            'Could not share your location. Please check your connection and try again.'
          setPermissionMessage(message)
          toast.error(message)
        }
      },
      (error) => {
        if (!sharingRef.current) return
        sharingRef.current = false
        setSharing(false)
        const message =
          error.code === 1
            ? 'Location permission was denied. Allow location access in your browser settings and try again.'
            : error.code === 2
              ? 'Your location is unavailable. Check your device location settings and try again.'
              : 'Location lookup timed out. Check your connection and try again.'
        setPermissionMessage(message)
        toast.error(message)
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    )
  }, [bookingId, toast])

  useEffect(() => {
    if (!sharing) return undefined
    const timer = setInterval(shareCurrentPosition, 5000)
    return () => clearInterval(timer)
  }, [sharing, shareCurrentPosition])

  const toggleSharing = async () => {
    if (sharing) {
      sharingRef.current = false
      setSharing(false)
      try {
        const { data } = await stopBookingLocation(bookingId)
        setLocation(data.location)
        toast.info('Location sharing stopped.')
      } catch (error) {
        const message =
          error.response?.data?.message || 'Location sharing stopped locally, but could not clear the server location.'
        setPermissionMessage(message)
        toast.error(message)
      }
      return
    }

    if (!navigator.geolocation) {
      setPermissionMessage('This browser does not support location sharing.')
      return
    }

    // Start the first request from the click handler so browsers can show the
    // location permission prompt as a direct user-initiated action.
    setPermissionMessage('')
    sharingRef.current = true
    setSharing(true)
    shareCurrentPosition()
  }

  if (notFound) {
    return (
      <EmptyState icon="pin" title="Booking not found" text="This booking may belong to another account.">
        <Link className="btn btn-dark" to="/dashboard/bookings">Back to bookings</Link>
      </EmptyState>
    )
  }

  if (!booking) {
    return <div className="page-loader"><div className="spinner" /></div>
  }

  const technicianPosition = location?.latitude != null && location?.longitude != null
    ? { latitude: Number(location.latitude), longitude: Number(location.longitude) }
    : null
  const clientPosition = location?.client_latitude != null && location?.client_longitude != null
    ? { latitude: Number(location.client_latitude), longitude: Number(location.client_longitude) }
    : null
  const distance = technicianPosition && clientPosition
    ? haversineKm(technicianPosition.latitude, technicianPosition.longitude, clientPosition.latitude, clientPosition.longitude)
    : null

  return (
    <div className="tracking-layout">
      <section className="map-panel">
        <TrackingMap
          technicianPosition={technicianPosition}
          clientPosition={clientPosition}
          isProvider={isProvider}
          technicianName={booking.technician?.user?.name}
        />
        <div className="map-badge">
          {distance !== null ? (
            <><b>{distance.toFixed(1)} km apart</b><small>Both locations are visible and updating</small></>
          ) : isProvider && clientPosition ? (
            <><b>Client location available</b><small>Client updated {relativeTime(location.client_recorded_at)}</small></>
          ) : !isProvider && technicianPosition ? (
            <><b>Technician location available</b><small>Technician updated {relativeTime(location.recorded_at)}</small></>
          ) : (
            <><b>Waiting for locations</b><small>Share your location to show it to the other participant.</small></>
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
            <span><Icon name="calendar" size={15} /> {formatDateTime(booking.scheduled_at)}</span>
            {booking.service_address && <span><Icon name="pin" size={15} /> {booking.service_address}, {booking.service_city}</span>}
          </div>
          <div className="booking-actions">
            {['accepted', 'in_progress'].includes(booking.status) && (
              <button
                className={sharing ? 'btn btn-outline btn-sm' : 'btn btn-dark btn-sm'}
                onClick={toggleSharing}
              >
                <Icon name="pin" size={14} /> {sharing ? 'Stop sharing' : 'Share my location'}
              </button>
            )}
            <Link className="btn btn-ghost btn-sm" to={isProvider ? '/dashboard/jobs' : '/dashboard/bookings'}>Back</Link>
          </div>
          {permissionMessage && <div className="form-error">{permissionMessage}</div>}
          <p className="results-count">The map uses your device GPS and the technician&apos;s shared GPS position. Location sharing is available only for accepted bookings.</p>
        </section>
      </aside>
    </div>
  )
}
