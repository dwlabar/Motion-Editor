// -----------------------------------------------------------------------------
// components/FilePanel.jsx
// -----------------------------------------------------------------------------
// Version History
//
// v0.0.2
// - Awaits project restoration and retains the modal with a clear error on failure.
//
// v0.0.1
// - File actions:
//   - Download project JSON (svgSource + animationModel)
//   - Load project JSON
//   - Force-save local autosave
//   - Clear autosave
// -----------------------------------------------------------------------------

import { useRef, useState } from 'react'
import '../styles/components/_FilePanel.scss'

function FilePanel({
  svgSource,
  animationModel,
  hasAutosave,
  onLoadProject,
  onSaveLocalNow,
  onClearAutosave
}) {
  const fileInputRef = useRef(null)
  const [errorText, setErrorText] = useState('')

  const hasSvg = typeof svgSource === 'string' && svgSource.length > 0
  const hasModel = Boolean(animationModel && Array.isArray(animationModel.tracks))

  function downloadTextFile(filename, content) {
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    URL.revokeObjectURL(url)
  }

  function handleDownloadProject() {
    setErrorText('')

    if (!hasModel) {
      setErrorText('No animation model available.')
      return
    }

    if (!hasSvg) {
      setErrorText('No SVG loaded. Import an SVG before exporting a project file.')
      return
    }

    const payload = {
      version: 1,
      meta: {
        app: 'gsap-svg-editor',
        savedAt: Date.now()
      },
      svgSource,
      animationModel
    }

    downloadTextFile('gsap-svg-project.json', JSON.stringify(payload, null, 2))
  }

  function handlePickFile() {
    setErrorText('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  async function handleFileChange(e) {
    setErrorText('')

    const file = e.target.files && e.target.files[0]
    if (!file) return

    let text = ''
    try {
      text = await file.text()
    } catch {
      setErrorText('Failed to read file.')
      return
    }

    let parsed = null
    try {
      parsed = JSON.parse(text)
    } catch {
      setErrorText('Invalid JSON.')
      return
    }

    if (!parsed || typeof parsed !== 'object') {
      setErrorText('Invalid project format.')
      return
    }

    if (Number(parsed.version) !== 1) {
      setErrorText('Unsupported project version.')
      return
    }

    const nextSvg = parsed.svgSource
    const nextModel = parsed.animationModel

    if (typeof nextSvg !== 'string' || nextSvg.length === 0) {
      setErrorText('Project is missing svgSource.')
      return
    }

    if (!nextModel || typeof nextModel !== 'object' || !Array.isArray(nextModel.tracks)) {
      setErrorText('Project is missing animationModel.')
      return
    }

    if (typeof onLoadProject !== 'function') {
      setErrorText('Project loading is unavailable.')
      return
    }

    let didLoad = false
    try {
      didLoad = await onLoadProject({
        svgSourceText: nextSvg,
        animationModelNext: nextModel
      })
    } catch {
      setErrorText('Failed to load project.')
      return
    }

    if (!didLoad) {
      setErrorText('Project SVG could not be parsed.')
    }
  }

  return (
    <div className="file-panel">
      <div className="file-panel__section">
        <div className="file-panel__section-title">Project</div>

        <div className="file-panel__row">
          <button
            type="button"
            className="file-panel__btn"
            onClick={handlePickFile}
            title="Load a previously saved project JSON"
          >
            Load Project
          </button>

          <button
            type="button"
            className="file-panel__btn"
            onClick={handleDownloadProject}
            disabled={!hasModel || !hasSvg}
            title={!hasSvg ? 'Import an SVG first' : 'Download project JSON'}
          >
            Download Project
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="file-panel__file-input"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div className="file-panel__section">
        <div className="file-panel__section-title">Autosave</div>

        <div className="file-panel__row">
          <button
            type="button"
            className="file-panel__btn"
            onClick={onSaveLocalNow}
            disabled={typeof onSaveLocalNow !== 'function'}
            title="Force-write local autosave right now"
          >
            Save Now
          </button>

          <button
            type="button"
            className="file-panel__btn file-panel__btn--danger"
            onClick={onClearAutosave}
            disabled={!hasAutosave || typeof onClearAutosave !== 'function'}
            title="Remove local autosave"
          >
            Clear Autosave
          </button>
        </div>

        <div className="file-panel__hint">
          Autosave is enabled and writes after edits settle.
        </div>
      </div>

      {errorText ? (
        <div className="file-panel__error">
          {errorText}
        </div>
      ) : null}
    </div>
  )
}

export default FilePanel
