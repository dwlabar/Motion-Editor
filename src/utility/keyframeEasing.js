// GSAP's existing default is power1.out. Keep legacy incoming `ease` values
// readable, while new authoring stores the outgoing transition on its owner.
export const DEFAULT_EASE = 'power1.out'
export const EASING_PRESETS = [
  { value: 'none', label: 'Linear' },
  ...[1, 2, 3].flatMap(power => ['in', 'out', 'inOut'].map(direction => ({
    value: `power${power}.${direction}`,
    label: `Power${power} ${direction === 'inOut' ? 'InOut' : direction === 'in' ? 'In' : 'Out'}`
  })))
]

export function getTransitionEase(from, to) {
  if (typeof from?.easeToNext === 'string' && from.easeToNext.length > 0) return from.easeToNext
  if (typeof to?.ease === 'string' && to.ease.length > 0) return to.ease
  return DEFAULT_EASE
}

// Normalize once on restore, before edits can reorder/delete legacy keyframes.
// Optional fields keep the schema-1 format and unconfigured models unchanged.
export function normalizeKeyframeEasing(model) {
  return {
    ...model,
    tracks: model.tracks.map(track => {
      const keyframes = track.keyframes || []
      return {
        ...track,
        keyframes: keyframes.map((keyframe, index) => {
          const next = { ...keyframe }
          if (!next.easeToNext && typeof keyframes[index + 1]?.ease === 'string' && keyframes[index + 1].ease.length > 0) {
            next.easeToNext = keyframes[index + 1].ease
          }
          delete next.ease
          return next
        })
      }
    })
  }
}
