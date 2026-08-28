import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getNotifications, markNotificationsRead } from '../../services/api'
import { relativeTime } from '../../utils/format'
import Icon from '../Icon'
import './NotificationBell.css'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [ringing, setRinging] = useState(false)
  const panelRef = useRef(null)
  const prevUnread = useRef(0)
  const navigate = useNavigate()
  const { isProvider } = useAuth()

  const load = async () => {
    try {
      const { data } = await getNotifications()
      const next = data.notifications || []
      const nextUnread = data.unread_count || 0
      setNotifications(next)
      // Ring the bell when new unread notifications arrive (not on first load).
      if (nextUnread > prevUnread.current && prevUnread.current > 0) {
        setRinging(true)
        setTimeout(() => setRinging(false), 750)
      }
      prevUnread.current = nextUnread
      setUnread(nextUnread)
    } catch {
      // Notifications are best-effort; never block the UI.
    }
  }

  useEffect(() => {
    load()
    const timer = setInterval(load, 15000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const onClick = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const markRead = async () => {
    setUnread(0)
    setNotifications((list) => list.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })))
    try {
      await markNotificationsRead()
    } catch {
      // Ignore — state already optimistically updated.
    }
  }

  // Jump to the relevant page when a notification is clicked.
  const openNotification = (item) => {
    if (!item.read_at) {
      setNotifications((list) =>
        list.map((n) => (n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n))
      )
      setUnread((count) => Math.max(0, count - 1))
      markNotificationsRead().catch(() => {})
    }
    const type = item.type || ''
    const data = item.data || {}
    setOpen(false)
    if (type.startsWith('message') && data.conversation_id) {
      navigate(`/dashboard/messages?conversation=${data.conversation_id}`)
    } else if (type.startsWith('booking') || type.startsWith('payment') || type.startsWith('review')) {
      navigate(isProvider ? '/dashboard/jobs' : '/dashboard/bookings')
    }
  }

  return (
    <div className="bell" ref={panelRef}>
      <button
        className={`bell-trigger ${ringing ? 'ringing' : ''}`}
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
      >
        <Icon name="bell" size={19} />
        {unread > 0 && <span className="bell-count">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="bell-panel">
          <div className="bell-head">
            <b>Notifications</b>
            {unread > 0 && (
              <button type="button" onClick={markRead}>
                Mark all read
              </button>
            )}
          </div>
          <div className="bell-list">
            {notifications.length === 0 ? (
              <p className="bell-empty">Nothing new for now.</p>
            ) : (
              notifications.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`bell-item ${item.read_at ? '' : 'unread'}`}
                  onClick={() => openNotification(item)}
                >
                  <span className="bell-dot" />
                  <div>
                    <p>{item.data?.message || 'WorkMan notification'}</p>
                    <small>{relativeTime(item.created_at)}</small>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
