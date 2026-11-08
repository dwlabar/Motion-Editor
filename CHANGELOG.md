# Changelog

Application releases use pre-1.0 Semantic Versioning. Project-file schema versions are independent.

## Motion Editor 0.1.0 — unreleased

- T01 foundation: rename the application and package to Motion Editor, retain existing UI and icon artwork, and add the local Motion Engine dependency.
- Isolate autosave under `motion-editor:last-session:v1` without migrating GSAP Editor storage.
- Document migration boundaries; GSAP preview, path behavior, exports, and project schema version 1 remain unchanged.
- T01 approved by the user on 2026-11-08.

## Inherited GSAP Animation Editor release history

The entries below describe the original project, not Motion Editor releases or acceptance.

## 0.2.1 — 2026-09-15

Figma UI fidelity pass. Manually accepted by the user on 2026-09-22, including all current TopBar, Inspector, Timeline, and other v0.2.1 changes and the user's manual SCSS refinements.

- Restore Desktop `1:49` from the [canonical Figma design](https://www.figma.com/design/YKXYCBUHObeNkn4CRML2UG/Untitled?node-id=1-103&m=dev) as the visual reference, retaining accepted v0.2.0 functionality.
- Restore the 60px topbar, navigation and wordmark, stage grid/gradients/divider, 320px inspector, section headers, inset fields, and dense 43px/36px shape/property rows.
- Use local Open Sans, Inter, Syncopate, and actual exported Figma icons/pattern/shadow/divider assets. Include font licenses; add no dependencies or runtime font services.
- Restore ruler labels and major/minor hashes, outlined keyframes, gradient Add Track controls, diamond keyframe buttons, and selected states. About opens in the existing modal shell.
- Use one shared time domain with equal gutters of at least 32px, expanding with the duration label. Keep every label centered on its tick and endpoint markers fully visible. Continue the ruler playhead through all rows using the same position. Remove the lane clipping workaround; preserve seeking, dragging, snapping, and stored keyframe times.
- Fit the saved duration to flexible timeline width, with readable tick intervals guided by Figma's ruler density. Scroll rows under a sticky ruler; adapt narrower control columns and stack the inspector on small screens.
- Keep project/model schema 1, all existing authoring/persistence/export behavior, and deferred large-SVG/track-authoring UX work separate.

Validation: production build passes; lint has zero errors and the same two existing Hook warnings in App and ExportPanel; `git diff --check` passes. Agent browser checks cover reference geometry, both endpoints, alignment, seeking/snapping, all five track properties, Position keyboard nudging, Path interpolation, Inspector edits, menus, K/Delete, autosave, downloaded JSON round trip, both exports, and five viewport sizes (390–1920px). User manual acceptance is recorded separately above; touch/pen, dedicated assistive technology, and external export consumers remain separately unverified.

## 0.2.0 — 2026-09-14

SVG vertex/path animation foundation. Manually tested and accepted by the user on 2026-09-15.

- Add Path tracks only to identified SVG `<path>` targets; reuse existing track/keyframe controls and duplicate prevention.
- Capture rendered `d` geometry at the playhead, including MorphSVG interpolation states, using the existing 30fps snapping and duration clamp.
- Move existing stage anchors with transient pointer previews and model commits on release. Preserve adjacent cubic controls, closed seams, multiple subpaths, and transformed/nested SVG coordinates.
- Cancel previews on Escape, pointer cancellation/lost capture, blur, scrub, replacement, selection changes, modal opening, or unmount. Click-only gestures create no data.
- Play Path tracks through the installed GSAP 3.13 MorphSVGPlugin, preserving imported baselines, first/single-keyframe establishment, easing, final holds, duration padding, and rebuild restoration.
- Show Path guidance in the Inspector without a numeric geometry field.
- Persist `d` strings through the existing autosave and project JSON flows; project schema remains version 1.
- Export MorphSVG operations with conditional plugin import/registration and escaped path data in both GSAP and React outputs.
- Clarify that GSAP and all plugins are freely available through the existing npm package. No dependency changes.
- Defer Bézier handle editing, adding/removing anchors, drawing paths, primitive conversion, and broader vector-authoring tools.

Validation: production build passes; lint has zero errors and the same two pre-existing Hook warnings. Temporary automated Chrome checks cover geometry, playback, authoring, persistence, and export. User manual acceptance was reported on 2026-09-15; touch/pen and external consumer checks have not been separately verified.

## 0.1.0 — 2026-09-07

First formal release milestone, covering the accepted editor foundation:

- SVG import with selectable identified elements and preserved nested transforms.
- Timeline-based position, opacity, rotation, and scale animation, with keyframe creation, editing, dragging, and playhead scrubbing.
- Local autosave and project JSON save/load using schema version 1.
- GSAP timeline export and a React/GSAP component scaffold; consumers supply the SVG markup.
- Figma-driven stage, Timeline, and Inspector shell work completed so far, including timeline overflow fixes and centralized color variables/tokens.
- Model-driven stage position authoring that creates or updates keyframes and survives rebuilding, scrubbing, persistence, and export.
- Arrow-key object nudging with a configurable positive decimal Nudge amount and a 10× Shift multiplier; Nudge is editor configuration, not animation data.
- Reliable playhead/keyframe dragging with Pointer Events, pointer capture, and scoped native-selection suppression.

SVG vertex/path animation is planned for v0.2.0 and is not implemented in this release. Manual acceptance scope and remaining verification caveats are recorded in [README.md](README.md).
