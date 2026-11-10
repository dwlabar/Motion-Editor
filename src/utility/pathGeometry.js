import { parsePath, pathAnchors, movePathAnchor as moveAnchor, serializePath } from 'motion-engine'

export { pathAnchors }

export function isPathTarget(shapeList, targetId) {
  return shapeList.some(shape => shape.id === targetId && shape.type === 'path')
}

export function readPath(element) {
  return element?.localName === 'path' ? element.getAttribute('d') : null
}

export function pathToGeometry(value) {
  // Unsupported imported geometry remains untouched and has no editable handles.
  try {
    return typeof value === 'string' && value.trim() ? parsePath(value) : []
  } catch {
    return []
  }
}

// Move one cubic anchor and its adjacent controls, retaining every subpath.
// A closed seam has two copies of the same anchor; move both together.
export function movePathAnchor(geometry, anchor, dx, dy) {
  try {
    return serializePath(moveAnchor(geometry, anchor, dx, dy))
  } catch {
    return null
  }
}
