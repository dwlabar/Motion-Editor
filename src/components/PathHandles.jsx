import { useEffect } from 'react'
import { pathAnchors, pathToGeometry, readPath } from '../utility/pathGeometry'

// Rendered only in the editor clone. Source SVG and exported data never see it.
export default function PathHandles({ svgRef, targetId, onPointerDown, onLayoutChange }) {
  useEffect(() => {
    const observer = new ResizeObserver(onLayoutChange)
    if (svgRef.current) observer.observe(svgRef.current)
    window.addEventListener('scroll', onLayoutChange, true)
    window.addEventListener('resize', onLayoutChange)
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onLayoutChange, true)
      window.removeEventListener('resize', onLayoutChange)
    }
  }, [svgRef, onLayoutChange])

  const element = svgRef.current?.getElementById(targetId)
  const matrix = element?.getScreenCTM()
  const rootMatrix = svgRef.current?.getScreenCTM()
  if (!matrix || !rootMatrix || Math.abs(rootMatrix.a * rootMatrix.d - rootMatrix.b * rootMatrix.c) < 1e-12) return null
  const inverse = rootMatrix.inverse()
  const transform = `matrix(${inverse.a} ${inverse.b} ${inverse.c} ${inverse.d} ${inverse.e} ${inverse.f})`
  const anchors = pathAnchors(pathToGeometry(readPath(element)))

  return (
    <g className="svg-editor__path-handles" transform={transform} aria-label="Path anchors">
      {anchors.map(anchor => {
        const point = new DOMPoint(anchor.x, anchor.y).matrixTransform(matrix)
        return (
          <circle
            key={`${targetId}-${anchor.subpath}-${anchor.index}`}
            className="svg-editor__path-anchor"
            cx={point.x} cy={point.y} r="5"
            onPointerDown={event => onPointerDown(event, anchor)}
          >
            <title>{`Subpath ${anchor.subpath + 1}, anchor ${anchor.index + 1}: drag to move`}</title>
          </circle>
        )
      })}
    </g>
  )
}
