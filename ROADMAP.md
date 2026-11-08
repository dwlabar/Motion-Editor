# Development Roadmap

- **Current released version: 0.2.1**
- **Active upcoming release: 0.3.0 — unreleased**

This is the active development plan. Tasks run in the order below; NEXT identifies the next task to begin, not work already implemented. Package versions remain at 0.2.1 until acceptance and release work in T06. The animation model remains authoritative, GSAP remains derived playback state, and application versions remain independent of project schema versions.

## v0.3.0 task sequence

| ID | Task | Status |
| --- | --- | --- |
| T01 | Selection + Inspector UX | COMPLETE |
| T02 | Off-stage Object Selection + Editing | COMPLETE |
| T03 | Editor Baseline Cleanup | COMPLETE |
| T04 | Stage Navigation | NEXT |
| T05 | Animation Duration + Transport Foundation | Planned |
| T06 | v0.3.0 Acceptance + Release | Planned |
| T07 | Topbar Logo | COMPLETE |
| T08 | SVG Import Sanitization & Compatibility | COMPLETE |
| T09 | Animation Duration | COMPLETE |
| T10 | Center Workspace Crosshair | COMPLETE |
| T11 | Timeline Visual Fixes | COMPLETE |
| T12 | Transport Controls & Inspector UX | COMPLETE |
| T13 | Modal Menu Reskin | COMPLETE |
| T14 | Timeline Scrollbar & Selection Colors | COMPLETE |
| T15 | Public Demo Preparation | COMPLETE |

### T01 — Selection + Inspector UX

- Improve Inspector readability from feedback item A.
- Establish a single active-selection visual model from feedback item B: only the most specific selected item receives the active highlight, rather than highlighting both its parent layer and property track.
- Reduce the visual weight/thickness of stage selection bounds from feedback item C.

Manual acceptance passed on 2026-10-05, confirmed by the user: layer selection, property-track selection, keyframe selection, single-active-selection precedence, stage-object selection, stage dragging, scrubbing, selection-bounds alignment, Inspector Target/Property metadata, and Inspector editing controls. Continuous playback is outside T01 acceptance because the editor UI currently exposes no Play control.

### T02 — Off-stage Object Selection + Editing

- Keep shapes selectable from the timeline when outside the stage, and keep selected off-stage shapes editable and nudgeable.
- Do not clip selection overlays merely because an object is outside stage bounds when its position is still visible in the editor workspace.
- Selection and editability must not depend on whether an object is inside scene bounds.

T02 keeps the existing selection/model authoring flow, moves selection bounds into a workspace-sized editor overlay, and focuses the canvas after Timeline layer selection for immediate nudging. T03 baseline cleanup follows; T04-T06 remain planned. No stage navigation or release/version work is included.

Automated browser checks covered sample SVG import, off-stage Timeline reselection, configured/repeated/Shift nudging and return to scene, Position commits and Inspector editing, T01 highlight precedence, in-stage click/drag, Path anchor authoring, scrubbing, nested translated/rotated/scaled targets, workspace resizing, autosave restoration, and overlay-free GSAP/React output. Build and whitespace checks passed; lint retained the two existing Hook warnings with no errors. The automated project-download check timed out; persistence separation was checked in code and through autosave restoration.

Manual acceptance passed on 2026-10-06, confirmed by the user: all requested T02 UI checks and downloaded project JSON verification passed.

### T03 — Editor Baseline Cleanup

- Replace the prototype demo model with a clean schema-1, 2-second model for fresh sessions and every raw SVG import, including sample.svg; retain saved models on project/session restoration.
- Align shape Add Track and property Add Keyframe controls in one left-side action column within the existing label width, using the same reusable button. Keep the full shared time domain and endpoint gutters without a right-side action rail.
- Use restrained panel seams, a subtle current-target shape highlight beneath the stronger active-property highlight, and neutral keyframes that turn cyan when selected. This revises T01's visual precedence while retaining its selection model.
- Fit the imported document uniformly into the centered workspace while retaining source dimensions, viewBox semantics, and CTM-based selection/Path editing.
- Remove the obsolete demo fixture and correct its repository-map references. Reuse the SVG importer in File for subsequent raw imports.

T03 is complete, with user acceptance confirmed on 2026-10-06. Package versions remain 0.2.1 and project/model schemas remain 1. T04 Stage Navigation is NEXT, not started; T05 duration/transport work remains planned.

