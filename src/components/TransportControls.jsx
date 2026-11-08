import AnimationDuration from './AnimationDuration'

function TransportControls({ modelId, duration, onDurationChange, isPlaying, isLooping, disabled, onRestart, onPlayPause, onLoopChange }) {
  return (
    <section className="inspector__transport" aria-label="Animation transport">
      <div className="inspector__transport-buttons">
        <button type="button" className="inspector__transport-button" onClick={onRestart} disabled={disabled} title="Return playhead to 0">Restart</button>
        <button type="button" className="inspector__transport-button" onClick={onPlayPause} disabled={disabled}>{isPlaying ? 'Pause' : 'Play'}</button>
        <button type="button" className="inspector__transport-button" onClick={onLoopChange} aria-pressed={isLooping} disabled={disabled}>Loop</button>
      </div>
      <AnimationDuration key={modelId} duration={duration} onCommit={onDurationChange} />
    </section>
  )
}

export default TransportControls
