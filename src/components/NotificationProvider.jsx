import { useCallback, useEffect, useMemo, useState } from 'react'
import { NotificationContext } from '../hooks/useNotifications'

export default function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  const notify = useCallback(({ message, variant = 'info' }) => {
    const id = crypto.randomUUID()
    const safeVariant = ['success', 'info', 'warning', 'error'].includes(variant) ? variant : 'info'
    setNotifications(items => [...items, {
      id, message, variant: safeVariant, expiresAt: Date.now() + 6000, exiting: false
    }])
    return id
  }, [])

  const dismiss = useCallback(id => {
    setNotifications(items => items.map(item => item.id === id && !item.exiting
      ? { ...item, exiting: true, expiresAt: Date.now() + 180 } : item))
  }, [])

  // Absolute deadlines survive viewport moves into/out of a modal and rerenders.
  useEffect(() => {
    const timers = notifications.map(item => window.setTimeout(() => {
      if (item.exiting) setNotifications(items => items.filter(next => next.id !== item.id))
      else dismiss(item.id)
    }, Math.max(0, item.expiresAt - Date.now())))
    return () => timers.forEach(window.clearTimeout)
  }, [notifications, dismiss])

  const value = useMemo(() => ({ notifications, notify, dismiss }), [notifications, notify, dismiss])
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
