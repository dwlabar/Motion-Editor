// -----------------------------------------------------------------------------
// App.jsx
// -----------------------------------------------------------------------------
// Version History
//
// v0.2.1
// - Restore the Figma shell while retaining model-driven authoring behavior.
//
// v0.2.0
// - Add the SVG Path animation foundation through MorphSVG and the existing model.
//
// v0.0.21
// - Shared model-driven stage dragging and configurable keyboard nudging.
// - Revert derived playback to the imported SVG baseline before rebuilding.
//
// v0.0.1
// - Initial prototype: import SVG, basic GSAP timeline, selection + drag tests.
//
// v0.0.2
// - Removed nested <svg>; imported SVG is now root.
// - Added cloneElement integration for editor behaviors.
// - Added live CTM-corrected selection overlay.
//
// v0.0.3
// - Added dragTick state to re-render selection box during dragging.
// - Fixed selection jitter during scrub by updating on GSAP onUpdate.
// - Improved CTM handling for accurate overlay.
//
// v0.0.4
// - Integrated shapeList from SvgImporter.
// - App now receives (svgTree, shapeList) instead of just svgTree.
// - Cleaned loading flow, maintained all previous behavior.
//
// v0.0.5
// - Added ShapeListPanel UI component.
// - Synced selection between list and SVG canvas.
// - Added sidebar layout for future editor expansion.
//
// v0.0.6
// - Integrated Timeline component into the main layout.
// - Timeline receives: shapeList, selectedId, currentTime, duration.
// - Timeline now displays rows + playhead synced to scrubber.
//
// v0.0.7
// - Introduced demoAnimationModel as the first animation data model.
// - App now derives timeline duration and currentTime from the model (initial pass).
//
// v0.0.8
// - Hooked App into buildGsapTimeline and briefly derived duration from GSAP.
//   (This was transitional and intentionally undone later.)
//
// v0.0.9
// - Added keyframe selection state and KeyframeInspector integration.
//
// v0.0.10
// - Phase 2 Step 4.5:
//   - Re-established animationModel.duration as the single timeline timebase.
//   - Removed GSAP duration from all editor math.
//   - Timeline, playhead, keyframes, scrubber, and inspector now agree on time.
//
// v0.0.11
// - Phase 2 Step 5:
//   - animationModel made editable via immutable updates.
//   - Added updateKeyframe() for editing keyframe time/value.
//
// v0.0.12
// - Phase 2 Step 5 fix attempt:
//   - Reset SVG before rebuilding timeline (incomplete approach).
//
// v0.0.13
// - Phase 2 Step 5 fix (correct):
//   - Kill old GSAP timeline on rebuild.
//   - Clear animated props on all track targets.
//   - Apply model t=0 state via gsap.set before rebuilding.
//   - Restore scrub progress after rebuild.
//   - Keep selectedKeyframe in sync when a keyframe time is edited.
//
// v0.0.14
// - Phase 2 Authoring:
//   - Added handleAddTrack() to create empty tracks (per-shape, per-property).
//   - Wired the Add Track popover into the animation model.
//
// v0.0.20
// - Reworked the editor shell around a stage, timeline, and inspector layout.
// - Moved visible target selection and Add Track controls into timeline layers.
//
// v0.0.15
// - Phase 2 Authoring:
//   - Added handleAddKeyframe() to create a keyframe at the playhead time.
//   - New keyframe captures the current SVG value (position/opacity/scale/rotation).
//   - Fix: resetSvgToModelStart only applies keyframe values when time === 0.
//
// v0.0.16
// - Phase 2 Authoring:
//   - Added selectedTrack state.
//   - Creating a track auto-selects that track.
//   - Selecting a keyframe also selects its track.
//   - Added Delete/Backspace shortcut to delete the selected keyframe.
//
// v0.0.19
// - Drag translations now compose in parent SVG space, preserving rotation,
//   scale, and authored transforms.
//
// v0.0.18
// - Restored project SVG parsing before replacing editor state.
// - Project-load failures now leave the current project and modal intact.
//
// v0.0.17
// - Phase 4.3:
//   - Added TopBar + AppModal shell.
//   - Moved ExportPanel into modal.
//   - Added FilePanel modal (download/load JSON project).
//   - Added debounced autosave for last session to localStorage.
// -----------------------------------------------------------------------------

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, cloneElement } from 'react'
import { gsap } from 'gsap'
import './styles/components/_SvgEditor.scss'
import SvgImporter from './components/SvgImporter'
import Timeline from './components/Timeline'
import Inspector from './components/Inspector'
import TransportControls from './components/TransportControls'
import { EASING_PRESETS, normalizeKeyframeEasing } from './utility/keyframeEasing'
import { buildGsapTimeline } from './utility/buildGsapTimeline'
import ExportPanel from './components/ExportPanel'
import TopBar from './components/TopBar'
import AppModal from './components/AppModal'
import FilePanel from './components/FilePanel'
import { parseSvgTextToJsxAndShapes } from './utility/parseSvgToJsx'
import { authorPosition, getAuthoringTime } from './utility/authorPosition'
import { isEditorControl, readPosition, useStagePositionAuthoring } from './hooks/useStagePositionAuthoring'
import { captureSvgPlaybackState } from './utility/captureSvgPlaybackState'
import { authorPath } from './utility/authorPath'
import { isPathTarget, readPath } from './utility/pathGeometry'
import { useStagePathAuthoring } from './hooks/useStagePathAuthoring'
import PathHandles from './components/PathHandles'
import { useDocumentFit } from './hooks/useDocumentFit'
import { useNotifications } from './hooks/useNotifications'
import NotificationViewport from './components/NotificationViewport'

