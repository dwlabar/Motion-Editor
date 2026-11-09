# Architecture

Motion Editor uses the local `motion-engine` dependency for preview in T02. GSAP remains for stage authoring, MorphSVG path editing, and exports until T03–T05. The sibling engine and original editor projects are read-only. See [T02 verification](DOCS/T02-VERIFICATION.md) for the remaining integration conflicts.

## Core model

The application release version is `0.1.0`, recorded in npm package metadata and release documentation. Project JSON and the animation model retain schema version `1`. Application releases do not change the schema version unless a separate format migration is deliberately designed.

The animation model is the source of truth. It is a serializable version 1 object with `id`, `label`, `duration`, and `tracks`. Each track is identified by a `targetId` and `property`, and contains ordered keyframes with a time, value, and optional easing. The current editor supports `position`, `opacity`, `rotation`, `scale`, and `path`. Path values are SVG `d` strings; the schema remains version `1`.

Fresh sessions and raw SVG imports create an empty model with a new id, a neutral label, a 2-second duration, and zero tracks. The File dialog reuses `SvgImporter` to replace artwork and reset animation authoring. Sample artwork follows that same path. Project JSON and autosave restoration retain their saved models unchanged.

Motion Engine state is derived from the model. `createTimeline` validates and snapshots tracks; `createPlaybackController` schedules evaluation; `createSVGAdapter` applies snapshots to the mounted imported SVG. Single-keyframe tracks hold that value from their keyframe time onward; before the first keyframe, the imported SVG baseline applies. Model duration includes time after the last keyframe and timelines with no animated tracks. Preview state is not persisted authoring state. The legacy `buildGsapTimeline` utility remains unused pending dependency cleanup.

## Application shell

`src/main.jsx` mounts `App` in React Strict Mode. `src/App.jsx` owns imported SVG state, selection state, animation-model updates, keyframe and track selection, scrub position, drag state, modal state, autosave, project restoration, and Motion Engine preview lifecycle.

The primary UI responsibilities are:

- `SvgImporter`: reads a selected SVG file and passes renderable SVG JSX, a shape list, and source text to `App`.
- `Timeline`: renders selectable shape/property rows, adds tracks, selects and drags keyframes, adds keyframes, and controls scrubbing.
- `Inspector`: edits the selected keyframe through callbacks to `App` and exposes the editor-only Nudge amount whenever a target is selected.
- `useStagePositionAuthoring`: handles pointer preview/cleanup and keyboard movement through the shared position commit callback.
- `useStagePathAuthoring`: handles transient anchor dragging and cancellation; `PathHandles` renders the editor-only anchor overlay.
- `TopBar`, `AppModal`, `FilePanel`, and `ExportPanel`: provide file/project and export UI.

## SVG import and shape list

`src/utility/parseSvgToJsx.js` is the shared asynchronous SVG parser for direct imports, project JSON restoration, and autosave restoration. It uses `svgson` to parse raw SVG text, recursively converts nodes to React elements, retains visual attributes, filters Inkscape and Sodipodi attributes, and builds a list of identified drawable shapes/groups. Anonymous groups remain in the SVG hierarchy to preserve inherited styles and ancestor transforms. It returns `{ svgTree, shapeList }` or `null`.

The imported SVG is cloned to add the root ref and pointer handler. Path anchor handles remain editor-only SVG overlays appended to the rendered SVG tree. Selection bounds render in a separate, workspace-sized SVG sibling of the stage content scroller. Element-local bounds pass through the element screen CTM and the overlay inverse screen CTM, preserving nested/GSAP transforms and responsive sizing. Resize and scroll refresh the mapping, alongside playback and authoring updates. The overlay ignores pointer events, cannot expand scroll bounds, and clips only at the visible workspace, not the imported scene viewport. Neither overlay changes the source SVG, viewBox, project data, or exports.

`useDocumentFit` derives the document viewport from absolute SVG dimensions (including browser-resolved physical units), with viewBox proportions for missing/percentage dimensions and a 300×150 fallback when neither supplies a size. A separate HTML document wrapper uniformly scales down to the workspace's padded content area; the centered frame follows that fitted size. The root viewport retains its document proportions even without a viewBox. Nested SVG viewports are not constrained by editor sizing rules. Workspace resize refits the document and refreshes the existing CTM-based overlays. This automatic layout has no persisted view state or pan/zoom controls.

## Selection, tracks, and keyframes