The manual-review revision replaces the rejected right-side rail with shared left-side row actions. Focused automated in-app browser checks covered aligned action cells and time domains at desktop/narrow widths, exact 2-second scrub/drag endpoints, Add Track/Add Keyframe behavior, hierarchical selection transfer, neutral/hover/selected diamonds, stage drag/nudge/off-stage edits, Path anchor dragging, square/landscape/portrait fitting, clean sample/replacement imports, schema-1 project loading, and autosave restoration. The revision's download-event observation timed out, so a downloaded-project round-trip was not reverified. These checks do not constitute user acceptance.

Automated Edge browser checks covered fresh/sample imports, new track/keyframe authoring, replacement-import reset, authored autosave and downloaded-project round-trips, exact ruler/scrub/drag endpoints, shared row/ruler/keyframe alignment at desktop and narrow breakpoints, square/landscape/portrait fitting, selection bounds, stage dragging, arrow/Shift nudging, off-stage reselection/editing, Path anchors, and nested/source/GSAP transforms including resize. The actual cube source is 1889.7638×1889.7638 with a 500×500 viewBox; an exact 1417×1417 fixture was also checked. Build and whitespace checks passed; lint retained the two existing Hook warnings with no errors. These automated checks do not constitute user manual acceptance; touch/pen, other browser engines, and external export execution remain unverified.

### T04 — Stage Navigation

- Add stage zooming and panning using familiar graphics-editor behavior, with zoom toward the pointer.
- Support appropriate pan interactions such as middle-mouse drag and Space + drag.
- Add Reset View / 100% and Frame / Focus Selection functionality.
- Treat zoom and pan strictly as view state; they must not change asset coordinates or animation data.

### T05 — Animation Duration + Transport Foundation

- Add a way to edit total animation duration, conceptually separate from selected-object properties.
- Treat the upper-right area above Properties as the likely location for future transport/document-level controls.
- Do not implement transport controls beyond what duration work requires unless separately approved.

The duration control is implemented separately in T09 at the user's request. The transport foundation is complete in T12 below. Additional transport scope still requires separate authorization.

### T06 — v0.3.0 Acceptance + Release

- Perform a full interaction and UX regression pass, including selection, stage/Path editing, navigation, duration, timeline/keyframes, keyboard behavior, persistence, exports, and responsive layout.
- Review documentation; record automated checks separately from user manual acceptance and explicitly identify unverified cases.
- Perform release/version work only after acceptance, following [AGENTS.md](AGENTS.md). Commit, integration, tagging, and pushing require their respective explicit authorizations.

### T07 — Topbar Logo

- Add the supplied vector SVG as a decorative, noninteractive logo at the far left of the topbar, matching the supplied mockup's proportions, spacing, and alignment.
- Keep File, Export, and About beside the logo and retain the GSAPANIMATE wordmark at the far right, with tighter spacing at smaller widths.
- Preserve existing menus, behavior, and styling; no animations, dependencies, package-version changes, or project-schema changes.

T07 is complete, with user acceptance confirmed on 2026-10-26. Implemented out of sequence at the user's request; T04 remains NEXT, and T04-T06 scope is unchanged.

Build and whitespace checks passed; lint reported no errors and retained the two existing Hook warnings. The bundled SVG is byte-identical to the supplied source. Automated browser layout and menu interaction checks were not performed; user acceptance is recorded separately.

### T08 — SVG Import Sanitization & Compatibility

- Validate XML and sanitize through DOMPurify's SVG/filter profiles before svgson parsing, including project and autosave restoration through the shared importer.
- Retain shapes, IDs, groups, transforms, defs, gradients, local references, masks, clip paths, and text. Normalize React SVG/namespaced attributes and inline styles, and decode XML entities once before React escaping. Definition-only geometry is retained without becoming an editable timeline target.
- Remove scripts, event handlers, external resources, editor metadata, embedded images/HTML, stylesheets, and source SVG animation. Support an explicit set of inline visual styles and local fragment URLs; strip unsupported declarations and CSS indirection. Show concise import warnings and invalid-file errors.
- Keep package version 0.2.1, project/model schemas 1, existing animation behavior, and persistence contracts. DOMPurify is the only added direct dependency; existing dependency versions are unchanged.

T08 is COMPLETE. Finalization and local normal-merge integration were authorized by the user on 2026-10-27. T09 is NEXT by explicit user instruction; its scope has not been specified and no T09 work has begun. T04-T06 remain planned.

