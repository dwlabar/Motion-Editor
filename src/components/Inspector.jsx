// -----------------------------------------------------------------------------
// Inspector.jsx
// -----------------------------------------------------------------------------
//
// The inspector owns the independent settings and properties panels. Keyframe
// editing stays model-driven through the callback supplied by App.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react'
import '../styles/components/_Inspector.scss'
import { EASING_PRESETS, getTransitionEase } from '../utility/keyframeEasing'

function Inspector({
  selectedId,
  nudgeAmount,
  onNudgeAmountChange,
  selectedKeyframe,
  animationModel,
  onUpdateKeyframe
}) {
  const [timeInput, setTimeInput] = useState('')
  const [valueInput, setValueInput] = useState('')
  const [valueInputX, setValueInputX] = useState('')
  const [valueInputY, setValueInputY] = useState('')
  const [nudgeInput, setNudgeInput] = useState(String(nudgeAmount))

  function commitNudgeAmount() {
    const next = Number(nudgeInput)
    if (Number.isFinite(next) && next > 0) {
      onNudgeAmountChange(next)
      setNudgeInput(String(next))
    } else {
      setNudgeInput(String(nudgeAmount))
    }
  }

  const selectionKey = useMemo(() => {
    if (!selectedKeyframe) return ''
    return `${selectedKeyframe.trackId}__${selectedKeyframe.property}__${Number(selectedKeyframe.time)}`
  }, [selectedKeyframe])

  const track = useMemo(() => {
    if (!selectedKeyframe) return null
    return (animationModel.tracks || []).find(item => {
      return item.targetId === selectedKeyframe.trackId && item.property === selectedKeyframe.property
    }) || null
  }, [animationModel, selectedKeyframe])

  const keyframe = useMemo(() => {
    if (!selectedKeyframe || !track) return null
    return (track.keyframes || []).find(item => {
      return Number(item.time) === Number(selectedKeyframe.time)
    }) || null
  }, [selectedKeyframe, track])

  useEffect(() => {
    if (!keyframe || !track) {
      setTimeInput('')
      setValueInput('')
      setValueInputX('')
      setValueInputY('')
      return
    }

    setTimeInput(String(keyframe.time))

    if (track.property === 'opacity' || track.property === 'scale' || track.property === 'rotation') {
      setValueInput(String(keyframe.value))
    }

    if (track.property === 'position') {
      setValueInputX(String(keyframe.value.x))
      setValueInputY(String(keyframe.value.y))
    }
  }, [selectionKey, keyframe, track])

  function updateKeyframe(nextValues) {
    if (!selectedKeyframe || !track || !keyframe) return
    if (typeof onUpdateKeyframe !== 'function') return

    onUpdateKeyframe({
      trackId: selectedKeyframe.trackId,
      property: selectedKeyframe.property,
      timeOriginal: keyframe.time,
      ...nextValues
    })
  }

  function commitTimeChange() {
    const timeNext = Number(timeInput)
    if (!keyframe || !Number.isFinite(timeNext)) {
      if (keyframe) setTimeInput(String(keyframe.time))
      return
    }
    if (timeNext !== Number(keyframe.time)) updateKeyframe({ timeNext })
  }

  function commitScalarValue() {
    const valueNext = Number(valueInput)
    if (!keyframe || !Number.isFinite(valueNext)) {
      if (keyframe) setValueInput(String(keyframe.value))
      return
    }
    if (valueNext !== Number(keyframe.value)) updateKeyframe({ valueNext })
  }

  function commitPositionValue() {
    const x = Number(valueInputX)
    const y = Number(valueInputY)
    if (!keyframe || !Number.isFinite(x) || !Number.isFinite(y)) {
      if (keyframe) {
        setValueInputX(String(keyframe.value.x))
        setValueInputY(String(keyframe.value.y))
      }
      return
    }
    if (x !== keyframe.value.x || y !== keyframe.value.y) {
      updateKeyframe({ valueNext: { x, y } })
    }
  }

  function handleKeyDown(event, commit, reset) {
    if (event.key === 'Enter') {
      commit()
      event.target.blur()
    }
    if (event.key === 'Escape') {
      event.stopPropagation()
      reset()
      event.target.blur()
    }
  }

  const property = track?.property
  const hasKeyframe = Boolean(keyframe && track)
  const nextKeyframe = hasKeyframe ? track.keyframes[track.keyframes.indexOf(keyframe) + 1] : null
  const easing = getTransitionEase(keyframe, nextKeyframe)

  return (
    <>
      <section className="inspector__section inspector__section--settings">
        <h2 className="inspector__heading">Settings</h2>

        <label className="inspector__field" htmlFor="editor-nudge">
          <span className="inspector__label">Nudge</span>
          <input
            id="editor-nudge"
            className="inspector__input"
            type="number"
            step="any"
            value={nudgeInput}
            title="Positive SVG units per arrow key. Shift multiplies by 10."
            onChange={event => setNudgeInput(event.target.value)}
            onBlur={commitNudgeAmount}
            onKeyDown={event => {
              if (event.key === 'Enter') event.target.blur()
              if (event.key === 'Escape') {
                setNudgeInput(String(nudgeAmount))
                event.stopPropagation()
              }
            }}
          />
          <span className="inspector__unit">units</span>
        </label>
      </section>

      <section className="inspector__section">
        <h2 className="inspector__heading">Properties</h2>

        {hasKeyframe ? (
          <>
            <dl className="inspector__metadata">
              <div className="inspector__metadata-item">
                <dt>Target</dt>
                <dd className="inspector__value" title={selectedKeyframe.trackId}>{selectedKeyframe.trackId}</dd>
              </div>
              <div className="inspector__metadata-item">
                <dt>Property</dt>
                <dd className="inspector__value">{property}</dd>
              </div>
            </dl>
            <label className="inspector__field" htmlFor="keyframe-time">
              <span className="inspector__label">Time</span>
              <input
                id="keyframe-time"
                className="inspector__input"
                type="number"
                step="0.01"
                value={timeInput}
                onChange={event => setTimeInput(event.target.value)}
                onBlur={commitTimeChange}
                onKeyDown={event => handleKeyDown(event, commitTimeChange, () => setTimeInput(String(keyframe.time)))}
              />
              <span className="inspector__unit">s</span>
            </label>
            <div className="inspector__field">
              <span className="inspector__label">Value</span>
              {property === 'path' ? (
                <span className="inspector__value">Path keyframe — edit anchors on the stage.</span>
              ) : property === 'position' ? (
                <>
                  <input className="inspector__input" type="number" step="any" aria-label="Position X" value={valueInputX} onChange={event => setValueInputX(event.target.value)} onBlur={commitPositionValue} onKeyDown={event => handleKeyDown(event, commitPositionValue, () => setValueInputX(String(keyframe.value.x)))} />
                  <span className="inspector__unit">x</span>
                  <input className="inspector__input" type="number" step="any" aria-label="Position Y" value={valueInputY} onChange={event => setValueInputY(event.target.value)} onBlur={commitPositionValue} onKeyDown={event => handleKeyDown(event, commitPositionValue, () => setValueInputY(String(keyframe.value.y)))} />
                  <span className="inspector__unit">y</span>
                </>
              ) : (
                <>
                  <input className="inspector__input" type="number" step="0.01" value={valueInput} onChange={event => setValueInput(event.target.value)} onBlur={commitScalarValue} onKeyDown={event => handleKeyDown(event, commitScalarValue, () => setValueInput(String(keyframe.value)))} />
                  <span className="inspector__unit">{property === 'rotation' ? 'deg' : ''}</span>
                </>
              )}
            </div>
            {nextKeyframe ? (
              <label className="inspector__field" htmlFor="keyframe-easing">
                <span className="inspector__label">Easing to next keyframe</span>
                <select
                  id="keyframe-easing"
                  className="inspector__input inspector__input--select"
                  value={easing}
                  onChange={event => updateKeyframe({ easeToNext: event.target.value })}
                >
                  {!EASING_PRESETS.some(preset => preset.value === easing) ? <option value={easing}>{easing} (saved)</option> : null}
                  {EASING_PRESETS.map(preset => <option key={preset.value} value={preset.value}>{preset.label}</option>)}
                </select>
              </label>
            ) : null}
          </>
        ) : (
          <>
            {selectedId ? <p className="inspector__value inspector__target">Target: {selectedId}</p> : null}
            <p className="inspector__empty">{selectedId ? 'Select a keyframe to edit its properties.' : 'Select an object or keyframe.'}</p>
          </>
        )}
      </section>
    </>
  )
}

export default Inspector
