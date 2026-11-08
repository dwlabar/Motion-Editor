import { createContext, useContext } from 'react'

export const NotificationContext = createContext(null)

// notify({ message, variant: 'success' | 'info' | 'warning' | 'error' })
// returns an id that can also be passed to dismiss(id).
export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications requires NotificationProvider.')
  return context
}
