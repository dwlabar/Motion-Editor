// -----------------------------------------------------------------------------
// ExportPanel.jsx
// -----------------------------------------------------------------------------
// Version History
//
// v0.0.1
// - Phase 4.1:
//   - Adds a top toolbar with Export GSAP / Export React actions.
//   - Renders exported code into a textarea for copy.
//   - Keeps export UI separate from Timeline editing UI.
//
// v0.0.2
// - Phase 4.2:
//   - Export output becomes reactive while an export type is active.
//   - Adds precision control for timing rounding.
//   - Adds component name control for React export.
//
// v0.0.3
// - Phase 4.2 styling:
//   - Moved inline styles into SCSS partial.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react'
import '../styles/components/_ExportPanel.scss'
import { exportGsapTimeline } from '../utility/exportGsapTimeline'
import { exportReactComponent } from '../utility/exportReactComponent'

function ExportPanel({ animationModel }) {
  const [exportText, setExportText] = useState('')
  const [exportType, setExportType] = useState(null)

  const [precision, setPrecision] = useState(3)
  const [componentName, setComponentName] = useState('MyExportedAnimation')

  const hasModel = useMemo(() => {
    return Boolean(animationModel && Array.isArray(animationModel.tracks))
  }, [animationModel])

  function buildExportText(nextExportType) {
    if (!hasModel) return ''

    if (nextExportType === 'gsap') {
      return exportGsapTimeline(animationModel, { precision })
    }

    if (nextExportType === 'react') {
      return exportReactComponent(animationModel, {
        componentName,
        precision
      })
    }

    return ''
  }

  function handleExportGsap() {
    if (!hasModel) return
    setExportType('gsap')
    setExportText(buildExportText('gsap'))
  }

  function handleExportReact() {
    if (!hasModel) return
    setExportType('react')
    setExportText(buildExportText('react'))
  }

  function handleClear() {
    setExportType(null)
    setExportText('')
  }

  function handlePrecisionChange(e) {
    const next = Number(e.target.value)
    if (!Number.isFinite(next)) return
    const clamped = Math.max(0, Math.min(6, next))
    setPrecision(clamped)
  }

  function handleComponentNameChange(e) {
    setComponentName(e.target.value)
  }

  // ---------------------------------------------------------------------------
  // Reactive export: keep export output updated while an export type is active
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!exportType) return

    const nextText = buildExportText(exportType)
    setExportText(nextText)
  }, [animationModel, exportType, precision, componentName])

  return (
    <div className="export-panel">
      <div className="export-panel__row">
        <div className="export-panel__title">
          Export
        </div>

        <button
          type="button"
          className="export-panel__btn"
          onClick={handleExportGsap}
          disabled={!hasModel}
          title="Export as raw GSAP timeline code"
        >
          GSAP
        </button>

        <button
          type="button"
          className="export-panel__btn"
          onClick={handleExportReact}
          disabled={!hasModel}
          title="Export as a self-contained React component"
        >
          React
        </button>

        <div className="export-panel__control">
          <label className="export-panel__label">
            Precision
          </label>
          <input
            type="number"
            className="export-panel__input export-panel__input--number"
            min="0"
            max="6"
            step="1"
            value={precision}
            onChange={handlePrecisionChange}
          />
        </div>

        <div className="export-panel__control">
          <label className="export-panel__label">
            Component
          </label>
          <input
            type="text"
            className="export-panel__input export-panel__input--text"
            value={componentName}
            onChange={handleComponentNameChange}
            disabled={exportType !== 'react'}
          />
        </div>

        <button
          type="button"
          className="export-panel__btn"
          onClick={handleClear}
          disabled={!exportText}
          title="Clear export output"
        >
          Clear
        </button>

        <div className="export-panel__spacer" />

        <div className="export-panel__status">
          {exportType ? `Showing: ${exportType.toUpperCase()}` : ''}
        </div>
      </div>

      {exportText ? (
        <div className="export-panel__output">
          <textarea
            className="export-panel__textarea"
            value={exportText}
            readOnly
            spellCheck={false}
          />
        </div>
      ) : null}
    </div>
  )
}

export default ExportPanel
