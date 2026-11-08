import { useLayoutEffect } from 'react'

// Fit the document viewport as one unit, including SVGs without a viewBox.
// The scale belongs to an HTML wrapper; source coordinates/attributes stay intact.
export function useDocumentFit({ svgRef, svgTree, stageContentRef, onLayoutChange }) {
  useLayoutEffect(() => {
    const svg = svgRef.current
    const workspace = stageContentRef.current
    if (!svg || !workspace) return
    const document = svg.parentElement
    const frame = document.parentElement
    const viewBox = svg.viewBox.baseVal
    const ratio = viewBox.width > 0 && viewBox.height > 0 ? viewBox.width / viewBox.height : null
    const absoluteLength = length => length.unitType !== 2 && length.value > 0 ? length.value : null
    const authoredWidth = absoluteLength(svg.width.baseVal)
    const authoredHeight = absoluteLength(svg.height.baseVal)
    const width = authoredWidth || (authoredHeight && ratio ? authoredHeight * ratio : viewBox.width || 300)
    const height = authoredHeight || (ratio ? width / ratio : 150)
    document.style.width = `${width}px`
    document.style.height = `${height}px`

    const fit = () => {
      const style = getComputedStyle(workspace)
      // Keep the frame border inside the workspace padding too.
      const availableWidth = workspace.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - 2
      const availableHeight = workspace.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - 2
      const scale = Math.max(0, Math.min(1, availableWidth / width, availableHeight / height))
      frame.style.width = `${width * scale + 2}px`
      frame.style.height = `${height * scale + 2}px`
      document.style.transform = `scale(${scale})`
      onLayoutChange()
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(workspace)
    return () => observer.disconnect()
  }, [svgRef, svgTree, stageContentRef, onLayoutChange])
}
