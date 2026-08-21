import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import DashboardLayout from './components/dashboard/DashboardLayout'
import { useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage/AuthPage'
import AdminBookings from './pages/dashboard/AdminBookings'
import AdminCategories from './pages/dashboard/AdminCategories'
import AdminHome from './pages/dashboard/AdminHome'
import AdminReviews from './pages/dashboard/AdminReviews'
import AdminUsers from './pages/dashboard/AdminUsers'
import AdminVerification from './pages/dashboard/AdminVerification'
import Bookings from './pages/dashboard/Bookings'
import ClientHome from './pages/dashboard/ClientHome'
import Discover from './pages/dashboard/Discover'
import Favorites from './pages/dashboard/Favorites'
import Messages from './pages/dashboard/Messages'
import ProviderHome from './pages/dashboard/ProviderHome'
import ProviderJobs from './pages/dashboard/ProviderJobs'
import ProviderProfileSetup from './pages/dashboard/ProviderProfileSetup'
import SettingsPage from './pages/dashboard/SettingsPage'
import TechnicianProfile from './pages/dashboard/TechnicianProfile'
import Tracking from './pages/dashboard/Tracking'
import LandingPage from './pages/LandingPage'
import './App.css'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

function RequireRole({ roles, children }) {
  const { user } = useAuth()

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function DashboardHome() {
  const { isClient, isProvider, isAdmin } = useAuth()
  if (isClient) return <ClientHome />
  if (isProvider) return <ProviderHome />
  if (isAdmin) return <AdminHome />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />

      {/* Dashboard (authenticated) */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardHome />} />

        {/* Client workspace */}
        <Route
          path="discover"
          element={
            <RequireRole roles={['client']}>
              <Discover />
            </RequireRole>
          }
        />
        <Route
          path="technicians/:id"
          element={
            <RequireRole roles={['client']}>
              <TechnicianProfile />
            </RequireRole>
          }
        />
        <Route
          path="bookings"
          element={
            <RequireRole roles={['client']}>
              <Bookings />
            </RequireRole>
          }
        />
        <Route
          path="favorites"
          element={
            <RequireRole roles={['client']}>
              <Favorites />
            </RequireRole>
          }
        />
        <Route
          path="settings"
          element={
            <RequireRole roles={['client']}>
              <SettingsPage />
            </RequireRole>
          }
        />

        {/* Technician workspace */}
        <Route
          path="jobs"
          element={
            <RequireRole roles={['provider']}>
              <ProviderJobs />
            </RequireRole>
          }
        />
        <Route
          path="profile-setup"
          element={
            <RequireRole roles={['provider']}>
              <ProviderProfileSetup />
            </RequireRole>
          }
        />

        {/* Shared by client and technician */}
        <Route
          path="messages"
          element={
            <RequireRole roles={['client', 'provider']}>
              <Messages />
            </RequireRole>
          }
        />
        <Route
          path="tracking/:bookingId"
          element={
            <RequireRole roles={['client', 'provider']}>
              <Tracking />
            </RequireRole>
          }
        />

        {/* Admin workspace */}
        <Route
          path="verification"
          element={
            <RequireRole roles={['admin']}>
              <AdminVerification />
            </RequireRole>
          }
        />
        <Route
          path="users"
          element={
            <RequireRole roles={['admin']}>
              <AdminUsers />
            </RequireRole>
          }
        />
        <Route
          path="categories"
          element={
            <RequireRole roles={['admin']}>
              <AdminCategories />
            </RequireRole>
          }
        />
        <Route
          path="platform-bookings"
          element={
            <RequireRole roles={['admin']}>
              <AdminBookings />
            </RequireRole>
          }
        />
        <Route
          path="reviews"
          element={
            <RequireRole roles={['admin']}>
              <AdminReviews />
            </RequireRole>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