Automated Edge checks passed for normal sample import; a three-shape fixture with a linked gradient, mask, clip path, and ancestor transform; local use references; text/entity/quoted-style handling; invalid XML/root/DTD rejection; scripts, handlers, external URLs, CSS URL escapes/indirection, and unsafe project loading. No React attribute warnings, page errors, or external requests were observed. The definition-only shape stayed out of the timeline. Position nudging, downloaded project reload, and autosave reload preserved the exact animation model and SVG source with schema 1; no persistence changes were needed.

The initially supplied `icon-design_v03.svg` imported with all 193 paths and 18 linear gradients. Path geometry (ignoring surrounding whitespace), source transforms, viewBox, and gradient inheritance references were retained. This is a large Inkscape working document with artwork outside its page, not the described three-shape file.

The subsequently supplied original `icon-design_isolated_03.svg` passed the exact-source Edge check: `icondesign_grid`, `icondesign_core`, and `icondesign_border` all rendered. The core retained `url(#linearGradient2)`, its `xlink:href="#linearGradient1"` inheritance, gradient transform, and both blue color stops. Screenshot inspection confirmed the visible blue gradient, grid, and border. No React attribute warnings or page errors occurred. Downloaded project reload and autosave reload retained all three paths, the core gradient, and the exact schema-1 model/source. No further source changes were necessary; this closes the earlier source-file verification gap, without substituting automated checks for user manual acceptance.

Reusable application-wide notifications replace persistent SVG import messages: success, info, warning, and error variants; fixed top-center stacking above modals; approximately six-second independent lifetimes; close buttons; polite/assertive announcements; subtle entrance/exit animations with reduced-motion support. Sanitized successful imports warn, while failed imports report errors. Unrelated components were not migrated.

Automated notification checks passed for three rapid API notifications, non-overlapping desktop/narrow-screen stacks, middle-only dismissal, independent expiry (about 6.19 seconds including exit animation), unchanged editor layout, modal placement, reduced motion, and no application console errors. The final keyboard check reached the close button with Tab and dismissed it with Enter. Temporary verification code was removed. The final diff review found no unintended changes.

Build and whitespace checks passed; lint retained only the two existing Hook warnings in App and ExportPanel. Previously passed tests were not repeated during finalization. User visual acceptance, screen-reader testing, and other browser engines are not independently recorded. Limitations: external/embedded images and fonts, stylesheets, SMIL, foreignObject, DTD/entity declarations, CSS variables/escapes, and inline !important priority are unsupported. Text and use elements render but do not gain new timeline-authoring capabilities in this task.

### T09 — Animation Duration

- Add an editable duration in seconds above Properties, separate from selected-object controls, using existing input styling and application notifications. Enter or blur commits; Escape cancels the draft.
- Keep `animationModel.duration` authoritative. Reject non-finite/non-positive inputs and durations before the last keyframe, with concise feedback and no model change.
- Preserve absolute keyframe times and the playhead's time in seconds. If shortening places the playhead beyond the new end, clamp it to that endpoint.
- Reuse the existing model-driven ruler, scrubbing, GSAP timeline padding, project save/load, autosave, and both exporters.

T09 is COMPLETE. Implemented on `codex/0.3.0-t09-animation-duration` from clean local `master` on 2026-10-28. The user authorized finalization, commit, and local normal-merge integration on 2026-10-28. Active release 0.3.0, package 0.2.1, and project/model schema 1 are unchanged. No dependencies or transport controls were added. Passed tests were not repeated during finalization.

Automated headless Edge checks passed for 2s → 5s and 5s → 3s while retaining a 1s playhead; unchanged keyframe times/values; zero, negative, blank, non-finite, and too-short input rejection; Escape cancellation; a duration equal to the last keyframe; ruler updates; endpoint scrubbing; and playhead clamping after shortening. Downloaded project reload and autosave reload retained duration and schema-1 keyframes. GSAP preview and executed raw GSAP output retained 2s/5s/3s durations and 1.5s keyframe timing; React output retained matching timing and duration padding. The preview value at 1s stayed unchanged across durations. No browser page errors were observed. Desktop and narrow screenshots were inspected.

Build and whitespace checks passed. Lint reported no errors and only the two existing Hook warnings in App and ExportPanel. User manual acceptance, other browser engines, and mounting the exported React component in an external application remain unverified.

