import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { movePathAnchor, pathToGeometry, readPath } from '../utility/pathGeometry'

export function useStagePathAuthoring({
  svgRef, svgTree, animationModel, currentTime, targetId, activeModal, authoringRef,
  onAuthorPath, onPreviewChange
}) {
  const dragRef = useRef(null)

  const finishDrag = useCallback((commit = false) => {
    const drag = dragRef.current
    if (!drag) return
    dragRef.current = null
    // Preview touches only d; restore before model rebuilding or scrub playback.
    drag.element.setAttribute('d', drag.original)
    drag.authoring?.restore()
    if (drag.capture.hasPointerCapture?.(drag.pointerId)) {
      drag.capture.releasePointerCapture(drag.pointerId)
    }
    if (commit && drag.active && drag.changed && drag.value) {
      onAuthorPath(drag.id, drag.time, drag.value)
    }
    onPreviewChange()
  }, [onAuthorPath, onPreviewChange])

  const moveDrag = useCallback(event => {
    const drag = dragRef.current
    if (!drag || event.pointerId !== drag.pointerId) return
    if (event.type === 'pointermove' && !(event.buttons & 1)) {
      finishDrag()
      return
    }
    if (!drag.active && Math.hypot(event.clientX - drag.clientX, event.clientY - drag.clientY) < 3) return
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(drag.inverse)
    const dx = point.x - drag.start.x
    const dy = point.y - drag.start.y
    const value = movePathAnchor(drag.geometry, drag.anchor, dx, dy)
    if (!value) return
    drag.active = true
    drag.changed = Math.abs(dx) > 1e-9 || Math.abs(dy) > 1e-9
    drag.value = value
    drag.element.setAttribute('d', drag.changed ? value : drag.original)
    onPreviewChange()
    event.preventDefault()
  }, [finishDrag, onPreviewChange])

  useEffect(() => {
    const up = event => {
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
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', cancelPointer)
    window.addEventListener('lostpointercapture', cancelPointer)
    window.addEventListener('blur', cancel)
    window.addEventListener('keydown', escape)
    return () => {
      window.removeEventListener('pointermove', moveDrag)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', cancelPointer)
      window.removeEventListener('lostpointercapture', cancelPointer)
      window.removeEventListener('blur', cancel)
      window.removeEventListener('keydown', escape)
    }
  }, [finishDrag, moveDrag])

  // Declared before App's playback effects so cancellation restores the old
  // rendered value before playback rebuilds or renders the next model state.
  useLayoutEffect(() => () => finishDrag(), [
    svgTree, animationModel, currentTime, targetId, activeModal, finishDrag
  ])

  const handleAnchorPointerDown = (event, anchor) => {
    event.stopPropagation() // Never start whole-object position authoring.
    if (event.button !== 0 || event.isPrimary === false || dragRef.current || !targetId || activeModal) return
    const element = svgRef.current?.getElementById(targetId)
    const original = readPath(element)
    const matrix = element?.getScreenCTM()
    if (!original || !matrix || Math.abs(matrix.a * matrix.d - matrix.b * matrix.c) < 1e-12) return
    const inverse = matrix.inverse()
    const geometry = pathToGeometry(original)
    if (!geometry[anchor.subpath]) return
    const capture = svgRef.current
    dragRef.current = {
      id: targetId, element, capture, original, geometry, anchor, inverse,
      authoring: authoringRef.current,
      pointerId: event.pointerId, time: currentTime,
      clientX: event.clientX, clientY: event.clientY,
      start: new DOMPoint(event.clientX, event.clientY).matrixTransform(inverse),
      active: false, changed: false
    }
    capture.setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  return { handleAnchorPointerDown, isDragging: () => Boolean(dragRef.current) }
}
