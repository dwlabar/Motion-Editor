// -----------------------------------------------------------------------------
// exportGsapTimeline.js
// -----------------------------------------------------------------------------
// Version History
//
// v0.2.0
// - Add the SVG Path animation foundation through MorphSVG and the existing model.
//
// v0.0.3
// - Include first/single-keyframe values and retain the model timebase.
//
// v0.0.1
// - Phase 3.2:
//   - Initial raw GSAP timeline exporter.
//   - Converts animation model data into readable GSAP code as a string.
//   - Output is editor-agnostic and safe to paste into any GSAP project.
//
// v0.0.2
// - Phase 3.5:
//   - Added numeric precision control.
//   - Prevents floating-point artifacts in duration and start times.
// -----------------------------------------------------------------------------

import { trackValueProps } from './trackValueProps'
import { getTransitionEase } from './keyframeEasing'

/**
 * Export animation model as raw GSAP timeline code.
 *
 * @param {Object} animationModel
 * @param {Object} options
 * @param {number} options.precision
 * @returns {string} GSAP timeline source code
 */
export function exportGsapTimeline(animationModel, options = {}) {
  if (!animationModel || !Array.isArray(animationModel.tracks)) {
    return ''
  }

  const precision = Number.isFinite(options.precision)
    ? options.precision
    : 3

  const lines = []

  // ---------------------------------------------------------------------------
  // Header
  // ---------------------------------------------------------------------------
  lines.push(`import { gsap } from 'gsap'`)
  if (animationModel.tracks.some(track => track.property === 'path')) {
    lines.push(`import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin'`)
    lines.push('')
    lines.push('gsap.registerPlugin(MorphSVGPlugin)')
  }
  lines.push('')
  lines.push(`export function createTimeline() {`)
  lines.push(`  const tl = gsap.timeline({ paused: true })`)
  lines.push('')

  // ---------------------------------------------------------------------------
  // Tracks → GSAP .to() calls
  // ---------------------------------------------------------------------------
  animationModel.tracks.forEach(track => {
    const targetId = track.targetId
    const property = track.property
    const keyframes = Array.isArray(track.keyframes) ? track.keyframes : []

    if (!targetId || keyframes.length === 0) return

    const firstProps = buildGsapProps(property, keyframes[0], 0)
    if (!firstProps) return
    lines.push(`  tl.set('#${targetId}', ${stringifyObject(firstProps)}, ${roundNumber(keyframes[0].time, precision)})`)

    for (let i = 0; i < keyframes.length - 1; i++) {
      const kfA = keyframes[i]
      const kfB = keyframes[i + 1]

      const startRaw = kfA.time
      const durationRaw = kfB.time - kfA.time
      if (durationRaw <= 0) continue

      const start = roundNumber(startRaw, precision)
      const duration = roundNumber(durationRaw, precision)

      const props = buildGsapProps(property, kfB, duration)
      if (!props) continue
      props.ease = getTransitionEase(kfA, kfB)

      const propsString = stringifyObject(props)

      lines.push(
        `  tl.to('#${targetId}', ${propsString}, ${start})`
      )
    }
  })

  if (Number.isFinite(animationModel.duration) && animationModel.duration > 0) {
    lines.push(`  tl.add(() => {}, ${roundNumber(animationModel.duration, precision)})`)
  }
  lines.push('')
  lines.push(`  return tl`)
  lines.push(`}`)

  return lines.join('\n')
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function roundNumber(value, precision) {
  const factor = Math.pow(10, precision)
  return Math.round(value * factor) / factor
}

function buildGsapProps(property, keyframe, duration) {
  if (!keyframe || typeof keyframe.value === 'undefined') return null

  const props = trackValueProps(property, keyframe.value)
  if (!props) return null

  props.duration = duration

  return props
}

function stringifyObject(obj) {
  const entries = Object.entries(obj).map(([key, value]) => {
    if (typeof value === 'string') {
      return `${key}: ${JSON.stringify(value)}`
    }
    if (typeof value === 'object') {
      return `${key}: ${JSON.stringify(value)}`
    }
    return `${key}: ${value}`
  })

  return `{ ${entries.join(', ')} }`
}