`selectedId` identifies the selected SVG element. `selectedTrack` identifies the authoring focus by target id and property. `selectedKeyframe` additionally includes keyframe time. `App` updates the model immutably when tracks are added, keyframes are added or deleted, or inspector/timeline edits are committed.

Timeline derives the current target from keyframe/track focus, falling back to `selectedId`. The parent shape keeps a subtle highlight while its active property receives stronger emphasis, including during keyframe selection. No extra selection state is stored. Unselected keyframe diamonds are neutral gray with lighter neutral hover feedback; selected diamonds retain their cyan treatment.

New transform keyframes still capture GSAP properties from the selected target; these reads can be stale or differ from engine-rendered values and are deferred to T03. Path keyframes read the rendered `d` attribute, including engine-interpolated paths. Duplicate track/property combinations and duplicate keyframe times are rejected. The timeline displays only tracks for shapes present in the shape list.

`src/utility/authorPosition.js` provides the immutable position upsert used by stage dragging, keyboard nudging, and normal position-keyframe creation. It creates a missing position track, replaces the value at an existing time (retaining easing), or inserts a sorted keyframe. Stage edits and normal keyframe creation share the timeline's 30fps snapping and duration clamp. Repeated nudges resolve against the latest model value through React's functional state update. `App` then selects the target, position track, and committed keyframe. Clicking without movement does not author animation data.

Nudge amount belongs to editor configuration in `App`, defaults to 1, and accepts only finite positive numbers through the Inspector. It is not part of project JSON, autosave, model versioning, or either export. Arrow keys change X/Y by that amount; Shift multiplies it by 10. Native key-repeat is accepted. Alt/Ctrl/Meta combinations are not nudges. Inputs, editable content, interactive controls, menus/popovers, and open dialogs retain their keyboard behavior. Only a handled nudge prevents arrow-key scrolling; Delete/Backspace and K keep their keyframe shortcuts.

Timeline layer selection focuses the existing canvas so arrow-key authoring is available immediately. Selection and nudge eligibility resolve the target by id regardless of scene intersection; off-stage targets retain the same Inspector and model authoring paths. Objects beyond the visible workspace remain selectable/editable without automatic view navigation.

## Path authoring foundation

`shapeList.type` gates Path creation and stage editing to identified `<path>` targets. Preview reports an error for animated Path tracks targeting non-path elements or incompatible topology. Duplicate target/property tracks use existing prevention rules. Path rows reuse normal Timeline keyframe selection, dragging, snapping, deletion, and keyboard shortcuts. The Inspector presents a Path geometry hint in place of a scalar input.

`pathGeometry.js` uses the freely available MorphSVGPlugin from installed GSAP 3.13: `stringToRawPath()` converts geometry to cubic subpaths and `rawPathToString()` serializes edits. There is no custom SVG parser or interpolator. `pathAnchors()` exposes existing anchors; `movePathAnchor()` translates an anchor and adjacent incoming/outgoing controls. A closed seam moves both copies of the endpoint and their controls. Multiple subpaths remain separate.

`useStagePathAuthoring` snapshots the current rendered `d`, RawPath, path screen inverse CTM, and playhead at pointer-down. Captured Pointer Events on the stable SVG root preview only `d`; no model updates occur on pointermove. Commit first restores the rendered snapshot, then `authorPath()` immutably upserts the snapped/clamped Path keyframe, preserving existing easing. App synchronizes target/track/keyframe selection. Clicking alone and returning to the start do not author data. Handle events cannot initiate position dragging.

Cancellation on Escape, pointercancel, lost capture, blur, model/SVG replacement, scrub, selection change, modal opening, and unmount restores the snapshot before playback rebuild/seek. The overlay transforms local anchors through screen coordinates into root SVG space, maintaining constant screen-size handles. Resize and scroll refresh their placement. Neither preview geometry nor handles modify `svgSource`.

No Bézier handle UI, anchor insertion/deletion, new-path drawing, primitive conversion, point-type changes, joining/splitting, boolean operations, shapeIndex UI, or broader vector tooling is included. These remain future work. The user reported manual testing and acceptance of v0.2.0 on 2026-09-15.

## Preview, timeline rebuild, and scrubbing

When the imported SVG tree or animation model changes, `App` suppresses callbacks from the retired controller, pauses it, and resets its SVG adapter before capturing a new baseline. It creates a new engine timeline/controller/adapter, seeks the retained playhead, and resumes if playback was active and is before the end. A layout effect and scrub ref keep rebuilding independent from ordinary scrubbing without a stale closure. The model duration is the editor timebase; `scrub` is a normalized value from 0 through 1. Scrubbing calls `controller.seek(scrub * duration)`, while duration changes retain absolute seconds and clamp to the new end.

