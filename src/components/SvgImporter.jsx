// -----------------------------------------------------------------------------
// SvgImporter.jsx
// -----------------------------------------------------------------------------
// Version History
//
// v0.0.5
// - Report invalid imports and pass sanitization warnings to the stage.
//
// v0.0.3
// - Filters out non-drawable SVG metadata (namedview, grid, defs, etc.).
// - Only collects visual shapes or groups for shapeList.
//
// v0.0.4
// - Uses the shared SVG parser for direct imports and project restoration.
// -----------------------------------------------------------------------------

import { useRef } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { parseSvgTextToJsxAndShapes } from '../utility/parseSvgToJsx'

function SvgImporter({ onLoad }) {
  const { notify } = useNotifications()
  const reportError = message => notify({ variant: 'error', message })
  const fileInputRef = useRef()

  async function handleFileChange(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.svg')) {
      reportError('Choose an SVG file.')
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      const text = reader.result
      if (typeof text !== 'string') {
        reportError('Failed to read SVG file.')
        return
      }

      const parsed = await parseSvgTextToJsxAndShapes(text)
      if (!parsed || !parsed.svgTree) {
        reportError(parsed?.error || 'SVG could not be imported.')
        return
      }

      if (onLoad) {
        onLoad({
          svgTree: parsed.svgTree,
          shapeList: parsed.shapeList,
          svgSource: text,
          warnings: parsed.warnings
        })
      }
    }
    reader.onerror = () => reportError('Failed to read SVG file.')
    reader.readAsText(file)
  }

  return (
    <div className="svg-importer">
      <button onClick={() => fileInputRef.current?.click()}>
        Import SVG
      </button>

      <input
        type="file"
        accept=".svg"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

    </div>
  )
}

export default SvgImporter
