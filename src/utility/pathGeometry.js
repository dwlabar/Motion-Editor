import { gsap } from 'gsap'
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin'

gsap.registerPlugin(MorphSVGPlugin)

export function isPathTarget(shapeList, targetId) {
  return shapeList.some(shape => shape.id === targetId && shape.type === 'path')
}

export function readPath(element) {
  return element?.localName === 'path' ? element.getAttribute('d') : null
}

export function pathToRawPath(value) {
  return typeof value === 'string' && value.trim()
    ? MorphSVGPlugin.stringToRawPath(value)
    : []
}

function hasJoinedEnds(segment) {
  const end = segment.length - 2
  return segment.closed || (segment[0] === segment[end] && segment[1] === segment[end + 1])
}

export function pathAnchors(rawPath) {
  return rawPath.flatMap((segment, subpath) => {
    const anchors = []
    const limit = segment.length - (hasJoinedEnds(segment) ? 2 : 0)
    for (let index = 0; index < limit; index += 6) {
      anchors.push({ subpath, index, x: segment[index], y: segment[index + 1] })
    }
    return anchors
  })
}

// Move one cubic anchor and its adjacent controls, retaining every subpath.
// A closed seam has two copies of the same anchor; move both together.
export function movePathAnchor(rawPath, { subpath, index }, dx, dy) {
  const next = rawPath.map(segment => {
    const copy = segment.slice()
    copy.closed = segment.closed
    return copy
  })
  const segment = next[subpath]
  if (!segment || index % 6 || index < 0 || index >= segment.length - 1) return null
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return null
  const end = segment.length - 2
  const points = new Set([index])
  if (index > 0) points.add(index - 2)
  if (index < end) points.add(index + 2)
  if (hasJoinedEnds(segment) && (index === 0 || index === end)) {
    points.add(0)
    points.add(end)
    points.add(2)
    points.add(end - 2)
  }
  points.forEach(point => {
    segment[point] += dx
    segment[point + 1] += dy
  })
  return MorphSVGPlugin.rawPathToString(next)
}
