// -----------------------------------------------------------------------------
// components/AppModal.jsx
// -----------------------------------------------------------------------------
// Version History
//
// v0.0.1
// - Generic modal shell with backdrop click, ESC close, and header.
// -----------------------------------------------------------------------------

import { useEffect, useRef } from 'react'
import '../styles/components/_AppModal.scss'

function AppModal({
  title,
  onClose,
  children
}) {
  const dialogRef = useRef(null)

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        if (typeof onClose === 'function') onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  function handleBackdropPointerDown(e) {
    const dialogEl = dialogRef.current
    if (!dialogEl) return

    if (e.target === e.currentTarget) {
      if (typeof onClose === 'function') onClose()
    }
  }

  return (
    <div
      className="app-modal"
      role="dialog"
      aria-modal="true"
      onPointerDown={handleBackdropPointerDown}
    >
      <div className="app-modal__dialog" ref={dialogRef}>
        <div className="app-modal__header">
          <div className="app-modal__title">{title}</div>

          <button
            type="button"
            className="app-modal__close"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
              <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
            </svg>
          </button>
        </div>

        <div className="app-modal__body">
          {children}
        </div>
      </div>
    </div>
  )
}

export default AppModal
