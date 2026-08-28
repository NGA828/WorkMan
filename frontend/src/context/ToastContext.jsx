import { useCallback, useMemo, useRef, useState } from 'react'
import Icon from '../components/Icon'
import { ToastContext } from './toast-context'

let counter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((toast) => toast.id !== id))
    if (timers.current[id]) {
      clearTimeout(timers.current[id])
      delete timers.current[id]
    }
  }, [])

  const push = useCallback(
    (type, message) => {
      const id = ++counter
      setToasts((list) => [...list, { id, type, message }].slice(-4))
      timers.current[id] = setTimeout(() => dismiss(id), 4200)
      return id
    },
    [dismiss]
  )

  const api = useMemo(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
      info: (message) => push('info', message),
      dismiss,
    }),
    [push, dismiss]
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span className="toast-icon">
              <Icon
                name={toast.type === 'success' ? 'check' : toast.type === 'error' ? 'x' : 'bell'}
                size={15}
              />
            </span>
            <span className="toast-msg">{toast.message}</span>
            <button className="toast-close" onClick={() => dismiss(toast.id)} aria-label="Dismiss">
              <Icon name="x" size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
