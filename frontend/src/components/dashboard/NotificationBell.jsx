import { useEffect, useRef, useState } from 'react'
import { getNotifications, markNotificationsRead } from '../../services/api'
import { relativeTime } from '../../utils/format'
import Icon from '../Icon'
import './NotificationBell.css'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const panelRef = useRef(null)

  const load = async () => {
    try {
      const { data } = await getNotifications()
      setNotifications(data.notifications || [])
      setUnread(data.unread_count || 0)
    } catch {
      // Notifications are best-effort; never block the UI.
    }
  }

  useEffect(() => {
    load()
    const timer = setInterval(load, 30000)
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

  return (
    <div className="bell" ref={panelRef}>
      <button className="bell-trigger" onClick={() => setOpen(!open)} aria-label="Notifications">
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
                <div key={item.id} className={`bell-item ${item.read_at ? '' : 'unread'}`}>
                  <span className="bell-dot" />
                  <div>
                    <p>{item.data?.message || 'WorkMan notification'}</p>
                    <small>{relativeTime(item.created_at)}</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
