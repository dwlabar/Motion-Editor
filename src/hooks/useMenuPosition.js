import { useLayoutEffect } from 'react'

// Keep a fixed menu in its existing DOM/tab order while avoiding viewport edges.
export function useMenuPosition(triggerRef, menuRef, openKey) {
  useLayoutEffect(() => {
    const trigger = triggerRef.current
    const menu = menuRef.current
    if (!openKey || !trigger || !menu) return

    function positionMenu(event) {
      if (event?.target === menu) return
      const viewport = window.visualViewport
      const margin = 8
      const gap = 5
      const leftEdge = (viewport?.offsetLeft ?? 0) + margin
      const topEdge = (viewport?.offsetTop ?? 0) + margin
      const availableWidth = Math.max(0, (viewport?.width ?? document.documentElement.clientWidth) - margin * 2)
      const availableHeight = Math.max(0, (viewport?.height ?? document.documentElement.clientHeight) - margin * 2)
      const rightEdge = leftEdge + availableWidth
      const bottomEdge = topEdge + availableHeight

      // Measure content at the available width before deciding which side fits.
      const scrollTop = menu.scrollTop
      menu.style.maxWidth = `${availableWidth}px`
      menu.style.maxHeight = 'none'
      const bounds = menu.getBoundingClientRect()
      const anchor = trigger.getBoundingClientRect()
      const height = Math.min(bounds.height, availableHeight)
      const fitsBelow = anchor.bottom + gap + bounds.height <= bottomEdge
      const top = fitsBelow ? anchor.bottom + gap : anchor.top - gap - height

      menu.style.maxHeight = `${availableHeight}px`
      menu.style.left = `${Math.max(leftEdge, Math.min(anchor.right - bounds.width, rightEdge - bounds.width))}px`
      menu.style.top = `${Math.max(topEdge, Math.min(top, bottomEdge - height))}px`
      menu.scrollTop = scrollTop
      menu.style.visibility = 'visible'
    }

    positionMenu()
    const observer = new ResizeObserver(positionMenu)
    observer.observe(trigger)
    observer.observe(menu)
    window.addEventListener('resize', positionMenu)
    window.addEventListener('scroll', positionMenu, true)
    window.visualViewport?.addEventListener('resize', positionMenu)
    window.visualViewport?.addEventListener('scroll', positionMenu)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', positionMenu)
      window.removeEventListener('scroll', positionMenu, true)
      window.visualViewport?.removeEventListener('resize', positionMenu)
      window.visualViewport?.removeEventListener('scroll', positionMenu)
    }
  }, [triggerRef, menuRef, openKey])
}
