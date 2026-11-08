# GSAPANIMATE — SVG Animation Editor

**0.3.0 preview — unreleased, in development.** Public demo preparation is complete; this is not a formal 0.3.0 release. The GitHub source repository remains private. Package and released versions remain **0.2.1**, and project JSON/schema version remains **1**. See [ROADMAP.md](ROADMAP.md) for preview progress and [CHANGELOG.md](CHANGELOG.md) for release history.

The last released application milestone is **v0.2.1 — Figma UI fidelity pass** (manually accepted on 2026-09-22). The accepted v0.2.0 release remains the functionality baseline; the historical verification notes below describe those milestones.

## Basic usage

1. Open **File** to import an SVG or load a previously downloaded project JSON. Sample artwork is available in `public/` for local use.
2. Select an object on the stage or in the timeline. Add a Position, Opacity, Rotation, Scale, or eligible Path track.
3. Move the playhead and add keyframes with the diamond button or **K** on the selected track. Edit selected keyframes in Properties; drag objects or path anchors on the stage to author position or path changes.
4. Set the duration, scrub the timeline, and use Play/Pause, Restart, and Loop to preview. Select a non-final keyframe to adjust its easing to the next keyframe.
5. Use **File → Download Project** for a portable backup and **Load Project** to reopen it. Autosave and Save Now use this browser's local storage.
6. Open **Export** to copy GSAP code or a React component scaffold. React output requires you to supply the SVG markup.

## Visual reference — v0.2.1

