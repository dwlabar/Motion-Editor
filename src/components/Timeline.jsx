// -----------------------------------------------------------------------------
// Timeline.jsx
// -----------------------------------------------------------------------------
// Version History
//
// v0.2.1
// - Share inset time-domain geometry across Figma ruler, markers and gestures.
// - Continue the playhead through rows and center labels within shared gutters.
//
// v0.2.0
// - Add the SVG Path animation foundation through MorphSVG and the existing model.
//
// v0.0.14
// - Capture timeline pointer gestures and suppress native drag/selection.
// - Clear drag state on release, cancellation, lost capture, blur and unmount.
//
// v0.0.13
// - Share the frame-snap calculation with model-driven stage authoring.
//
// v0.0.1
// - Initial timeline scaffolding.
//
// v0.0.2
// - Migrated to BEM classes + SCSS partial.
//
// v0.0.3
// - Added track rows and keyframes (read-only).
// - Displays per-property lanes and diamonds positioned by time.
//
// v0.0.4
// - Added keyframe selection support.
// - Clicking a keyframe notifies App (onKeyframeSelect).
// - Selected keyframe visually highlighted.
//
// v0.0.5
// - Phase 2 Step 6:
//   - Added draggable keyframes.
//   - Dragging updates keyframe position visually.
//   - Keyframe time committed on mouse release via onUpdateKeyframe.
//
// v0.0.6
// - Phase 2 Step 7:
//   - Added draggable playhead.
//   - Clicking or dragging on the ruler updates scrub position.
//
// v0.0.7
// - Phase 2 Step 8:
//   - Added 30fps time snapping for keyframe drag and playhead scrubbing.
//
// v0.0.8
// - Phase 2 Step 9:
//   - Ruler labels converted from percent to seconds (time-based UI).
//
// v0.0.9
// - Phase 2 Authoring:
//   - Added per-track "Add Keyframe" button.
//   - Keyframe is created at the current playhead time (snapped).
//
// v0.0.10
// - Phase 2 Authoring:
//   - Added selectable property rows (track selection).
//   - Selected track visually highlighted.
//
// v0.0.11
// - Moved layer selection and Add Track controls into timeline layer headers.
//
// v0.0.12
// - Added an endpoint-safe time area shared by ruler marks, playhead, and
//   keyframes so duration-end content remains visible without widening the UI.
// -----------------------------------------------------------------------------

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import '../styles/components/_Timeline.scss'
import { snapTimeToFrame } from '../utility/authorPosition'
import { isPathTarget } from '../utility/pathGeometry'
import { useMenuPosition } from '../hooks/useMenuPosition'
import TimelineRowAction from './TimelineRowAction'

const SUPPORTED_TRACK_PROPERTIES = [
  { key: 'position', label: 'Position' },
  { key: 'opacity', label: 'Opacity' },
  { key: 'rotation', label: 'Rotation' },
  { key: 'scale', label: 'Scale' },
  { key: 'path', label: 'Path' }
]

