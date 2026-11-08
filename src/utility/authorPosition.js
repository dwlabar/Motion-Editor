// Timeline controls and stage authoring share the existing 30fps timebase.
export function snapTimeToFrame(time) {
  const frameTime = 1 / 30
  return Math.round(time / frameTime) * frameTime
}

export function getAuthoringTime(time, duration) {
  return Math.max(0, Math.min(duration, snapTimeToFrame(time)))
}

// Pure model operation. A resolver lets repeated nudges use the latest model
// value even when React batches more than one keyboard event.
export function authorPosition(model, targetId, time, position) {
  if (!targetId || !Number.isFinite(time)) return model
  const committedTime = getAuthoringTime(time, model.duration)
  const tracks = model.tracks || []
  const index = tracks.findIndex(track => track.targetId === targetId && track.property === 'position')
  const track = tracks[index] || { targetId, property: 'position', keyframes: [] }
  const existing = track.keyframes.find(keyframe => Number(keyframe.time) === committedTime)
  const value = typeof position === 'function' ? position(existing?.value) : position
  if (!value || !Number.isFinite(value.x) || !Number.isFinite(value.y)) return model

  const keyframe = { ...existing, time: committedTime, value: { x: value.x, y: value.y } }
  const keyframes = track.keyframes.filter(item => Number(item.time) !== committedTime)
  keyframes.push(keyframe)
  keyframes.sort((a, b) => Number(a.time) - Number(b.time))
  const nextTrack = { ...track, keyframes }
  return {
    ...model,
    tracks: index === -1
      ? [...tracks, nextTrack]
      : tracks.map((item, i) => i === index ? nextTrack : item)
  }
}