const LAST_SESSION_STORAGE_KEY = 'motion-editor:last-session:v1'
const AUTOSAVE_DEBOUNCE_MS = 800

function createEmptyAnimationModel() {
  return { version: 1, id: crypto.randomUUID(), label: 'Untitled Animation', duration: 2, tracks: [] }
}

function App() {
  const svgRef = useRef(null)
  const stageContentRef = useRef(null)
  const selectionOverlayRef = useRef(null)
  const timelineRef = useRef(null)
  const playingRef = useRef(false)
  const loopingRef = useRef(false)
  const autosaveTimerRef = useRef(null)

  const [svgTree, setSvgTree] = useState(null)
  const [svgSource, setSvgSource] = useState('')
  const { notify } = useNotifications()
  const [shapeList, setShapeList] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  const [animationModel, setAnimationModel] = useState(createEmptyAnimationModel)

  const [dragTick, setDragTick] = useState(0)
  const [scrub, setScrub] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLooping, setIsLooping] = useState(false)
  const [selectedKeyframe, setSelectedKeyframe] = useState(null)

  // Track-level selection (authoring focus)
  const [selectedTrack, setSelectedTrack] = useState(null)

  const clearSelection = useCallback(() => {
    setSelectedId(null)
    setSelectedTrack(null)
    setSelectedKeyframe(null)
  }, [])

  const pausePlayback = useCallback(() => {
    timelineRef.current?.pause()
    playingRef.current = false
    setIsPlaying(false)
  }, [])

  function handleScrubChange(progress) {
    pausePlayback()
    scrubRef.current = progress
    timelineRef.current?.progress(progress)
    setScrub(progress)
  }

  function handlePlayPause() {
    const tl = timelineRef.current
    if (!tl) return
    if (playingRef.current) {
      pausePlayback()
      return
    }
    if (tl.progress() >= 1) tl.totalTime(0)
    playingRef.current = true
    setIsPlaying(true)
    tl.play()
  }

  function handleLoopChange() {
    const next = !loopingRef.current
    loopingRef.current = next
    setIsLooping(next)
    const tl = timelineRef.current
    if (!tl) return
    // Reset the repeat iteration while retaining the current cycle's time.
    const time = tl.time()
    tl.repeat(next ? -1 : 0).totalTime(time, true)
  }

  function handleStagePointerDown(event) {
    if (event.button !== 0 || event.isPrimary === false || isEditorControl(event.target)) return
    const element = event.target.closest?.('[id]')
    if (event.target.closest?.('.svg-editor__path-handles')) return
    if (element && element !== svgRef.current && svgRef.current?.contains(element) && element.getBBox) return
    clearSelection()
    svgRef.current?.closest('.svg-editor')?.focus({ preventScroll: true })
  }

  function handleTargetSelect(targetId) {
    setSelectedId(targetId)
    setSelectedTrack(null)
    setSelectedKeyframe(null)
    // Layer selection hands keyboard authoring to the canvas, including when
    // the target is outside the scene and cannot be clicked there directly.
    svgRef.current?.closest('.svg-editor')?.focus({ preventScroll: true })
  }

  // App-level modal state
  const [activeModal, setActiveModal] = useState(null)

  // Editor configuration; intentionally excluded from the project model.
  const [nudgeAmount, setNudgeAmount] = useState(1)
  const scrubRef = useRef(scrub)

  // ---------------------------------------------------------------------------
  // Timeline timebase (model-driven)
  // ---------------------------------------------------------------------------
  const timelineDuration = animationModel.duration
  const currentTime = scrub * timelineDuration

  function handleDurationChange(duration) {
    if (!Number.isFinite(duration) || duration <= 0) {
      notify({ variant: 'error', message: 'Enter a finite duration greater than 0 seconds.' })
      return
    }
    const lastKeyframeTime = animationModel.tracks.reduce((latest, track) =>
      (track.keyframes || []).reduce((time, keyframe) => Math.max(time, keyframe.time), latest), 0)
    if (duration < lastKeyframeTime) {
      notify({ variant: 'error', message: `Duration must be at least ${lastKeyframeTime}s (last keyframe).` })
      return
    }
    if (duration === timelineDuration) return

    // Preserve absolute seconds, clamping only when the playhead exceeds the new end.
    // React batches these updates; the scrub ref is refreshed before GSAP rebuilds.
    setScrub(Math.min(currentTime, duration) / duration)
    setAnimationModel(model => ({ ...model, duration }))
  }

  const commitPosition = useCallback((targetId, time, position) => {
    const committedTime = getAuthoringTime(time, timelineDuration)
    setAnimationModel(model => authorPosition(model, targetId, committedTime, position))
    setSelectedId(targetId)
    setSelectedTrack({ trackId: targetId, property: 'position' })
    setSelectedKeyframe({ trackId: targetId, property: 'position', time: committedTime })
  }, [timelineDuration])

  const refreshOverlay = useCallback(() => setDragTick(tick => tick + 1), [])
  useDocumentFit({ svgRef, svgTree, stageContentRef, onLayoutChange: refreshOverlay })
  const { handlePointerDown, nudge } = useStagePositionAuthoring({
    svgRef, svgTree, animationModel, currentTime, selectedId, nudgeAmount,
    onSelectTarget: handleTargetSelect,
    onAuthorPosition: commitPosition,
    onPreviewChange: refreshOverlay
  })

  const pathTargetId = selectedTrack?.property === 'path' &&
    selectedTrack.trackId === selectedId && isPathTarget(shapeList, selectedId)
    ? selectedId : null

  const commitPath = useCallback((targetId, time, value) => {
    if (!isPathTarget(shapeList, targetId)) return
    const committedTime = getAuthoringTime(time, timelineDuration)
    setAnimationModel(model => authorPath(model, targetId, committedTime, value))
    setSelectedId(targetId)
    setSelectedTrack({ trackId: targetId, property: 'path' })
    setSelectedKeyframe({ trackId: targetId, property: 'path', time: committedTime })
  }, [shapeList, timelineDuration])

  const { handleAnchorPointerDown, isDragging: isPathDragging } = useStagePathAuthoring({
    svgRef, svgTree, animationModel, currentTime, targetId: pathTargetId, activeModal,
    onAuthorPath: commitPath, onPreviewChange: refreshOverlay
  })

  // ---------------------------------------------------------------------------
  // Modal helpers
  // ---------------------------------------------------------------------------
  function closeModal() {
    setActiveModal(null)
  }

  function openModal(nextModal) {
    pausePlayback()
    setActiveModal(nextModal)
  }

  // ---------------------------------------------------------------------------
  // SVG Load
  // ---------------------------------------------------------------------------
  function handleSvgLoad({ svgTree: loadedTree, shapeList: loadedShapes, svgSource, warnings = [] }) {
    pausePlayback()
    notify({
      variant: warnings.length ? 'warning' : 'success',
      message: warnings.length ? `SVG imported. ${warnings.join(' ')}` : 'SVG imported successfully.'
    })
    setSvgTree(loadedTree)
    setShapeList(loadedShapes || [])
    setSvgSource(typeof svgSource === 'string' ? svgSource : '')
    setAnimationModel(createEmptyAnimationModel())

    // Reset selection when loading a new SVG
    setSelectedId(null)
    setSelectedKeyframe(null)
    setSelectedTrack(null)
    setScrub(0)
    closeModal()
  }

  // ---------------------------------------------------------------------------
  // Restore last session (localStorage)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false
    async function restoreLastSession() {
      let restored = null

      try {
        const raw = localStorage.getItem(LAST_SESSION_STORAGE_KEY)
        if (!raw) return
        restored = JSON.parse(raw)
      } catch {
        return
      }

      if (!restored || typeof restored !== 'object') return

      const restoredModel = restored.animationModel
      const restoredSvgSource = restored.svgSource

      if (
        !restoredModel ||
        Number(restoredModel.version) !== 1 ||
        !Array.isArray(restoredModel.tracks)
      ) {
        return
      }

      if (typeof restoredSvgSource !== 'string' || restoredSvgSource.length === 0) {
        return
      }

      const parsed = await parseSvgTextToJsxAndShapes(restoredSvgSource)
      if (cancelled) return
      if (!parsed || !parsed.svgTree) {
        notify({ variant: 'error', message: parsed?.error || 'Saved SVG could not be restored.' })
        return
      }

      setSvgTree(parsed.svgTree)
      if (parsed.warnings?.length) {
        notify({ variant: 'warning', message: `Saved SVG restored. ${parsed.warnings.join(' ')}` })
      }
      setShapeList(parsed.shapeList || [])
      setSvgSource(restoredSvgSource)
      setAnimationModel(normalizeKeyframeEasing(restoredModel))
      setSelectedId(null)
      setSelectedKeyframe(null)
      setSelectedTrack(null)
      setScrub(0)
    }

    restoreLastSession()
    return () => { cancelled = true }
  }, [notify])

  // ---------------------------------------------------------------------------
  // Debounced autosave (model + svg source)
  // ---------------------------------------------------------------------------
  const hasAutosave = useMemo(() => {
    try {
      return Boolean(localStorage.getItem(LAST_SESSION_STORAGE_KEY))
    } catch {
      return false
    }
  }, [svgSource, animationModel])

  function writeAutosaveNow(nextPayload) {
    try {
      localStorage.setItem(LAST_SESSION_STORAGE_KEY, JSON.stringify(nextPayload))
    } catch {
      // If storage is unavailable or full, fail silently.
      // We do not want to block editing.
    }
  }

  function clearAutosave() {
    try {
      localStorage.removeItem(LAST_SESSION_STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    // Do NOT autosave until an SVG has been loaded or restored.
    if (!svgSource || typeof svgSource !== 'string' || svgSource.length === 0) {
      return
    }

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current)
      autosaveTimerRef.current = null
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      const payload = {
        version: 1,
        savedAt: Date.now(),
        svgSource,
        animationModel
      }

      try {
        localStorage.setItem(
          LAST_SESSION_STORAGE_KEY,
          JSON.stringify(payload)
        )
      } catch {
        // ignore
      }

      autosaveTimerRef.current = null
    }, AUTOSAVE_DEBOUNCE_MS)

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current)
        autosaveTimerRef.current = null
      }
    }
  }, [animationModel, svgSource])

  // ---------------------------------------------------------------------------
  // Keyframe Selection
  // ---------------------------------------------------------------------------
  function handleKeyframeSelect(trackId, property, time) {
    const safeTrackId = String(trackId)
    const safeProperty = String(property)

    setSelectedId(safeTrackId)

    setSelectedKeyframe({
      trackId: safeTrackId,
      property: safeProperty,
      time: Number(time)
    })

    setSelectedTrack({
      trackId: safeTrackId,
      property: safeProperty
    })
  }

  // ---------------------------------------------------------------------------
  // Phase 2 Authoring: Add empty track (no keyframes yet)
  // ---------------------------------------------------------------------------
  function handleAddTrack({ targetId, property }) {
    const safeTargetId = String(targetId)
    const safeProperty = String(property)

    if (!safeTargetId || !safeProperty) return
    if (safeProperty === 'path' && !isPathTarget(shapeList, safeTargetId)) return

    setAnimationModel(prevModel => {
      const prevTracks = Array.isArray(prevModel.tracks) ? prevModel.tracks : []

      const alreadyExists = prevTracks.some(t => {
        return t && t.targetId === safeTargetId && t.property === safeProperty
      })
      if (alreadyExists) return prevModel

      const nextTrack = {
        targetId: safeTargetId,
        property: safeProperty,
        keyframes: []
      }

      return {
        ...prevModel,
        tracks: [...prevTracks, nextTrack]
      }
    })

    if (safeProperty === 'path') setSelectedId(safeTargetId)
    setSelectedTrack({
      trackId: safeTargetId,
      property: safeProperty
    })

    // If the inspector is showing a keyframe for a different shape/property,
    // keep it. If it is showing something that becomes invalid later, Timeline
    // and Inspector already handle missing safely. This is intentionally minimal.
  }

  // ---------------------------------------------------------------------------
  // Phase 2 Authoring: Add keyframe at time (captures current SVG value)
  // ---------------------------------------------------------------------------
  const handleAddKeyframe = useCallback(({ trackId, property, time }) => {
    const safeTrackId = String(trackId)
    const safeProperty = String(property)
    const safeTime = getAuthoringTime(Number(time), timelineDuration)

    if (!safeTrackId || !safeProperty) return
    if (!Number.isFinite(safeTime)) return
    if (!svgRef.current) return

    if (safeProperty === 'path' && !isPathTarget(shapeList, safeTrackId)) return
    const el = svgRef.current.getElementById(safeTrackId)
    const capturedValue = captureCurrentValueForTrack(el, safeProperty)
    if (capturedValue === null) return

    setAnimationModel(prevModel => {
      const prevTracks = Array.isArray(prevModel.tracks) ? prevModel.tracks : []
      const trackIndex = prevTracks.findIndex(t => {
        return t && t.targetId === safeTrackId && t.property === safeProperty
      })
      if (trackIndex === -1) return prevModel

      const prevTrack = prevTracks[trackIndex]
      const prevKeyframes = Array.isArray(prevTrack.keyframes) ? prevTrack.keyframes : []

      const clampedTime = clampNumber(safeTime, 0, prevModel.duration)

      const alreadyExists = prevKeyframes.some(kf => Number(kf.time) === Number(clampedTime))
      if (alreadyExists) return prevModel

      if (safeProperty === 'position') {
        return authorPosition(prevModel, safeTrackId, clampedTime, capturedValue)
      }

      if (safeProperty === 'path') {
        return authorPath(prevModel, safeTrackId, clampedTime, capturedValue)
      }

      const nextKeyframes = [...prevKeyframes, { time: clampedTime, value: capturedValue }]
      nextKeyframes.sort((a, b) => Number(a.time) - Number(b.time))

      const nextTrack = {
        ...prevTrack,
        keyframes: nextKeyframes
      }

      const nextTracks = prevTracks.map((t, idx) => {
        if (idx !== trackIndex) return t
        return nextTrack
      })

      return {
        ...prevModel,
        tracks: nextTracks
      }
    })

    setSelectedKeyframe({
      trackId: safeTrackId,
      property: safeProperty,
      time: Number(safeTime)
    })

    setSelectedId(safeTrackId)
    setSelectedTrack({
      trackId: safeTrackId,
      property: safeProperty
    })
  }, [timelineDuration, shapeList])

  // ---------------------------------------------------------------------------
  // Delete keyframe (selectedKeyframe only)
  // ---------------------------------------------------------------------------
  const deleteSelectedKeyframe = useCallback(() => {
    if (!selectedKeyframe) return

    const safeTrackId = String(selectedKeyframe.trackId)
    const safeProperty = String(selectedKeyframe.property)
    const safeTime = Number(selectedKeyframe.time)

    if (!safeTrackId || !safeProperty) return
    if (!Number.isFinite(safeTime)) return

    setAnimationModel(prevModel => {
      const prevTracks = Array.isArray(prevModel.tracks) ? prevModel.tracks : []
      const trackIndex = prevTracks.findIndex(t => {
        return t && t.targetId === safeTrackId && t.property === safeProperty
      })
      if (trackIndex === -1) return prevModel

      const prevTrack = prevTracks[trackIndex]
      const prevKeyframes = Array.isArray(prevTrack.keyframes) ? prevTrack.keyframes : []

      const nextKeyframes = prevKeyframes.filter(kf => Number(kf.time) !== Number(safeTime))
      if (nextKeyframes.length === prevKeyframes.length) return prevModel

      const nextTrack = {
        ...prevTrack,
        keyframes: nextKeyframes
      }

      const nextTracks = prevTracks.map((t, idx) => {
        if (idx !== trackIndex) return t
        return nextTrack
      })

      return {
        ...prevModel,
        tracks: nextTracks
      }
    })

    setSelectedKeyframe(null)
  }, [selectedKeyframe])

  // ---------------------------------------------------------------------------
  // Keyboard shortcuts
  // ---------------------------------------------------------------------------
  useEffect(() => {
    function handleEscape(event) {
      if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing) return
      if (activeModal || isTextEditingTarget(event.target)) return
      if (document.querySelector('[role="menu"], [role="dialog"], dialog[open]')) return
      clearSelection()
    }
    // Clear selection before drag cancellation can refresh/rebind listeners.
    // Input drafts, menus and modals retain their existing Escape behavior.
    window.addEventListener('keydown', handleEscape, true)
    return () => window.removeEventListener('keydown', handleEscape, true)
  }, [activeModal, clearSelection])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.defaultPrevented || e.isComposing || isPathDragging()) return
      if (isTextEditingTarget(e.target)) return

      if (activeModal) {
        // While a modal is open, we avoid editor shortcuts to prevent conflicts.
        return
      }

      if (e.key.startsWith('Arrow')) {
        if (isEditorControl(e.target)) return
        if (document.querySelector('[role="menu"], [role="dialog"], dialog[open]')) return
        if (selectedId) pausePlayback()
        if (nudge(e)) e.preventDefault()
        return
      }

      // Delete selected keyframe
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelectedKeyframe()
        return
      }

      // Add keyframe at playhead
      if (e.key === 'k' || e.key === 'K') {
        if (!selectedTrack) return

        handleAddKeyframe({
          trackId: selectedTrack.trackId,
          property: selectedTrack.property,
          time: currentTime
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedTrack, selectedId, currentTime, activeModal, deleteSelectedKeyframe, handleAddKeyframe, nudge, isPathDragging, pausePlayback])

  // ---------------------------------------------------------------------------
  // Phase 2 Step 5: Update keyframe time/value in the model (immutable)
  // ---------------------------------------------------------------------------
  function updateKeyframe({ trackId, property, timeOriginal, timeNext, valueNext, easeToNext }) {
    const safeTrackId = String(trackId)
    const safeProperty = String(property)
    const safeTimeOriginal = Number(timeOriginal)

    const hasTimeNext = typeof timeNext !== 'undefined' && timeNext !== null
    const hasValueNext = typeof valueNext !== 'undefined'
    const hasEaseNext = EASING_PRESETS.some(preset => preset.value === easeToNext)

    if (!Number.isFinite(safeTimeOriginal)) return

    pausePlayback()
    // Calculate before setting state so selection follows the edited keyframe
    // even when sorting changes its index or React defers a state updater.
    const prevModel = animationModel
    const prevTracks = prevModel.tracks || []
    const trackIndex = prevTracks.findIndex(t => {
      return t.targetId === safeTrackId && t.property === safeProperty
    })
    if (trackIndex === -1) return

    const prevTrack = prevTracks[trackIndex]
    const prevKeyframes = prevTrack.keyframes || []

    const keyframeIndex = prevKeyframes.findIndex(k => Number(k.time) === safeTimeOriginal)
    if (keyframeIndex === -1) return

    const nextKeyframes = prevKeyframes.map((kf, idx) => {
      if (idx !== keyframeIndex) return kf

      const nextKf = { ...kf }

      if (hasTimeNext) {
        const nextTime = Number(timeNext)
        if (Number.isFinite(nextTime)) {
          const clamped = clampNumber(nextTime, 0, prevModel.duration)
          nextKf.time = clamped
        }
      }

      if (hasValueNext) {
        nextKf.value = valueNext
      }
      if (hasEaseNext && keyframeIndex < prevKeyframes.length - 1) {
        nextKf.easeToNext = easeToNext
      }

      return nextKf
    })

    const timeCounts = countKeyframeTimes(nextKeyframes)
    const hasCollision = Object.values(timeCounts).some(count => count > 1)
    if (hasCollision) return

    const updatedKf = nextKeyframes[keyframeIndex]
    nextKeyframes.sort((a, b) => Number(a.time) - Number(b.time))

    const nextTrack = {
      ...prevTrack,
      keyframes: nextKeyframes
    }

    const nextTracks = prevTracks.map((t, idx) => {
      if (idx !== trackIndex) return t
      return nextTrack
    })

    setAnimationModel({
      ...prevModel,
      tracks: nextTracks
    })

    // Keep inspector selection stable only if the update was actually committed.
    if (hasTimeNext && selectedKeyframe) {
      const isSameSelection =
        selectedKeyframe.trackId === safeTrackId &&
        selectedKeyframe.property === safeProperty &&
        Number(selectedKeyframe.time) === safeTimeOriginal

      if (isSameSelection) {
        setSelectedKeyframe({
          trackId: safeTrackId,
          property: safeProperty,
          time: Number(updatedKf.time)
        })
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Phase 2 Step 5 fix: Clear animated props and apply model t=0 state
  // ---------------------------------------------------------------------------
  function resetSvgToModelStart(model) {
    const svgEl = svgRef.current
    if (!svgEl) return

    // Clear only what we currently animate in this project.
    // This prevents mid-scrub styles from becoming the new baseline.
    // The previous GSAP context now reverts these properties to the imported
    // SVG baseline, including authored transforms, before this function runs.

      ; (model.tracks || []).forEach(track => {
        const el = svgEl.getElementById(track.targetId)
        if (!el) return

        const kfAtZero = (track.keyframes || []).find(kf => Number(kf.time) === 0)
        if (!kfAtZero) return

        if (track.property === 'path' && el.localName === 'path') {
          gsap.set(el, { morphSVG: kfAtZero.value })
        }

        if (track.property === 'position') {
          const xVal = kfAtZero.value && typeof kfAtZero.value.x === 'number' ? kfAtZero.value.x : 0
          const yVal = kfAtZero.value && typeof kfAtZero.value.y === 'number' ? kfAtZero.value.y : 0
          gsap.set(el, { x: xVal, y: yVal })
        }

        if (track.property === 'opacity') {
          gsap.set(el, { opacity: kfAtZero.value })
        }

        if (track.property === 'scale') {
          gsap.set(el, { scale: kfAtZero.value, transformOrigin: 'center' })
        }

        if (track.property === 'rotation') {
          gsap.set(el, { rotation: kfAtZero.value, transformOrigin: 'center' })
        }
      })
  }

  // ---------------------------------------------------------------------------
  // Build / rebuild GSAP timeline (playback only)
  // ---------------------------------------------------------------------------
  useLayoutEffect(() => {
    scrubRef.current = scrub
  }, [scrub])

  useLayoutEffect(() => {
    if (!svgTree || !svgRef.current) return

    const targets = [...new Set((animationModel.tracks || []).map(track => track.targetId))]
      .map(id => svgRef.current.getElementById(id)).filter(Boolean)
    const restoreBaseline = captureSvgPlaybackState(targets)
    const context = gsap.context(() => {
      resetSvgToModelStart(animationModel)
      const tl = buildGsapTimeline(animationModel, svgRef, () => {
        const progress = timelineRef.current?.progress() ?? 0
        scrubRef.current = progress
        setScrub(progress)
        refreshOverlay()
      })
      timelineRef.current = tl
      tl.repeat(loopingRef.current ? -1 : 0)
      tl.eventCallback('onComplete', pausePlayback)
      tl.pause(0)
      tl.progress(scrubRef.current, true)
      if (playingRef.current && scrubRef.current < 1) tl.play()
      else if (scrubRef.current >= 1) pausePlayback()
    }, svgRef)

    refreshOverlay()
    return () => {
      context.revert()
      restoreBaseline()
      timelineRef.current = null
    }
  }, [svgTree, animationModel, refreshOverlay, pausePlayback])

  // ---------------------------------------------------------------------------
  // Scrub → GSAP
  // ---------------------------------------------------------------------------
  // User scrubs seek directly in handleScrubChange. Playback updates React's
  // playhead from GSAP without seeking back on every animation frame.

  // ---------------------------------------------------------------------------
  // Dragging Logic (shared stage-authoring hook above)
  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // Selection Box
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!svgTree) return
    // Selection bounds live outside the source viewport, so also refresh when
    // responsive sizing or scrolling changes the scene-to-workspace mapping.
    const observer = new ResizeObserver(refreshOverlay)
    if (svgRef.current) observer.observe(svgRef.current)
    if (selectionOverlayRef.current) observer.observe(selectionOverlayRef.current)
    window.addEventListener('resize', refreshOverlay)
    window.addEventListener('scroll', refreshOverlay, true)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', refreshOverlay)
      window.removeEventListener('scroll', refreshOverlay, true)
    }
  }, [svgTree, refreshOverlay])

  function renderSelectionBox() {
    if (!selectedId || !svgRef.current) return null

    const svgEl = svgRef.current
    const el = svgEl.getElementById(selectedId)
    if (!el) return null

    const bbox = el.getBBox()
    const corners = [
      { x: bbox.x, y: bbox.y },
      { x: bbox.x + bbox.width, y: bbox.y },
      { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
      { x: bbox.x, y: bbox.y + bbox.height }
    ]

    const screenCTM = el.getScreenCTM()
    if (!screenCTM) return null

    // Map local geometry through screen space into the editor overlay. Using
    // both CTMs retains nested, GSAP and responsive SVG transforms without
    // making the imported viewBox or its clipping part of editor selection.
    const rootCTM = selectionOverlayRef.current?.getScreenCTM()
    if (!rootCTM || Math.abs(rootCTM.a * rootCTM.d - rootCTM.b * rootCTM.c) < 1e-12) return null

    const rootCTMInverse = rootCTM.inverse()

    const ptsInRoot = corners.map(pt => {
      const p = svgEl.createSVGPoint()
      p.x = pt.x
      p.y = pt.y
      const inScreen = p.matrixTransform(screenCTM)
      return inScreen.matrixTransform(rootCTMInverse)
    })

    const xs = ptsInRoot.map(p => p.x)
    const ys = ptsInRoot.map(p => p.y)

    return (
      <rect
        x={Math.min(...xs)}
        y={Math.min(...ys)}
        width={Math.max(...xs) - Math.min(...xs)}
        height={Math.max(...ys) - Math.min(...ys)}
        fill="none"
        stroke="var(--color-playhead)"
        strokeDasharray="3"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
        pointerEvents="none"
      />
    )
  }

  // ---------------------------------------------------------------------------
  // Inject SVG Editor Layer
  // ---------------------------------------------------------------------------
  const svgWithEditorIntegration =
    svgTree &&
    cloneElement(
      svgTree,
      {
        ...svgTree.props,
        // A new source must get fresh DOM nodes even if its root id is reused.
        // Old playback cleanup must never restore geometry onto the new SVG.
        key: svgSource,
        ref: svgRef,
        onPointerDown: handlePointerDown
      },
      <>
        {svgTree.props.children}
        {pathTargetId && !activeModal ? (
          <PathHandles
            svgRef={svgRef} targetId={pathTargetId}
            onPointerDown={handleAnchorPointerDown} onLayoutChange={refreshOverlay}
          />
        ) : null}
      </>
    )

  // ---------------------------------------------------------------------------
  // Project load handler (from FilePanel)
  // ---------------------------------------------------------------------------
  async function handleLoadProject({ svgSourceText, animationModelNext }) {
    const safeSvgText = typeof svgSourceText === 'string' ? svgSourceText : ''
    const safeModel = animationModelNext && typeof animationModelNext === 'object'
      ? animationModelNext
      : null

    if (
      !safeSvgText ||
      !safeModel ||
      Number(safeModel.version) !== 1 ||
      !Array.isArray(safeModel.tracks)
    ) {
      return false
    }

    const parsed = await parseSvgTextToJsxAndShapes(safeSvgText)
    if (!parsed || !parsed.svgTree) {
      notify({ variant: 'error', message: parsed?.error || 'Project SVG could not be imported.' })
      return false
    }

    pausePlayback()
    setSvgTree(parsed.svgTree)
    if (parsed.warnings?.length) {
      notify({ variant: 'warning', message: `Project SVG imported. ${parsed.warnings.join(' ')}` })
    }
    setShapeList(parsed.shapeList || [])
    setSvgSource(safeSvgText)
    setAnimationModel(normalizeKeyframeEasing(safeModel))
    setSelectedId(null)
    setSelectedKeyframe(null)
    setSelectedTrack(null)
    setScrub(0)

    closeModal()
    return true
  }

  // ---------------------------------------------------------------------------
  // Layout
  // ---------------------------------------------------------------------------
  return (
    <div className="app-shell">

      {!activeModal && <NotificationViewport />}

      <TopBar
        activeMenu={activeModal}
        onOpenFile={() => openModal('file')}
        onOpenExport={() => openModal('export')}
        onOpenAbout={() => openModal('about')}
      />

      <main className="editor-layout">
        <section className="editor-layout__primary" onPointerDownCapture={pausePlayback}>
          <section className="stage-panel" aria-label="SVG stage" onPointerDown={handleStagePointerDown}>
            <div className="stage-panel__content" ref={stageContentRef}>
              {!svgTree ? <SvgImporter onLoad={handleSvgLoad} /> : null}
              {svgTree ? (
                <div className="svg-editor" tabIndex={0} aria-label="SVG canvas. Arrow keys nudge the selected object.">
                  <div className="svg-editor__document">{svgWithEditorIntegration}</div>
                </div>
              ) : null}
            </div>
            {svgTree ? (
              <svg className="svg-editor-overlay" ref={selectionOverlayRef} aria-hidden="true">
                {renderSelectionBox()}
              </svg>
            ) : null}
          </section>

          <Timeline
            shapeList={shapeList}
            selectedId={selectedId}
            onSelectTarget={handleTargetSelect}
            currentTime={currentTime}
            duration={timelineDuration}
            animationModel={animationModel}
            selectedKeyframe={selectedKeyframe}
            onKeyframeSelect={handleKeyframeSelect}
            onUpdateKeyframe={updateKeyframe}
            onAddKeyframe={handleAddKeyframe}
            onScrubChange={handleScrubChange}
            selectedTrack={selectedTrack}
            onSelectTrack={track => {
              setSelectedTrack(track)
              setSelectedId(track.trackId)
              setSelectedKeyframe(null)
            }}
            onAddTrack={handleAddTrack}
          />
        </section>

        <aside className="inspector" aria-label="Inspector">
          <TransportControls
            modelId={animationModel.id}
            duration={timelineDuration}
            onDurationChange={handleDurationChange}
            isPlaying={isPlaying}
            isLooping={isLooping}
            disabled={!svgTree}
            onRestart={() => handleScrubChange(0)}
            onPlayPause={handlePlayPause}
            onLoopChange={handleLoopChange}
          />
          <Inspector
            selectedId={selectedId}
            nudgeAmount={nudgeAmount}
            onNudgeAmountChange={setNudgeAmount}
            selectedKeyframe={selectedKeyframe}
            animationModel={animationModel}
            onUpdateKeyframe={updateKeyframe}
          />
        </aside>
      </main>

      {activeModal ? (
        <AppModal
          title={activeModal === 'file' ? 'File' : activeModal === 'export' ? 'Export' : 'About'}
          onClose={closeModal}
        >
          {/* Keep notifications inside the active modal accessibility scope. */}
          <NotificationViewport />
          {activeModal === 'file' ? (
            <>
              <SvgImporter onLoad={handleSvgLoad} />
              <FilePanel
                svgSource={svgSource}
                animationModel={animationModel}
                hasAutosave={hasAutosave}
                onLoadProject={handleLoadProject}
                onSaveLocalNow={() => {
                  const payload = {
                    version: 1,
                    savedAt: Date.now(),
                    svgSource: typeof svgSource === 'string' ? svgSource : '',
                    animationModel
                  }
                  writeAutosaveNow(payload)
                }}
                onClearAutosave={clearAutosave}
              />
            </>
          ) : null}

          {activeModal === 'export' ? (
            <ExportPanel animationModel={animationModel} />
          ) : null}
          {activeModal === 'about' ? (
            <div className="app-modal__about">
              <h2>Motion Editor</h2>
              <p>Create SVG animations with Motion Editor: import artwork, animate shapes and path anchors, and export GSAP or React code.</p>
            </div>
          ) : null}
        </AppModal>
      ) : null}

      {/* force usage to keep dragTick from being “dead” if you ever lint strictly */}
      <div style={{ display: 'none' }}>{dragTick}</div>
    </div>
  )
}