T09 ruler review fix: choose readable intervals that divide the duration evenly and fit the measured lane width, retaining both endpoints without selectively dropping labels. Fractional labels retain their timing precision. Existing SCSS, shared time-area geometry, and pointer mapping remain unchanged. Focused automated Edge checks passed for 143 combinations of 13 durations (0.125s–120s) and 11 viewport widths (320px–1920px), including the 3s resize case: even label spacing, endpoints, no overlap/clipping, aligned ruler/row geometry, and midpoint scrubbing. No page errors occurred. Unrelated persistence/export checks were not repeated.

### T10 — Center Workspace Crosshair

- Center the gray cross within each repeating workspace background tile, as clarified by the user on 2026-10-28. This is decorative tile artwork, not a document-origin marker or a single workspace-center overlay.
- Preserve the 42 × 42 repeat size, glyph geometry, color, opacity, and existing workspace layout. Center the 7 × 7 glyph using an intrinsic SVG translation of `(42 - 7) / 2` on each axis, without viewport-dependent layout offsets.
- Leave SVG fitting, coordinates, selection, animation, and scrolling unchanged. Stage zoom/pan remains planned in T04; no navigation behavior is added here.

T10 is COMPLETE. Implemented on `codex/0.3.0-t10-center-crosshair`; the user confirmed visual acceptance and authorized commit and local integration on 2026-10-28. Active release 0.3.0, package 0.2.1, and project/model schemas 1 remain unchanged.

Focused checks passed: SVG parsing, tile/glyph centering arithmetic, retained tile size/color/opacity, and `git diff --check`. No application code or styles changed, so build and lint were not run. Automated browser rendering was not checked; user visual acceptance is recorded separately above.

### T11 — Timeline Visual Fixes

- Raise the playhead above the ruler's horizontal border without changing timeline geometry, scrolling, or pointer handling.
- Remove the dragging keyframe's rectangular box-shadow. The artifact came from the dragging CSS modifier, not native dragging, browser selection, or keyboard focus. Preserve the selected diamond's existing drop-shadow and visible keyboard focus styles.

T11 is COMPLETE. Implemented on `codex/0.3.0-t11-timeline-visual-fixes`; the user confirmed visual acceptance and authorized commit and local integration on 2026-10-28. Active release 0.3.0, package 0.2.1, project/model schemas, and dependencies are unchanged.

Build and whitespace checks passed; lint retained the two existing Hook warnings with no errors. Focused automated headless Edge checks passed for drag styling/selection, committing a dragged keyframe, Escape cancellation, midpoint scrubbing, sticky ruler scrolling, visible keyboard focus and Enter activation of Add Keyframe, and ruler/lane alignment at desktop and narrow widths. Screenshot inspection confirmed the continuous playhead and absence of the square drag shadow. No browser page errors occurred. User visual acceptance was confirmed on 2026-10-28; other browser engines remain unverified.

### T12 — Transport Controls & Inspector UX

Renumbered to T12 at the user's request; the completed T10 crosshair and T11 timeline fixes above retain their original identifiers and acceptance history. The originally requested branch name is retained.

- Clear object/track/keyframe selection and its cyan outline on empty-stage clicks or Escape. Preserve drag cancellation and the existing Escape behavior of input drafts, menus, and modals.
- Replace the duration strip with compact Restart, Play/Pause, Loop, and the existing editable Duration control. Preview uses the derived GSAP timeline; the timeline playhead and transport state stay synchronized. Restart pauses at zero; Play at the endpoint starts again. Stage/timeline pointer authoring and scrubbing pause preview. Loop is preview configuration, separate from project data.
- Put the single Nudge control in an inset SETTINGS panel. Keep PROPERTIES contextual to the selected object/keyframe and remove the unused EFFECTS panel. Direct object transform fields/auto-key remain deferred.
- Add “Easing to next keyframe” for non-final keyframes: Linear plus Power1, Power2, and Power3 In/Out/InOut. Optional `easeToNext` belongs to the starting keyframe and follows that keyframe through edits, reordering, and deletion of neighboring keyframes. A final keyframe retains its stored value for later reordering but exposes no outgoing control.
- Retain the existing GSAP `power1.out` default. On project/autosave restoration, migrate legacy destination-keyframe `ease` values to their starting keyframes without changing the rendered transitions; saved GSAP eases outside the presets remain readable. Playback and both exporters share the same transition resolver. Project/model schemas remain 1.

