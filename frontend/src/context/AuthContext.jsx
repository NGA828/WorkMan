/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { getMe, login as apiLogin, logout as apiLogout, register as apiRegister } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Bumped on every login / register / logout. A refresh that started before
  // a session change must not apply its (now stale) result afterwards —
  // otherwise a late /auth/me failure could log out a user who just logged in.
  const sessionVersion = useRef(0)

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('workman_token')
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    const version = sessionVersion.current

    try {
      const { data } = await getMe()
      if (version === sessionVersion.current) setUser(data.user)
    } catch {
      if (version === sessionVersion.current) {
        localStorage.removeItem('workman_token')
        setUser(null)
      }
    } finally {
      if (version === sessionVersion.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = useCallback(async (credentials) => {
    const { data } = await apiLogin(credentials)
    sessionVersion.current += 1
    localStorage.setItem('workman_token', data.token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (details) => {
    const { data } = await apiRegister(details)
    sessionVersion.current += 1
    localStorage.setItem('workman_token', data.token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } catch {
      // Token may already be invalid — clear locally regardless.
    }
    sessionVersion.current += 1
    localStorage.removeItem('workman_token')
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh, isClient: user?.role === 'client', isProvider: user?.role === 'provider', isAdmin: user?.role === 'admin' }),
    [user, loading, login, register, logout, refresh]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