function clampNumber(num, min, max) {
  if (num < min) return min
  if (num > max) return max
  return num
}

function countKeyframeTimes(keyframes) {
  const counts = {}
  keyframes.forEach(kf => {
    const key = String(Number(kf.time))
    if (!counts[key]) counts[key] = 0
    counts[key] += 1
  })
  return counts
}

function captureCurrentValueForTrack(el, property) {
  if (!el) return null

  if (property === 'path') return readPath(el)

  if (property === 'position') {
    return readPosition(el)
  }

  if (property === 'opacity') {
    const op = Number(gsap.getProperty(el, 'opacity'))
    return Number.isFinite(op) ? op : 1
  }

  if (property === 'scale') {
    const sc = Number(gsap.getProperty(el, 'scale'))
    return Number.isFinite(sc) ? sc : 1
  }

  if (property === 'rotation') {
    const rot = Number(gsap.getProperty(el, 'rotation'))
    return Number.isFinite(rot) ? rot : 0
  }

  return null
}

function isTextEditingTarget(targetEl) {
  if (!targetEl) return false

  const tagName = typeof targetEl.tagName === 'string'
    ? targetEl.tagName.toLowerCase()
    : ''

  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true
  }

  if (targetEl.isContentEditable) return true

  return false
}

export default App
