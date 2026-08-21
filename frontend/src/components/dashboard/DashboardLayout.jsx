import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../Avatar'
import Icon from '../Icon'
import NotificationBell from './NotificationBell'
import './DashboardLayout.css'

const CLIENT_NAV = [
  { to: '/dashboard', end: true, icon: 'home', label: 'Overview' },
  { to: '/dashboard/discover', icon: 'search', label: 'Find a technician' },
  { to: '/dashboard/bookings', icon: 'calendar', label: 'My bookings' },
  { to: '/dashboard/favorites', icon: 'heart', label: 'Favorites' },
  { to: '/dashboard/messages', icon: 'chat', label: 'Messages' },
  { to: '/dashboard/settings', icon: 'settings', label: 'Settings' },
]

const PROVIDER_NAV = [
  { to: '/dashboard', end: true, icon: 'home', label: 'Overview' },
  { to: '/dashboard/jobs', icon: 'briefcase', label: 'Job requests' },
  { to: '/dashboard/messages', icon: 'chat', label: 'Messages' },
  { to: '/dashboard/profile-setup', icon: 'wrench', label: 'My profile' },
]

const ADMIN_NAV = [
  { to: '/dashboard', end: true, icon: 'home', label: 'Overview' },
  { to: '/dashboard/verification', icon: 'shield', label: 'Verification' },
  { to: '/dashboard/users', icon: 'users', label: 'Users' },
  { to: '/dashboard/categories', icon: 'grid', label: 'Categories' },
  { to: '/dashboard/platform-bookings', icon: 'calendar', label: 'Bookings' },
  { to: '/dashboard/reviews', icon: 'star', label: 'Reviews' },
]

const TITLES = {
  '/dashboard': { title: 'Overview', sub: 'Everything at a glance' },
  '/dashboard/discover': { title: 'Find a technician', sub: 'Search verified local professionals' },
  '/dashboard/bookings': { title: 'My bookings', sub: 'Requests, appointments and history' },
  '/dashboard/favorites': { title: 'Favorites', sub: 'Technicians you saved' },
  '/dashboard/messages': { title: 'Messages', sub: 'Private conversations' },
  '/dashboard/settings': { title: 'Settings', sub: 'Your personal information' },
  '/dashboard/jobs': { title: 'Job requests', sub: 'Requests from clients' },
  '/dashboard/profile-setup': { title: 'My professional profile', sub: 'What clients see about you' },
  '/dashboard/verification': { title: 'Technician verification', sub: 'Review and approve new technicians' },
  '/dashboard/users': { title: 'Users', sub: 'Everyone on the platform' },
  '/dashboard/categories': { title: 'Service categories', sub: 'The services clients can choose' },
  '/dashboard/platform-bookings': { title: 'Bookings', sub: 'Monitor platform activity' },
  '/dashboard/reviews': { title: 'Reviews', sub: 'Moderate ratings and comments' },
}

function pageTitle(pathname) {
  if (pathname.startsWith('/dashboard/technicians/')) {
    return { title: 'Technician profile', sub: 'Verified professional details' }
  }
  if (pathname.startsWith('/dashboard/tracking/')) {
    return { title: 'Live tracking', sub: 'Follow the technician on the map' }
  }
  return TITLES[pathname] || { title: 'WorkMan', sub: '' }
}

export default function DashboardLayout() {
  const { user, logout, isClient, isProvider } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const nav = isClient ? CLIENT_NAV : isProvider ? PROVIDER_NAV : ADMIN_NAV
  const { title, sub } = useMemo(() => pageTitle(location.pathname), [location.pathname])

  const roleLabel = isClient ? 'Client' : isProvider ? 'Technician' : 'Administrator'

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-mark">W</span>
          <span className="sidebar-word">
            workman<span className="sidebar-dot">.</span>
          </span>
        </div>

        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          <span className="sidebar-section-label">Menu</span>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <Avatar name={user?.name} size={36} />
            <div className="sidebar-user-meta">
              <b>{user?.name}</b>
              <small>{roleLabel}</small>
            </div>
            <button className="sidebar-logout" onClick={handleLogout} title="Sign out" aria-label="Sign out">
              <Icon name="logout" size={16} />
            </button>
          </div>
        </div>
      </aside>

      {menuOpen && <button className="sidebar-scrim" onClick={() => setMenuOpen(false)} aria-label="Close menu" />}

      <div className="app-main">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            <Icon name="grid" size={20} />
          </button>
          <div className="topbar-title">
            <h1>{title}</h1>
            {sub && <p>{sub}</p>}
          </div>
          <div className="topbar-actions">
            <NotificationBell />
            <div className="topbar-user">
              <Avatar name={user?.name} size={34} />
              <span className="topbar-user-name">{user?.name?.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        <main className="app-content page-enter" key={location.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
