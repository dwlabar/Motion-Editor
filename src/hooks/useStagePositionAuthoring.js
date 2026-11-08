import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { captureSvgPlaybackState } from '../utility/captureSvgPlaybackState'

const DRAG_THRESHOLD = 3 // Screen pixels, matching timeline keyframe dragging.
const DIRECTIONS = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1]
}

export function readPosition(element) {
  const x = Number(gsap.getProperty(element, 'x'))
  const y = Number(gsap.getProperty(element, 'y'))
  return {
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0
  }
}

export function isEditorControl(target) {
  const control = target?.closest?.(
    'input, textarea, select, button, a[href], summary, dialog, [contenteditable], ' +
    '[role="dialog"], [role="menu"], [role="menuitem"], [role="listbox"], ' +
    '[role="option"], [role="combobox"], [role="slider"], [role="spinbutton"], ' +
    '[role="button"], [role="tab"], [role="tree"], [role="grid"], [popover], [tabindex]'
  )
  return target?.isContentEditable || Boolean(control && !control.classList.contains('svg-editor'))
}

export function useStagePositionAuthoring({
  svgRef, svgTree, animationModel, currentTime, selectedId, nudgeAmount,
  onSelectTarget, onAuthorPosition, onPreviewChange
}) {
  const dragRef = useRef(null)

  const finishDrag = useCallback((commit = false) => {
    const drag = dragRef.current
    if (!drag) return
    dragRef.current = null
    // Revert transient GSAP state before the authoritative model rebuild.
    drag.preview.revert()
    drag.restore()
    if (drag.element.hasPointerCapture?.(drag.pointerId)) {
      drag.element.releasePointerCapture(drag.pointerId)
    }
    if (commit && drag.active && drag.position && (
      drag.position.x !== drag.startPosition.x || drag.position.y !== drag.startPosition.y
    )) {
      onAuthorPosition(drag.id, drag.time, drag.position)
    }
    onPreviewChange()
  }, [onAuthorPosition, onPreviewChange])

  const moveDrag = useCallback(event => {
    const drag = dragRef.current
    if (!drag || event.pointerId !== drag.pointerId) return
    if (!drag.active && Math.hypot(event.clientX - drag.clientX, event.clientY - drag.clientY) < DRAG_THRESHOLD) return
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(drag.parentInverse)
    const position = {
      x: drag.startPosition.x + point.x - drag.startParent.x,
      y: drag.startPosition.y + point.y - drag.startParent.y
    }
    if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) return
    drag.active = true
    drag.position = position
    // GSAP changes only translation; rotation, scale, skew and parent matrices
    // remain intact, using the same x/y semantics as playback and exports.
    drag.preview.add(() => gsap.set(drag.element, position))
    onPreviewChange()
    event.preventDefault()
  }, [onPreviewChange])

  useEffect(() => {
    const pointerUp = event => {
      if (event.pointerId !== dragRef.current?.pointerId) return
      moveDrag(event)
      finishDrag(true)
    }
    const cancelPointer = event => {
      if (event.pointerId === dragRef.current?.pointerId) finishDrag()
    }
    const cancel = () => finishDrag()
    const escape = event => { if (event.key === 'Escape') cancel() }
    window.addEventListener('pointermove', moveDrag, { passive: false })
    window.addEventListener('pointerup', pointerUp)
    window.addEventListener('pointercancel', cancelPointer)
    window.addEventListener('lostpointercapture', cancelPointer)
    window.addEventListener('blur', cancel)
    window.addEventListener('keydown', escape)
    return () => {
      window.removeEventListener('pointermove', moveDrag)
      window.removeEventListener('pointerup', pointerUp)
      window.removeEventListener('pointercancel', cancelPointer)
      window.removeEventListener('lostpointercapture', cancelPointer)
      window.removeEventListener('blur', cancel)
      window.removeEventListener('keydown', escape)
    }
  }, [finishDrag, moveDrag])

  // A load, scrub, model edit or unmount cancels an in-flight preview.
  useLayoutEffect(() => () => finishDrag(), [svgTree, animationModel, currentTime, finishDrag])

  const handlePointerDown = event => {
    if (event.target.closest?.('.svg-editor__path-handles')) return
    if (event.button !== 0 || event.isPrimary === false || dragRef.current) return
    const svg = svgRef.current
    const element = event.target.closest('[id]')
    if (!svg || !element || element === svg || !element.getBBox) return
    onSelectTarget(element.id)
    svg.closest('.svg-editor')?.focus({ preventScroll: true })
    const matrix = element.parentNode.getScreenCTM?.()
    if (!matrix || Math.abs(matrix.a * matrix.d - matrix.b * matrix.c) < 1e-12) return
    const parentInverse = matrix.inverse()
    dragRef.current = {
      id: element.id,
      element,
      pointerId: event.pointerId,
      time: currentTime,
      clientX: event.clientX,
      clientY: event.clientY,
      parentInverse,
      startParent: new DOMPoint(event.clientX, event.clientY).matrixTransform(parentInverse),
      startPosition: readPosition(element),
      restore: captureSvgPlaybackState([element]),
      preview: gsap.context(() => {}),
      active: false
    }
    element.setPointerCapture?.(event.pointerId)
    event.preventDefault()
  }

  const nudge = useCallback(event => {
    const direction = DIRECTIONS[event.key]
    if (!direction || !selectedId || dragRef.current || event.altKey || event.ctrlKey || event.metaKey) return false
    const element = svgRef.current?.getElementById(selectedId)
    if (!element) return false
    const position = readPosition(element)
    const amount = nudgeAmount * (event.shiftKey ? 10 : 1)
    if (!Number.isFinite(amount) || amount <= 0) return false
    onAuthorPosition(selectedId, currentTime, previous => {
      const base = previous || position
      return { x: base.x + direction[0] * amount, y: base.y + direction[1] * amount }
    })
    return true
  }, [selectedId, svgRef, currentTime, nudgeAmount, onAuthorPosition])

  return { handlePointerDown, nudge }
}
