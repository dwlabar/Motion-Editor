import { getAuthoringTime } from './authorPosition'

// Called only by deliberate Path authoring after checking the imported type.
export function authorPath(model, targetId, time, value) {
  if (!targetId || !Number.isFinite(time) || typeof value !== 'string' || !value.trim()) return model
  const committedTime = getAuthoringTime(time, model.duration)
  const tracks = model.tracks || []
  const index = tracks.findIndex(track => track.targetId === targetId && track.property === 'path')
  const track = tracks[index] || { targetId, property: 'path', keyframes: [] }
  const existing = track.keyframes.find(keyframe => Number(keyframe.time) === committedTime)
  const keyframes = track.keyframes.filter(keyframe => Number(keyframe.time) !== committedTime)
  keyframes.push({ ...existing, time: committedTime, value })
  keyframes.sort((a, b) => Number(a.time) - Number(b.time))
  const nextTrack = { ...track, keyframes }
  return {
    ...model,
    tracks: index === -1 ? [...tracks, nextTrack] : tracks.map((item, i) => i === index ? nextTrack : item)
  }
}
