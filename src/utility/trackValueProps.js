// Shared playback/export mapping. Path data stays a serializable SVG d string.
export function trackValueProps(property, value) {
  switch (property) {
    case 'position': return { x: value.x, y: value.y }
    case 'opacity': return { opacity: value }
    case 'rotation': return { rotation: value, transformOrigin: 'center' }
    case 'scale': return { scale: value, transformOrigin: 'center' }
    case 'path': return { morphSVG: value }
    default: return null
  }
}
