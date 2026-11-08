// -----------------------------------------------------------------------------
// components/TopBar.jsx
// -----------------------------------------------------------------------------
// Version History
//
// v0.2.1
// - Restore Figma navigation and wordmark using local design fonts.
//
// v0.0.1
// - App-level top bar with File and Export menu triggers.
// -----------------------------------------------------------------------------

import topbarLogo from '../assets/logo_GSAPanimate.svg'
import '../styles/components/_TopBar.scss'

function TopBar({
  activeMenu,
  onOpenFile,
  onOpenExport,
  onOpenAbout
}) {
  return (
    <div className="top-bar">
      <div className="top-bar__left">
        <div className="top-bar__logo" aria-hidden="true">
          <img src={topbarLogo} alt="" width="40" height="40" draggable={false} />
        </div>
        <button
          type="button"
          className={
            'top-bar__btn' +
            (activeMenu === 'file' ? ' top-bar__btn--active' : '')
          }
          onClick={onOpenFile}
        >
          File
        </button>

        <button
          type="button"
          className={
            'top-bar__btn' +
            (activeMenu === 'export' ? ' top-bar__btn--active' : '')
          }
          onClick={onOpenExport}
        >
          Export
        </button>
        <button
          type="button"
          className={'top-bar__btn' + (activeMenu === 'about' ? ' top-bar__btn--active' : '')}
          onClick={onOpenAbout}
        >
          About
        </button>
      </div>

      <div className="top-bar__right">
        <div className="top-bar__brand">GSAP<strong>ANIMATE</strong></div>
      </div>
    </div>
  )
}

export default TopBar
