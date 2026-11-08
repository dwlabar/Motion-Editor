// Document-level timing stays separate from selected-object properties.
import { useState } from 'react'

function AnimationDuration({ duration, onCommit }) {
  const [draft, setDraft] = useState(null)

  function commit(event) {
    const value = Number(event.target.value)
    onCommit(value)
    setDraft(null)
  }

  return (
    <div className="inspector__duration">
      <label htmlFor="animation-duration">Duration</label>
      <input
        id="animation-duration"
        className="inspector__input"
        type="number"
        step="any"
        aria-label="Animation duration (seconds)"
        value={draft ?? String(duration)}
        onChange={event => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={event => {
          if (event.key === 'Enter') event.target.blur()
          if (event.key === 'Escape') {
            event.stopPropagation()
            event.target.value = String(duration)
            setDraft(null)
            event.target.blur()
          }
        }}
      />
      <span className="inspector__unit">s</span>
    </div>
  )
}

export default AnimationDuration
