import { createContext } from 'react'

// Null-object fallback so useToast never crashes when the provider is absent.
export const ToastContext = createContext({
  success: () => {},
  error: () => {},
  info: () => {},
  dismiss: () => {},
})
