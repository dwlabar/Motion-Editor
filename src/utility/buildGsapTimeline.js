// -----------------------------------------------------------------------------
// buildGsapTimeline.js
// -----------------------------------------------------------------------------
// Version History
//
// v0.2.0
// - Add the SVG Path animation foundation through MorphSVG and the existing model.
//
// v0.0.6
// - Establish the first keyframe value, including single-keyframe tracks.
// - Resolve targets within the imported SVG.
//
// v0.0.1
// - Initial GSAP builder that converts animationModel.tracks into GSAP .to() calls.
// - Supports basic properties: position, opacity, rotation, scale.
//
// v0.0.2
// - Fixed GSAP timing by passing correct duration via vars.duration instead of
//   relying on defaults / wrong signature.
// - Each tween now uses start time = keyframeA.time and duration = keyframeB.time - keyframeA.time.
// - Timeline duration now correctly reflects the model's timing so the playhead
//   and keyframe diamonds can align.
//
// v0.0.3
// - Phase 2 Step 10:
//   - Added track-level clamping.
//   - Each track now explicitly holds its final keyframe value after the last keyframe time.
//   - Prevents animation from drifting past the final keyframe.
//
// v0.0.4
// - Phase 2 Step 10 fix:
//   - Padded the GSAP timeline to animationModel.duration so tl.progress(scrub)
//     maps to the same timebase as the editor UI.
//
// v0.0.5
// - Phase 3.1:
//   - Added passive support for per-keyframe easing.
//   - If a keyframe defines `ease`, it is passed through to GSAP.
//   - No UI or default easing behavior added.
// -----------------------------------------------------------------------------

import { gsap } from 'gsap'
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin'
import { trackValueProps } from './trackValueProps'
import { getTransitionEase } from './keyframeEasing'

gsap.registerPlugin(MorphSVGPlugin)

export function buildGsapTimeline(animationModel, svgRef, onUpdate) {
  const tl = gsap.timeline({
    paused: true,
    onUpdate
  })

  if (!animationModel || !animationModel.tracks || !svgRef?.current) {
    return tl
  }

  animationModel.tracks.forEach(track => {
    const targetSelector = svgRef.current.getElementById(track.targetId)
    if (!targetSelector) return
    if (track.property === 'path' && targetSelector.localName !== 'path') return
    const keyframes = track.keyframes || []

    if (keyframes.length === 0) return

    // A first keyframe at a nonzero time must establish its own value before
    // interpolation begins. This also makes single-keyframe authoring useful.
    const first = keyframes[0]
    const initialProps = trackValueProps(track.property, first.value)
    if (!initialProps) return
    tl.set(targetSelector, initialProps, first.time)

    // -------------------------------------------------------------------------
    // Animate between keyframes
    // -------------------------------------------------------------------------
    for (let i = 0; i < keyframes.length - 1; i++) {
      const kfA = keyframes[i]
      const kfB = keyframes[i + 1]

      const start = kfA.time
      const duration = kfB.time - kfA.time
      if (duration <= 0) continue

      const gsapProps = trackValueProps(track.property, kfB.value)
      if (!gsapProps) continue

      // IMPORTANT: duration must be inside vars for GSAP 3
      gsapProps.duration = duration

      // Outgoing easing belongs to kfA; legacy incoming easing remains readable.
      gsapProps.ease = getTransitionEase(kfA, kfB)

      // Start time is kfA.time on the timeline
      tl.to(targetSelector, gsapProps, start)
    }

    // -------------------------------------------------------------------------
    // Clamp track at final keyframe
    // -------------------------------------------------------------------------
    const lastKeyframe = keyframes[keyframes.length - 1]
    const clampTime = lastKeyframe.time

    const clampProps = trackValueProps(track.property, lastKeyframe.value)

    tl.to(targetSelector, { ...clampProps, duration: 0 }, clampTime)
  })

  // ---------------------------------------------------------------------------
  // Pad timeline to match model duration (keeps editor timebase consistent)
  // ---------------------------------------------------------------------------
  if (typeof animationModel.duration === 'number' && animationModel.duration > 0) {
    tl.add(() => { }, animationModel.duration)
  }

  return tl
}
