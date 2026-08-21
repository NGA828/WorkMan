import { LandingPage } from './pages/LandingPage'
import AuthPage from './pages/AuthPage/AuthPage'
import DashboardPage from './pages/DashboardPage/DashboardPage'
import DiscoverPage from './pages/DiscoverPage/DiscoverPage'
import TechnicianProfilePage from './pages/TechnicianProfilePage/TechnicianProfilePage'
import MessagesPage from './pages/MessagesPage/MessagesPage'
import PaymentPage from './pages/PaymentPage/PaymentPage'
import TrackingPage from './pages/TrackingPage/TrackingPage'
import './App.css'

function App() {
  const path = window.location.pathname
  if (path === '/login') return <AuthPage />
  if (path === '/register') return <AuthPage mode="register" />
  if (path === '/dashboard') return <DashboardPage />
  if (path === '/discover') return <DiscoverPage />
  if (path.startsWith('/technicians/')) return <TechnicianProfilePage id={path.split('/')[2]} />
  if (path === '/messages') return <MessagesPage />
  if (path === '/payments') return <PaymentPage />
  if (path === '/tracking') return <TrackingPage />
  return <LandingPage />
}

export default App
