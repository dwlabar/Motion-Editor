import { gsap } from 'gsap'

// Reversion must restore SVG origin bookkeeping as well as the DOM. GSAP's
// context revert alone can leave smooth-origin offsets from rotation/scale.
// This is a transient playback baseline, never authored or persisted content.
export function captureSvgPlaybackState(elements) {
  const snapshots = elements.map(element => {
    const attributes = ['transform', 'style', 'data-svg-origin', 'd', 'data-original'].map(name => [name, element.getAttribute(name)])
    gsap.getProperty(element, 'x') // Initialize the complete SVG transform cache.
    const cache = { ...gsap.core.getCache(element) }
    return { element, attributes, cache, rawPath: element._gsRawPath }
  })

  return () => snapshots.forEach(({ element, attributes, cache, rawPath }) => {
    attributes.forEach(([name, value]) => {
      if (value === null) element.removeAttribute(name)
      else element.setAttribute(name, value)
    })
    if (rawPath === undefined) delete element._gsRawPath
    else element._gsRawPath = rawPath
    Object.assign(gsap.core.getCache(element), cache)
  })
}