The SVG adapter composes each snapshot with its captured baseline and restores omitted properties when seeking before their first keyframe. Reset restores original inline declarations/priorities and path data. GSAP no longer initializes or resets preview state. `captureSvgPlaybackState` remains in the stage-authoring hook to restore its transient GSAP previews, including transform-cache and MorphSVG bookkeeping; replacing that authoring path is T03/T04 work.

Controller updates drive the playhead and Play/Pause state directly, including endpoint completion. Loop uses `setLoop`; Restart preserves the existing paused return to zero. Invalid models or unsupported paths stop preview with a notification, without conversion or fallback. A valid rebuild recovers. Engine target-baseline composition differs from GSAP channel replacement, so transformed-target projects and unchanged exports can differ; GSAP property capture/nudging also remain incompatible in concrete cases documented in the T02 report.

Pointer dragging starts from the current GSAP X/Y and converts screen movement through the inverse parent screen CTM. A 3px activation threshold matches timeline keyframe dragging. A separate transient GSAP context previews only X/Y, preserving rotation, scale, skew, and ancestor transforms. Pointer release reverts the preview and commits the final position to the model at the pointer-down playhead time; raw pointer moves do not rebuild the timeline. Pointer capture tracks the initiating pointer. Cancellation, lost capture, Escape, window blur, model/SVG replacement, scrubbing, and unmount discard the preview. Returning to the start without a net position change does not author a keyframe. The stored original SVG source is never rewritten by movement.

Timeline playhead and keyframe gestures use Pointer Events captured on the stable timeline container. Previously, window mouse listeners allowed native text/element dragging to interrupt the expected mouseup sequence and leave stale drag state. The pointer-down handler now takes ownership only for a primary-button custom gesture, suppresses its native default, and tracks the initiating pointer. Pointer-up clears state and releases capture before committing; cancellation, lost capture, Escape, blur, timebase/SVG replacement, or unmount end the gesture. A move reporting the primary button released also cancels stale state. Keyframe cancellation discards the transient time preview; playhead cancellation leaves the last scrub position. Text-selection/touch-action and HTML-drag suppression are limited to ruler/keyframe surfaces. Clicking still selects keyframes or scrubs, and existing 3px keyframe activation and 30fps snapping remain in place.

Stage-transform/nudge authoring has completed user manual acceptance; see the [README acceptance record](README.md). That record excludes touch/pen cancellation, focus-loss edge cases, and exports running in a separate consuming application. Inspector auto-key semantics and Add Track/Add Keyframe control design remain future product work tracked in [ROADMAP.md](ROADMAP.md).

## Persistence and export

Local autosave writes `{ version, savedAt, svgSource, animationModel }` after an 800 ms debounce, only once SVG source is available. On startup, `App` awaits the shared parser before restoring a local session. `FilePanel` downloads a version 1 project JSON payload and validates basic shape/version requirements before passing a load request to `App`.

Project JSON loading validates its payload, awaits the same shared parser, and only then replaces SVG, shape-list, model, selection, and scrub state. Invalid SVG parsing returns failure without partially replacing the current project.

`exportGsapTimeline` converts tracks to `gsap.timeline()` source, including an explicit first-keyframe set for single- and multiple-keyframe tracks, and retains model duration. `exportReactComponent` emits a React/GSAP component scaffold using the same mapping logic. The focused `trackValueProps` mapping is shared by the builder and both exporters. Path uses `morphSVG` tweening; each exporter conditionally imports/registers `gsap/MorphSVGPlugin`, preserves timing/easing and first/single keyframes, and escapes path strings with JSON serialization. All properties use the existing model and persistence format, including debounced autosave, immediate local save, project download/load, and startup restoration. Neither exporter currently accepts or emits imported SVG markup.

## Figma Application Shell Boundaries

