import { useEffect, useState } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import '../styles/components/_Notifications.scss'

export default function NotificationViewport() {
  const { notifications, dismiss } = useNotifications()
  const [ready, setReady] = useState(false)
  // Mount empty live regions before adding messages, including after a modal move.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(frame)
  }, [])
  return (
    <section className="notifications" aria-label="Notifications" onKeyDown={event => event.stopPropagation()}>
      {['polite', 'assertive'].map(priority => (
        <div className="notifications__group" key={priority} aria-live={priority} aria-relevant="additions" aria-atomic="false">
          {ready && notifications.filter(item => (item.variant === 'error' ? 'assertive' : 'polite') === priority).map(item => (
            <div key={item.id} className={`notification notification--${item.variant}${item.exiting ? ' notification--exiting' : ''}`}>
              <div className="notification__content">
                <strong className="notification__title">{item.variant}</strong>
                <p className="notification__message">{item.message}</p>
              </div>
              <button type="button" className="notification__close" aria-label={`Dismiss ${item.variant} notification`} onClick={() => dismiss(item.id)}>
                <span aria-hidden="true">×</span>
              </button>
            </div>
          ))}
        </div>
      ))}
    </section>
  )
}