Implemented on `codex/0.3.0-t10-transport-inspector` from clean local `master` at `6e75e1d`, after finalized T09. T12 is COMPLETE. The user confirmed review and authorized finalization, commit, and local integration on 2026-10-28. T04 Stage Navigation is NEXT and has not been started. Active release 0.3.0, package 0.2.1, dependencies, and schema versions are unchanged.

Focused automated headless Edge checks passed for empty-workspace/SVG and Escape deselection; stage/keyframe drag cancellation; stage dragging; configured/Shift nudging; contextual properties; keyboard transport; play/pause/restart/completion; empty-track playback; loop wrap/toggling; duration validation, cancellation, absolute-time preservation, clamping, and rebuild during playback; scrubbing; all ten easing presets; keyframe reordering by Inspector and dragging, collision rejection, and deletion; legacy easing restoration; downloaded-project and autosave round trips; and matching preview/executed GSAP export values for every preset. React output contains matching easing values; position/Path authoring preserves outgoing easing. No browser page errors were observed. Desktop/narrow screenshots were inspected, and the 260px sidebar fit check passed.

Build and whitespace checks passed; lint retained only the two existing Hook warnings in App and ExportPanel. User review acceptance is recorded above. Touch/pen, other browser engines, and mounting the exported React component in an external application remain unverified. Completed tests were not repeated during finalization.

### T13 — Modal Menu Reskin

T13 is COMPLETE on `codex/0.3.0-t13-menu-reskin`, based on clean local `master` at `ff7c56e` after finalized T12. The initial implementation is preserved in review checkpoint `c659c99`; the final refinements passed user visual approval on 2026-10-29, with commit and local integration authorized. Release, package, schema, and dependency versions are unchanged; T04 remains NEXT.

- Apply the supplied GIMP treatment to the shared File, Export, and About shell: charcoal surfaces, thin gray borders/dividers, uppercase headings and controls, rectangular outlined actions, and a square close button with a centered SVG X.
- Keep two-column action/control layouts at wider widths and stack them below 480px. Use content-driven dialog height, viewport bounds, and a scrolling body with the header kept visible.
- Match File's action order and concise labels. Retain SVG import and autosave help text absent from the mockup, and omit its unused lower space. Export and About extend the supplied File styling; no separate mockups were supplied for them.
- Preserve action handlers, disabled rules, keyboard dismissal, and existing focus behavior. Focus trapping and trigger-focus restoration were not present in the original shell and are not added in this visual task.

Automated headless Edge checks passed for all three dialogs at 1280×900, 390×844, 320×480, and 844×390: viewport bounds, no horizontal body overflow, Escape dismissal, and screenshot inspection. Interaction checks covered SVG import, Save Now, autosave clear after reload, downloaded-project reload, GSAP/React output, component name and precision controls, output clearing, Enter activation of Close, backdrop dismissal, and retaining the dialog on content clicks. No browser page errors occurred. Existing limitation: Clear Autosave can remain disabled after Save Now until reload because autosave availability is memoized; this unrelated behavior is unchanged.

Build and whitespace checks passed; lint retained the two existing Hook warnings with no errors. User visual approval was confirmed on 2026-10-29; screen-reader acceptance and other browser engines remain unverified.

T13 styling refinement: sharpen the centered inline SVG close icon, share subtle gradient/inset-shadow button embossing, bevel the modal frame with a highlighted top and dark bottom edge, and add restrained header/section-label text shadows. No layout or content changes. Focused Edge checks compared dialog/control geometry against the checkpoint at all four viewport sizes above and found identical bounds. Hover gradients, visible keyboard focus, pointer/Enter close, Escape, backdrop dismissal, and content-click retention passed for File, Export, and About; screenshots were inspected and no page errors occurred. Build, targeted AppModal lint, and whitespace checks passed. User visual approval was subsequently confirmed on 2026-10-29.