function Timeline({
  shapeList,
  selectedId,
  onSelectTarget,
  currentTime,
  duration = 1,
  animationModel,
  selectedKeyframe,
  selectedTrack,
  onSelectTrack,
  onKeyframeSelect,
  onUpdateKeyframe,
  onAddKeyframe,
  onScrubChange,
  onAddTrack
}) {
  const safeDuration = duration > 0 ? duration : 1
  const playheadPercent = (currentTime / safeDuration) * 100

  const rulerRef = useRef(null)
  const endpointLabelRef = useRef(null)
  const dragRef = useRef(null)

  const [dragTime, setDragTime] = useState(null)
  const [addTrackTargetId, setAddTrackTargetId] = useState(null)
  const [rulerWidth, setRulerWidth] = useState(0)
  const [endpointLabelWidth, setEndpointLabelWidth] = useState(0)
  const timelineRef = useRef(null)
  const addTrackTriggerRef = useRef(null)
  const addTrackMenuRef = useRef(null)

  useMenuPosition(addTrackTriggerRef, addTrackMenuRef, addTrackTargetId)

  useLayoutEffect(() => {
    // Reserve space for half of the duration label at both ends. Observe the
    // actual font/label size so longer durations never need a flipped label.
    const label = endpointLabelRef.current
    const measure = () => setEndpointLabelWidth(label.getBoundingClientRect().width)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(label)
    return () => observer.disconnect()
  }, [safeDuration])

  useEffect(() => {
    const ruler = rulerRef.current
    const observer = new ResizeObserver(() => setRulerWidth(ruler.getBoundingClientRect().width))
    observer.observe(ruler)
    return () => observer.disconnect()
  }, [])

  // ---------------------------------------------------------------------------
  // Snap settings
  // ---------------------------------------------------------------------------
  // Shared with stage dragging, nudging and normal keyframe authoring.

  function clampTime(timeVal) {
    if (timeVal < 0) return 0
    if (timeVal > safeDuration) return safeDuration
    return timeVal
  }

  // ---------------------------------------------------------------------------
  // Group animation tracks by shape ID for display
  // ---------------------------------------------------------------------------
  const tracksByShape = {}
  if (animationModel?.tracks) {
    animationModel.tracks.forEach(track => {
      if (!tracksByShape[track.targetId]) {
        tracksByShape[track.targetId] = []
      }
      tracksByShape[track.targetId].push(track)
    })
  }

  const existingPropertiesByTarget = (() => {
    const properties = {}
    Object.entries(tracksByShape).forEach(([targetId, tracks]) => {
      properties[targetId] = new Set(tracks.map(track => track.property))
    })
    return properties
  })()

  useEffect(() => {
    if (!addTrackTargetId) return

    function handleOutsidePointerDown(event) {
      if (timelineRef.current?.contains(event.target)) return
      setAddTrackTargetId(null)
    }

    window.addEventListener('pointerdown', handleOutsidePointerDown)
    return () => window.removeEventListener('pointerdown', handleOutsidePointerDown)
  }, [addTrackTargetId])

  // ---------------------------------------------------------------------------
  // Mouse → time helper (snapped, clamped)
  // ---------------------------------------------------------------------------
  function getTimeFromMouseEvent(e) {
    if (!rulerRef.current) return 0

    const rect = rulerRef.current.getBoundingClientRect()
    if (rect.width <= 0) return 0
    const x = e.clientX - rect.left
    const pct = Math.max(0, Math.min(1, x / rect.width))
    const raw = pct * safeDuration

    const snapped = snapTimeToFrame(raw)
    return clampTime(snapped)
  }

  function getScrubFromMouseEvent(e) {
    const time = getTimeFromMouseEvent(e)
    return safeDuration > 0 ? time / safeDuration : 0
  }

  // ---------------------------------------------------------------------------
  // Time ruler tick generation (seconds-based)
  // ---------------------------------------------------------------------------
  function getRulerTicks(durationSeconds) {
    const d = durationSeconds > 0 ? durationSeconds : 1

    // Keep a readable minimum gap and only use intervals that divide the full
    // duration. Appending an unmatched endpoint (or omitting nearby labels)
    // would create irregular sequences such as 0, 2, 3.
    const maxIntervals = Math.max(1, Math.floor(rulerWidth / Math.max(85, endpointLabelWidth + 16)))
    const minimumStep = d / maxIntervals
    const magnitude = 10 ** Math.floor(Math.log10(minimumStep))
    let intervals = 1
    for (const multiple of [1, 1.5, 2, 2.5, 5, 10]) {
      const step = multiple * magnitude
      const count = d / step
      const roundedCount = Math.round(count)
      if (roundedCount >= 2 && roundedCount <= maxIntervals && Math.abs(count - roundedCount) < 1e-9) {
        intervals = roundedCount
        break
      }
    }
    return Array.from({ length: intervals + 1 }, (_, index) => {
      const fraction = index / intervals
      return { time: index === intervals ? d : d * fraction, leftPercent: fraction * 100, fraction }
    })
  }

  function formatSecondsLabel(timeVal, durationSeconds) {
    const d = durationSeconds > 0 ? durationSeconds : 1

    // If duration is small, show 2 decimals. Otherwise show 1.
    const useTwoDecimals = d <= 5
    const fixed = useTwoDecimals ? 2 : 1

    // Retain readable defaults without rounding fractional durations or steps
    // into misleading labels. Remove arithmetic noise from tick generation.
    const cleaned = Number(timeVal.toPrecision(12))
    const formatted = cleaned.toFixed(fixed)
    return `${Number(formatted) === cleaned ? formatted : cleaned}s`
  }

  const rulerTicks = getRulerTicks(safeDuration)
  // Track/keyframe focus retains its parent target without another selection state.
  const activeTrack = selectedKeyframe || selectedTrack
  const currentTargetId = activeTrack?.trackId ?? selectedId

  // ---------------------------------------------------------------------------
  // Keyframe drag handlers
  // ---------------------------------------------------------------------------
  const releasePointerDrag = useCallback(() => {
    const drag = dragRef.current
    if (!drag) return null
    // Clear first: releasing capture can dispatch lostpointercapture.
    dragRef.current = null
    setDragTime(null)
    if (drag.captureElement.hasPointerCapture(drag.pointerId)) {
      drag.captureElement.releasePointerCapture(drag.pointerId)
    }
    return drag
  }, [])

  useEffect(() => {
    const cancel = () => releasePointerDrag()
    const handleEscape = event => {
      if (event.key === 'Escape') cancel()
    }
    window.addEventListener('blur', cancel)
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('blur', cancel)
      window.removeEventListener('keydown', handleEscape)
      cancel()
    }
  }, [releasePointerDrag])

  // Loading another SVG or changing the timebase invalidates a pending drag.
  useEffect(() => () => releasePointerDrag(), [shapeList, duration, releasePointerDrag])

  function beginPointerDrag(e, details) {
    if (e.button !== 0 || e.isPrimary === false || dragRef.current) return false
    const captureElement = timelineRef.current
    if (!captureElement) return false
    // Own only this custom gesture; native selection and HTML dragging must not
    // compete with it. Capture a stable ancestor, not the moving keyframe node.
    e.preventDefault()
    e.stopPropagation()
    captureElement.setPointerCapture(e.pointerId)
    dragRef.current = {
      ...details,
      captureElement,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      hasDragged: false
    }
    return true
  }

  function handleKeyframePointerDown(e, trackId, property, time) {
    if (!beginPointerDrag(e, { kind: 'keyframe', trackId, property, timeOriginal: time })) return
    onKeyframeSelect(trackId, property, time)
  }

  function handleDragPointerMove(e) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    if ((e.buttons & 1) === 0) {
      releasePointerDrag()
      return
    }
    e.preventDefault()
    if (drag.kind === 'playhead') {
      onScrubChange(getScrubFromMouseEvent(e))
      return
    }
    if (Math.abs(e.clientX - drag.startClientX) >= 3) drag.hasDragged = true
    if (drag.hasDragged) setDragTime(getTimeFromMouseEvent(e))
  }

  function handleDragPointerUp(e) {
    if (dragRef.current?.pointerId !== e.pointerId) return
    e.preventDefault()
    const drag = releasePointerDrag()
    if (drag.kind === 'playhead') {
      onScrubChange(getScrubFromMouseEvent(e))
      return
    }
    const { trackId, property, timeOriginal } = drag
    const didDrag = drag.hasDragged || Math.abs(e.clientX - drag.startClientX) >= 3
    const commitTime = didDrag ? getTimeFromMouseEvent(e) : timeOriginal
    const track = (animationModel?.tracks || []).find(item => item.targetId === trackId && item.property === property)
    const hasCollision = track?.keyframes.some(kf => Number(kf.time) === commitTime && Number(kf.time) !== Number(timeOriginal))
    if (!track || hasCollision || !onUpdateKeyframe || Number(commitTime) === Number(timeOriginal)) {
      onKeyframeSelect(trackId, property, timeOriginal)
      return
    }
    onUpdateKeyframe({ trackId, property, timeOriginal, timeNext: commitTime })
    onKeyframeSelect(trackId, property, commitTime)
  }

  function handleDragPointerCancel(e) {
    if (dragRef.current?.pointerId === e.pointerId) releasePointerDrag()
  }

  // ---------------------------------------------------------------------------
  // Playhead drag handlers
  // ---------------------------------------------------------------------------
  function handleRulerPointerDown(e) {
    if (!onScrubChange || !beginPointerDrag(e, { kind: 'playhead' })) return
    onScrubChange(getScrubFromMouseEvent(e))
  }

  // ---------------------------------------------------------------------------
  // Add keyframe handler (uses current playhead time, snapped)
  // ---------------------------------------------------------------------------
  function handleAddKeyframeClick(e, trackId, property) {
    e.preventDefault()
    e.stopPropagation()

    if (typeof onAddKeyframe !== 'function') return

    const snapped = snapTimeToFrame(Number(currentTime))
    const clamped = clampTime(snapped)

    onAddKeyframe({
      trackId,
      property,
      time: clamped
    })
  }

  // ---------------------------------------------------------------------------
  // Track selection (property row)
  // ---------------------------------------------------------------------------
  function handlePropertyRowPointerDown(e, trackId, property) {
    e.stopPropagation()
    if (typeof onSelectTrack !== 'function') return

    onSelectTrack({
      trackId: String(trackId),
      property: String(property)
    })
  }

  function handleLayerSelect(targetId) {
    if (typeof onSelectTarget === 'function') onSelectTarget(targetId)
  }

  function handleAddTrack(property) {
    if (!addTrackTargetId || typeof onAddTrack !== 'function') return
    if (existingPropertiesByTarget[addTrackTargetId]?.has(property)) return

    onAddTrack({ targetId: addTrackTargetId, property })
    setAddTrackTargetId(null)
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <section
      className="timeline"
      style={{
        '--timeline-playhead-position': `${playheadPercent}%`,
        '--timeline-ruler-label-width': `${endpointLabelWidth}px`
      }}
      ref={timelineRef}
      aria-label="Timeline"
      onPointerMove={handleDragPointerMove}
      onPointerUp={handleDragPointerUp}
      onPointerCancel={handleDragPointerCancel}
      onLostPointerCapture={handleDragPointerCancel}
    >

      {/* ---------------------------------------------------------------------
           Time Ruler
         --------------------------------------------------------------------- */}
      <div
        className="timeline__ruler"
        onPointerDown={handleRulerPointerDown}
        draggable={false}
        onDragStart={e => e.preventDefault()}
      >
        <div
          className="timeline__time-area timeline__time-area--ruler"
          ref={rulerRef}
        >
          {rulerTicks.map(tick => (
            <div
              key={tick.leftPercent}
              className="timeline__ruler-mark"
              ref={tick.fraction === 1 ? endpointLabelRef : null}
              style={{ left: `${tick.leftPercent}%` }}
            >
              {formatSecondsLabel(tick.time, safeDuration)}
            </div>
          ))}

          {rulerTicks.slice(0, -1).flatMap((tick, index) =>
            [0, 1, 2, 3].map(part => (
              <span
                key={`${index}-${part}`}
                className={'timeline__ruler-hash' + (part % 2 === 0 ? ' timeline__ruler-hash--major' : '')}
                style={{ left: `${tick.leftPercent + (rulerTicks[index + 1].leftPercent - tick.leftPercent) * part / 4}%` }}
                aria-hidden="true"
              />
            ))
          )}
          <span className="timeline__ruler-hash timeline__ruler-hash--major" style={{ left: '100%' }} aria-hidden="true" />

          <div
            className="timeline__playhead"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* ---------------------------------------------------------------------
           Timeline Rows
         --------------------------------------------------------------------- */}
      <div className="timeline__body">
        <div className="timeline__row-playhead" aria-hidden="true">
          <div className="timeline__time-area">
            <div className="timeline__playhead timeline__playhead--rows" />
          </div>
        </div>
        {shapeList.map(shape => {
          const isSelectedShape = shape.id === currentTargetId
          const shapeTracks = tracksByShape[shape.id] || []
          const existingProperties = existingPropertiesByTarget[shape.id] || new Set()

          return (
            <div key={shape.id} className="timeline__layer">

              <div
                className={
                  'timeline__layer-header' +
                  (isSelectedShape ? ' timeline__layer-header--selected' : '')
                }
              >
                <button
                  type="button"
                  className="timeline__layer-select"
                  onClick={() => handleLayerSelect(shape.id)}
                  title={shape.id}
                >
                  <img className="timeline__layer-toggle" src="/figma/icon-shape.svg" alt="" draggable={false} />
                  <span className="timeline__layer-name">{shape.label}</span>
                </button>
                <div className="timeline__action-cell">
                  <div className="timeline__track-menu">
                    <TimelineRowAction
                      icon={<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 1v12M1 7h12" fill="none" stroke="currentColor" /></svg>}
                      label={`Add track to ${shape.label}`}
                      ref={addTrackTargetId === shape.id ? addTrackTriggerRef : null}
                      onClick={() => setAddTrackTargetId(current => current === shape.id ? null : shape.id)}
                      disabled={typeof onAddTrack !== 'function'}
                      aria-haspopup="menu"
                      aria-expanded={addTrackTargetId === shape.id}
                    />
                    {addTrackTargetId === shape.id ? (
                      <div ref={addTrackMenuRef} className="timeline__track-menu-popover" role="menu" aria-label={`Add track to ${shape.label}`}>
                        {SUPPORTED_TRACK_PROPERTIES.filter(item => item.key !== 'path' || isPathTarget(shapeList, shape.id)).map(item => (
                          <button
                            key={item.key}
                            type="button"
                            className="timeline__track-menu-item"
                            onClick={() => handleAddTrack(item.key)}
                            disabled={existingProperties.has(item.key)}
                            role="menuitem"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="timeline__track-lane" onClick={() => handleLayerSelect(shape.id)} />
              </div>

              {shapeTracks.map(track => {
                const isSelectedTrack =
                  activeTrack &&
                  activeTrack.trackId === track.targetId &&
                  activeTrack.property === track.property

                return (
                  <div
                    key={track.property}
                    className={
                      'timeline__track' +
                      (isSelectedTrack ? ' timeline__track--selected' : '')
                    }
                    onPointerDown={e => handlePropertyRowPointerDown(e, track.targetId, track.property)}
                  >

                    <div className="timeline__track-label">
                      <span className="timeline__track-name">
                        {track.property}
                      </span>
                    </div>

                    <div className="timeline__action-cell">
                      <TimelineRowAction
                        icon={<img src="/figma/icon-keyframe.svg" alt="" draggable={false} />}
                        label={`Add ${track.property} keyframe at playhead`}
                        onClick={e => handleAddKeyframeClick(e, track.targetId, track.property)}
                        disabled={typeof onAddKeyframe !== 'function'}
                        title="Add keyframe at playhead"
                      />
                    </div>

                    <div className="timeline__track-lane">
                      <div className="timeline__time-area">
                        {track.keyframes.map(kf => {
                          const isDragging =
                            dragRef.current &&
                            dragRef.current.trackId === track.targetId &&
                            dragRef.current.property === track.property &&
                            dragRef.current.timeOriginal === kf.time

                          const timeValue =
                            isDragging && typeof dragTime === 'number'
                              ? dragTime
                              : kf.time

                          const leftPercent = (timeValue / safeDuration) * 100

                          const isSelectedKF =
                            selectedKeyframe &&
                            selectedKeyframe.trackId === track.targetId &&
                            selectedKeyframe.property === track.property &&
                            selectedKeyframe.time === kf.time

                          return (
                            <div
                              key={kf.time}
                              className={
                                'timeline__keyframe' +
                                (isSelectedKF ? ' timeline__keyframe--selected' : '') +
                                (isDragging ? ' timeline__keyframe--dragging' : '')
                              }
                              style={{ left: `${leftPercent}%` }}
                              draggable={false}
                              onDragStart={e => e.preventDefault()}
                              onPointerDown={e =>
                                handleKeyframePointerDown(
                                  e,
                                  track.targetId,
                                  track.property,
                                  kf.time
                                )
                              }
                              title={`t=${kf.time}`}
                            />
                          )
                        })}
                      </div>
                    </div>

                  </div>
                )
              })}

            </div>
          )
        })}
      </div>
    </section>
  )
}

export default Timeline
