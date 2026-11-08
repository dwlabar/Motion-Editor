// -----------------------------------------------------------------------------
// exportReactComponent.js
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
// - Phase 3.3:
//   - Export animation model as a self-contained React component.
//   - Component internally builds a GSAP timeline identical to raw export.
//
// v0.0.2
// - Phase 3.5:
//   - Added numeric precision control.
//   - Keeps output in sync with raw GSAP exporter.
// -----------------------------------------------------------------------------

import { trackValueProps } from './trackValueProps'
import { getTransitionEase } from './keyframeEasing'

/**
 * Export animation model as a React component source string.
 *
 * @param {Object} animationModel
 * @param {Object} options
 * @param {string} options.componentName
 * @param {number} options.precision
 * @returns {string} React component source code
 */
export function exportReactComponent(animationModel, options = {}) {
  if (!animationModel || !Array.isArray(animationModel.tracks)) {
    return ''
  }

  const componentName = options.componentName || 'ExportedAnimation'
  const precision = Number.isFinite(options.precision)
    ? options.precision
    : 3

  const lines = []

  // ---------------------------------------------------------------------------
  // Header
  // ---------------------------------------------------------------------------
  lines.push(`import { useEffect, useRef } from 'react'`)
  lines.push(`import { gsap } from 'gsap'`)
  if (animationModel.tracks.some(track => track.property === 'path')) {
    lines.push(`import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin'`)
    lines.push('')
    lines.push('gsap.registerPlugin(MorphSVGPlugin)')
  }
  lines.push('')
  lines.push(`export function ${componentName}() {`)
  lines.push(`  const svgRef = useRef(null)`)
  lines.push('')
  lines.push(`  useEffect(() => {`)
  lines.push(`    if (!svgRef.current) return`)
  lines.push('')
  lines.push(`    const tl = gsap.timeline({ paused: true })`)
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
    lines.push(`    tl.set('#${targetId}', ${stringifyObject(firstProps)}, ${roundNumber(keyframes[0].time, precision)})`)

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
        `    tl.to('#${targetId}', ${propsString}, ${start})`
      )
    }
  })

  if (Number.isFinite(animationModel.duration) && animationModel.duration > 0) {
    lines.push(`    tl.add(() => {}, ${roundNumber(animationModel.duration, precision)})`)
  }
  lines.push('')
  lines.push(`    return () => {`)
  lines.push(`      tl.kill()`)
  lines.push(`    }`)
  lines.push(`  }, [])`)
  lines.push('')
  lines.push(`  return (`)
  lines.push(`    <svg ref={svgRef}>`)
  lines.push(`      {/* SVG markup should be inlined by the consumer */}`)
  lines.push(`    </svg>`)
  lines.push(`  )`)
  lines.push(`}`)
  lines.push('')

  return lines.join('\n')
}

// -----------------------------------------------------------------------------
// Helpers (kept intentionally in sync with exportGsapTimeline.js)
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
