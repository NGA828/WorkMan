import { LandingPage } from './pages/LandingPage'
import AuthPage from './pages/AuthPage/AuthPage'
import DashboardPage from './pages/DashboardPage/DashboardPage'
import './App.css'

function App() {
  const path = window.location.pathname
  if (path === '/login') return <AuthPage />
  if (path === '/register') return <AuthPage mode="register" />
  if (path === '/dashboard') return <DashboardPage />
  return <LandingPage />
}

export default App