The visual reference is the [canonical Figma design](https://www.figma.com/design/YKXYCBUHObeNkn4CRML2UG/Untitled?node-id=1-103&m=dev), primary **Desktop node `1:49`**. v0.2.1 restores its visual system while retaining v0.2.0 Position, Path/MorphSVG, selection, tracks, persistence, exports, and keyboard behavior.

At the 1562 × 1080 reference viewport, the layout uses a 60px topbar, 1242 × 624 stage, 320px inspector, and 396px timeline. Shape rows are 43px; property rows are 36px; the ruler is 57px. The 304px property column is followed by equal left/right time-area gutters: at least 32px, growing with the measured duration label. Labels stay centered on their ticks and both endpoint markers render fully. Ruler marks, hashes, the full-height playhead, seeking, and keyframe dragging share the same usable time area.

The authored duration fits that area; Figma's 160px ruler units guide tick density instead of imposing a fixed pixels-per-second scale on saved projects. Labels adapt to available width. The timeline scrolls internally with a sticky ruler, keeping the stage available. The inspector/property column adapt to 260px/220px below 1000px; below 700px the inspector follows the workspace and the property column is 170px. No timeline zoom or large-SVG navigation tools are added.

Open Sans, Inter, and Syncopate are served locally with their licenses in `public/fonts`. Figma icons, stage pattern, shadow, and divider are stored in `public/figma`; no expiring asset URLs or font-service requests are used at runtime. About uses the existing modal shell.

### v0.2.1 verification and acceptance

Automated browser interaction checks exercised SVG import, shape selection, Position drag and Arrow/Shift-arrow nudging, Path anchor commits and MorphSVG interpolation, Opacity/Rotation/Scale authoring, Inspector time/value edits, timeline seeking and 30fps drag snapping, keyframe selection and K/Delete shortcuts, Add Track flipping/eligibility/duplicate prevention, autosave restoration, downloaded project JSON reload, and both export outputs. Desktop measurements matched the reference geometry; endpoint markers and shared alignment were checked with and without timeline scrolling. Viewports checked: 1562 × 1080, 1200 × 900, 960 × 800, 1920 × 1080, and 390 × 844; none introduced horizontal page overflow.

On 2026-09-22, the user accepted all current v0.2.1 work, including TopBar, Inspector, Timeline, the playhead/endpoint follow-up, and their manual SCSS refinements. This user-reported acceptance is separate from the agent browser checks above. Touch/pen behavior, dedicated assistive-technology testing, and exported code running in another application were not separately verified for this pass.

The playhead/endpoint follow-up was browser-checked at 1562 × 1080, 960 × 800, and 390 × 844 with 2s and 12345.67s projects. Ruler and row continuations share identical x positions, including during row scrolling; labels remain centered and endpoint markers fit inside the gutters. Seeking, 30fps keyframe dragging, Position drag/nudge, and Path anchor authoring/interpolation were rechecked.

## Vision

GSAP SVG Animation Editor is a browser-based authoring prototype for creating timeline-driven animations from imported SVG artwork. It keeps authored animation data separate from preview playback so an animation can be edited, saved, restored, and exported as code.

## Current capabilities

- Import an SVG and build a selectable list of supported, identified SVG shapes and groups.
- Select shapes from the canvas or shape list and display a transformed selection outline.
- Add position, opacity, rotation, and scale tracks, plus Path tracks for identified `<path>` elements.
- Move existing path anchors on the stage and interpolate path keyframes with MorphSVG.
- Add, select, edit, delete, and drag keyframes on a timeline.
- Scrub a GSAP preview whose duration is driven by the animation model.
- Drag stage objects or nudge with arrow keys to author position at the playhead, with synchronized Inspector and Timeline selection.
- Save the latest imported SVG source and animation model to local storage after edits settle.
- Download and load version 1 project JSON files.
- Generate copyable GSAP timeline code or a React component scaffold.

## Technology stack

- React 19.1
- Vite 6.3
- GSAP 3.13 (core and all plugins are free, including MorphSVGPlugin; [official installation documentation](https://gsap.com/docs/v3/Installation/))
- Sass/SCSS
- svgson for SVG parsing
- ESLint 9

## Prerequisites

- Node.js and npm. The repository does not document a required Node version; the verified local baseline used Node 22.13.0 and npm 10.9.2.

## Installation

Dependencies are locked by `package-lock.json`.

```sh
npm ci
```

If PowerShell blocks `npm.ps1`, use `npm.cmd` in place of `npm`.

## Development and verification

```sh
npm run dev
npm run build
npm run lint
npm run preview
```

No test script is currently defined.

### Manual acceptance — stage transform authoring

On 2026-09-07, the user reported **PASSED** for the completed stage-transform/nudge acceptance checks: stage dragging, keyboard nudging, position-keyframe creation/update, Inspector and Timeline synchronization, persistence, and related editor behavior. This records user-performed acceptance, separately from automated/build checks.

Touch/pen cancellation, focus-loss edge cases, and exported code running in an entirely separate consuming application were not specifically hands-on verified and are not included in that acceptance claim. The subsequently reported stuck timeline drag was addressed separately with Pointer Events and capture; it is not covered by the earlier user acceptance report.

## Stage position authoring

Click an object to select it. Drag at least 3 screen pixels to preview a move; release to create or update its position keyframe at the current playhead, snapped to the same 30fps timebase as timeline authoring. A click alone creates no track or keyframe. Movement uses parent SVG coordinates and preserves nested transforms, rotation, and scale. Escape or pointer cancellation discards the preview.

With the stage focused, use arrow keys to move the selected object's X/Y by the Inspector's **Nudge** amount (default **1** SVG unit). Decimal amounts such as **0.1** or **0.5** are supported. Hold **Shift** for 10 times the amount; holding an arrow key repeats movement. Invalid amounts restore the previous setting. Form fields, interactive controls, menus, and dialogs keep their normal arrow-key behavior. **K** adds a keyframe on the selected track; **Delete/Backspace** removes the selected keyframe.

Drag/nudge edits live in the existing animation model, survive rebuilding and scrubbing, and flow through autosave, project JSON, and both exports. A single keyframe applies from its authored time onward. Nudge amount is session-only editor configuration: it is excluded from animation data, saved projects, and generated code.

## SVG path and anchor authoring

For an identified SVG `<path>`, choose **Add Track → Path**, then select its Path row to show anchor points on the stage. Other SVG element types do not offer Path. Use the diamond keyframe button or **K** to capture the current rendered geometry, including an interpolated shape at the playhead. To animate from the imported shape, capture it before moving anchors at a later time.

Drag an anchor at least 3 screen pixels to preview its movement. Release to create or update a Path keyframe at the pointer-down playhead time, snapped to 30fps and clamped to the duration. Clicking alone or returning to the starting position creates no animation data. The commit selects the target, Path track, and keyframe. The Inspector identifies Path keyframes and retains time editing; geometry is edited on the stage.

Movement uses the path's inverse screen CTM, supporting nested groups and the path's own transforms. Incoming/outgoing cubic control points move with their anchor; closed seams stay joined and multiple subpaths stay separate. Escape, pointer cancellation, lost capture, window blur, scrubbing, model/SVG replacement, modal opening, or unmount discards a pending preview.

Path keyframes store SVG `d` strings in the existing version 1 model. MorphSVG establishes the first/single keyframe from its authored time, interpolates subsequent values with optional easing, and holds the final value. Before the first keyframe the imported geometry applies. Path edits use normal autosave, immediate local save, project JSON download/load, and startup restoration. Both code exporters include and register `gsap/MorphSVGPlugin` only when Path tracks exist. Editor overlays never enter the stored SVG source or exports.

This foundation does not include Bézier control-handle editing, adding/removing anchors, drawing new paths, point-type changes, primitive conversion (rect/circle/etc.), joining/splitting, boolean operations, shapeIndex controls, or broader vector-authoring tools. These remain future work. MorphSVG handles normalization; curved/arc input may be represented as cubic geometry after editing.

### v0.2.0 verification and acceptance

Build and lint checks and temporary automated headless Chrome checks cover playback, path eligibility, geometry capture/upsert, transformed anchor dragging, cancellation, persistence, and export. The user reported manual testing and acceptance of v0.2.0 on 2026-09-15. Touch/pen interaction and exported code in a separate consuming application have not been separately verified.

## Project structure

```text
src/
  components/   Editor panels and controls
  styles/       Global and BEM-style component SCSS
  utility/      SVG parser, GSAP builder, and code exporters
  App.jsx       Editor state and orchestration
public/         Static assets and sample SVG
DOCS/           Legacy Phase 3 specification and design reference
```

## Project files and autosave

Project JSON version 1 stores `svgSource` and `animationModel`; project downloads also include lightweight metadata. The latest session is debounced to browser local storage under `gsap-svg-editor:last-session:v1` after an SVG has been loaded. The File dialog also offers an immediate local save and clear action.

## Current limitations

- This is an unfinished preview. Stage zoom/pan and focus-selection controls are not implemented; T04 Stage Navigation remains NEXT. Timeline zoom and undo/redo are also unavailable.
- SVG import sanitizes content. External/embedded images and fonts, stylesheets, SMIL, `foreignObject`, DTD/entity declarations, CSS variables/escapes, and inline `!important` priority are unsupported. Text and `use` elements can render but do not gain timeline-authoring controls.
- Path editing moves existing anchors only; drawing paths, adding/removing anchors, and editing Bézier handles are not supported.
- Autosave is local to the browser and origin, with no cloud sync. Download project JSON to retain a portable copy. Clear Autosave can remain disabled after Save Now until reload.
- Exported React code is a scaffold with an empty SVG placeholder; it does not include the imported SVG markup.
- There is no automated test suite. Timeline dragging uses captured Pointer Events; touch/pen cancellation still needs device verification.
- Cross-browser, dedicated screen-reader, and exported React component acceptance in a separate application remain unverified. Modal focus trapping and trigger-focus restoration are not implemented.

Direct SVG import, project JSON loading, and autosave restoration all use the shared asynchronous SVG parsing utility.

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the active upcoming v0.3.0 task sequence, task statuses, and deferred development backlog. The current released version remains v0.2.1.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the current implementation boundaries and data flow.
