import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

const DRAG_THRESHOLD = 3 // Screen pixels, matching timeline keyframe dragging.
const DIRECTIONS = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1]
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
  svgRef, svgTree, animationModel, currentTime, selectedId, nudgeAmount, activeModal, authoringRef,
  onSelectTarget, onAuthorPosition, onPreviewChange
}) {
  const dragRef = useRef(null)

  const finishDrag = useCallback((commit = false) => {
    const drag = dragRef.current
    if (!drag) return
    dragRef.current = null
    // Restore the evaluated frame before the authoritative model rebuild.
    drag.authoring.restore()
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
    if (event.type === 'pointermove' && !(event.buttons & 1)) {
      finishDrag()
      return
    }
    if (!drag.active && Math.hypot(event.clientX - drag.clientX, event.clientY - drag.clientY) < DRAG_THRESHOLD) return
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(drag.parentInverse)
    const position = {
      x: drag.startPosition.x + point.x - drag.startParent.x,
      y: drag.startPosition.y + point.y - drag.startParent.y
    }
    if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) return
    drag.active = true
    drag.position = position
    // Engine translation is in parent SVG space; the adapter retains baseline
    // transforms and the evaluated rotation, scale, opacity and path channels.
    drag.authoring.previewPosition(drag.id, position)
    onPreviewChange()
    event.preventDefault()
  }, [finishDrag, onPreviewChange])

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
  useLayoutEffect(() => () => finishDrag(), [svgTree, animationModel, currentTime, activeModal, finishDrag])

  useLayoutEffect(() => {
    if (dragRef.current && dragRef.current.id !== selectedId) finishDrag()
  }, [selectedId, finishDrag])

  const handlePointerDown = event => {
    if (activeModal || event.target.closest?.('.svg-editor__path-handles')) return
    if (event.button !== 0 || event.isPrimary === false || dragRef.current) return
    const svg = svgRef.current
    const element = event.target.closest('[id]')
    if (!svg || !element || element === svg || !element.getBBox) return
    onSelectTarget(element.id)
    svg.closest('.svg-editor')?.focus({ preventScroll: true })
    const matrix = element.parentNode.getScreenCTM?.()
    if (!matrix || Math.abs(matrix.a * matrix.d - matrix.b * matrix.c) < 1e-12) return
    const authoring = authoringRef.current
    if (!authoring) return
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
      startPosition: authoring.read(element.id, 'position'),
      authoring,
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
    const position = authoringRef.current?.read(selectedId, 'position')
    if (!position) return false
    const amount = nudgeAmount * (event.shiftKey ? 10 : 1)
    if (!Number.isFinite(amount) || amount <= 0) return false
    onAuthorPosition(selectedId, currentTime, previous => {
      const base = previous || position
      return { x: base.x + direction[0] * amount, y: base.y + direction[1] * amount }
    })
    return true
  }, [selectedId, svgRef, currentTime, nudgeAmount, onAuthorPosition, authoringRef])

  return { handlePointerDown, nudge }
}