v0.2.1 restores the [canonical Figma reference](https://www.figma.com/design/YKXYCBUHObeNkn4CRML2UG/Untitled?node-id=1-103&m=dev), Desktop node `1:49`, while retaining the accepted v0.2.0 functionality. Design context, screenshots, Auto Layout, fills, effects, and child geometry were inspected through Figma MCP. Current values live in `src/styles/_settings.scss` and existing SCSS/BEM components. Local font faces are declared in `_fonts.scss`; exported assets and font licenses live in `public/figma` and `public/fonts`.

The shell uses a 60px topbar and a flexible workspace beside a 320px inspector. The workspace's Grid rows use a 104:66 ratio (624:396 at the reference viewport), with minimum heights of 240px. Timeline rows scroll inside one container with a sticky 57px ruler. Ruler and rows therefore lose exactly the same width to any scrollbar. Narrow layouts reduce control-column widths and eventually place the inspector beneath the workspace; they do not change animation data.

Shape and property rows share a Grid layout: label/content, a 36px action cell, then the timeline lane. The action cell sits inside the shared 304px control column (which narrows at existing responsive breakpoints). Both Add Track and Add Keyframe use `TimelineRowAction`, a semantic button with shared styling and pointer isolation; icon, accessible label, disabled state, ref, and existing callbacks/menu attributes are passed as props. Dark seams separate the cells without a right-side action rail.

Every `.timeline__time-area` has the same left/right endpoint gutter after the control column, using the full remaining timeline width. The gutter is the greater of 32px or half the measured duration-label width plus 8px. Labels always center on their ticks. ResizeObserver tracks the duration label's font/size and the usable ruler width for tick density. Markers use time/duration percentages within that box; the ruler and full-height row playhead inherit one percentage from the timeline. Pointer seeking and drag commits measure the ruler box through `getBoundingClientRect()`. There is no independent row time scale. Hash positions derive from the same tick fractions. Figma's fixed 160px sample units become a density target while actual duration remains fitted to the available width. The v0.2.0 lane `overflow: hidden` boundary workaround is removed; both 14px endpoint markers fit inside the gutters. Frame snapping, model time storage, keyboard Position authoring, and Inspector time editing retain their existing semantics. These shared bounds remain the place to add future zoom/pan; neither is implemented here.

- Preserve `App` state ownership and its existing callbacks.
- Preserve the animation model as the source of truth, plus derived timeline rebuilding and scrubbing behavior.
- Preserve SVG import, selection, project persistence, and export behavior.
- Use CSS Grid for major editor regions when appropriate and Flexbox for toolbars, rows, and grouped controls.
- Do not reproduce Figma coordinates with unnecessary absolute positioning. Absolute positioning remains appropriate for editor overlays such as playheads, keyframes, selection boxes, handles, and canvas controls.
- Prefer structural wrappers and SCSS changes over rewriting component behavior.
- Do not introduce Tailwind or dependencies without approval.
- Do not replace existing components solely to match visual styling.
- Maintain accessible buttons, labels, dialogs, and keyboard behavior, and preserve existing BEM naming where practical.
- The fidelity pass covers the shell, timeline geometry, and existing controls; it does not add the deferred large-SVG or track-authoring redesign.

The current visual slice includes the full-window application frame, top toolbar, SVG preview workspace, right inspector, timeline and shape/property rows, surface hierarchy, typography, borders, gradients, and inset shadows. The mockup's placeholder property fields are represented by the current functional Inspector controls; no authored controls or tracks are removed to mimic the historical mockup. Browser verification and user manual acceptance are recorded in README. The user accepted all current v0.2.1 work, including their manual SCSS refinements, on 2026-09-22.

## Invariants and redesign boundaries

- Keep the animation model as the source of truth and Motion Engine as derived preview state.
- Keep imported SVG content separate from the editor UI and overlays.
- Preserve the model timebase and immutable model-update flow.
- Preserve supported-property semantics and project JSON version 1 unless a deliberate migration is designed.
- Preserve existing comments and file-level version histories.
- Visual redesign work must not silently rewrite editor behavior, parser behavior, selection semantics, timeline semantics, persistence, or export contracts.
- Use layout systems for the app shell; reserve absolute positioning for true editor overlays such as playheads, keyframes, selection boxes, handles, and canvas controls.

## Technical debt and known limitations

- Confirmed: `npm run lint` reports two pre-existing React Hook dependency warnings: autosave availability in `App` and export rebuilding in `ExportPanel`. Keyboard shortcut and timeline rebuild dependency warnings have been resolved.
- Suspected: exporters interpolate raw SVG ids into CSS selectors, which can fail for ids requiring CSS escaping. Runtime playback resolves elements within the imported SVG by id.
- The React exporter is intentionally incomplete as a portable artifact because it leaves SVG markup to the consumer.
- Path authoring moves existing anchors only; full vector editing remains future work. Automated browser verification does not replace user manual acceptance, device checks, or external export integration.