Latest T13 visual refinement supersedes the gradient/frame treatment above: remove the full outer border and side/drop shadows, preserving geometry with equivalent padding; use only a 1px top highlight and 2px dark bottom edge. Solid panel/header/button fills eliminate gradient banding or texture. Shared buttons use a shallow 1px inset highlight and 2px inset shadow, while the inline-SVG close control retains a flush recessed rim. Horizontal section seams retain restrained top-down beveling and label text shadows remain unchanged. Only shared SCSS and this review record changed in this pass; earlier uncommitted SVG work is retained. Focused Edge checks again passed for File, Export, and About at all four viewport sizes with identical measured geometry, hover/focus and close/Escape/backdrop behavior, screenshot inspection, and no page errors. Build and whitespace checks passed. T13 is COMPLETE following user visual approval on 2026-10-29. Finalization checks passed: build and whitespace checks, plus lint with only the two existing Hook warnings. Extensive browser checks were not repeated. Architecture and related documentation were reviewed; no structural or behavioral changes required updates. T04 Stage Navigation remains NEXT and has not been started.

### T14 — Timeline Scrollbar & Selection Colors

T14 is COMPLETE on `codex/0.3.0-t14-timeline-colors`. The timeline uses native `scrollbar-color` with `--color-border-button-hover` for the thumb and `--color-surface-timeline-ruler` for the track, retaining `scrollbar-width: thin`. The stage selection rectangle uses `--color-playhead` for its stroke.

Existing keyframe colors, grayscale treatment, selected-state glow, playhead styling, timeline geometry, scrolling, pointer interactions, and animation logic are unchanged. T04 remains NEXT. Release, package, schema, and dependency versions are unchanged. Build, compiled-style checks, React selection-rendering checks, and whitespace checks passed. User visual acceptance and authorization to commit and merge into local `master` with `--no-ff` were confirmed on 2026-10-29. Previously passed tests were not repeated during finalization.

### T15 — Public Demo Preparation

T15 is COMPLETE on `codex/0.3.0-t15-demo-deployment`. Replaced the default Vite page title and favicon with GSAPANIMATE branding, added a concise page description, and documented the unreleased 0.3.0 preview, basic usage, and known limitations in README.

Application behavior, dependencies, package version 0.2.1, and project/model schemas 1 remain unchanged. The GitHub repository stays private. This task prepares the demo only; it does not deploy, publish, or formally release 0.3.0. T04 Stage Navigation remains NEXT. Finalization and integration into local `master` with `--no-ff` were authorized on 2026-11-06.

## Deferred / backlog — outside v0.3.0

These items preserve earlier planning and exploration; no final interaction or implementation is implied, and no release is assigned.

- **Inspector transform authoring / auto-key UX:** Nudging currently authors position at the playhead, while direct X/Y editing requires a selected keyframe. Investigate showing current transforms without keyframe selection and allowing fields to author/update keyframes consistently with stage manipulation. Consider explicit auto-key or an equivalent model with clear feedback when edits create animation data. This is UX discovery, not a confirmed bug, and is separate from T01 readability.
- **Add Track / Add Keyframe controls:** Gather more editor usage before redesigning difficult-to-distinguish controls. Explore clearer labels/tooltips/icons, contextual property-row controls, a unified "Add property" interaction, and scaling to more properties. Explore shape-row click/context-click menus at the interaction location, automatic track creation/selection where appropriate, and discoverable Path authoring without requiring knowledge of tracks.
- **Large SVG / many-shape workflow:** Explore dozens to 100+ elements through scalable shape-list scrolling/navigation, search/filtering, group hierarchy/collapsing, and hiding/locking. Keep stage navigation usable independently of long timeline/layer lists. Stage pan/zoom and focus-selection move into T04; automatic document fitting is part of T03; explicit navigation commands belong to T04.
- **Further shell and timeline ergonomics:** Continue refining the Figma-driven shell while preserving behavior; explore timeline zoom, snapping customization, keyboard shortcuts, and richer easing/curve controls. Timeline zoom is separate from T04 stage zoom.
- **Vector authoring:** Bézier control handles, anchor insertion/removal, drawing paths, point-type changes, primitive conversion, joining/splitting, boolean operations, shapeIndex controls, and broader editing tools remain deferred beyond the accepted path-anchor foundation.
- **Additional animated SVG properties:** Evaluate only with deliberate extensions to model and export contracts.
- **Other legacy ideas:** Multi-keyframe selection, undo/redo, and presets/templates remain unassigned ideas from [DOCS/phase03.md](DOCS/phase03.md), which is a historical specification rather than the active release plan.

Current behavior and acceptance history remain in [README.md](README.md) and [CHANGELOG.md](CHANGELOG.md). Implementation boundaries and technical debt remain in [ARCHITECTURE.md](ARCHITECTURE.md).
