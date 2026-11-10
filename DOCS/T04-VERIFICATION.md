# T04 SVG path integration

Status: REVIEW, 2026-11-09. Application version 0.1.0; project/model schema 1.

## Implementation

- Path geometry uses Motion Engine parsePath(), pathAnchors(), movePathAnchor(),
  and serializePath(). Handles use sequential anchor indices, including their labels.
- Dragging retains the existing screen-CTM inverse, pointer capture, threshold,
  live preview, adjacent control movement, and closed-seam behavior. All subpaths
  survive an edit. Parsing and displaying handles never rewrite imported d data.
- Cancellation restores the original preview value and then the current evaluated
  frame through the existing authoring adapter. Scrubbing during a drag therefore
  preserves the newly sought frame instead of overwriting it with the old path.
- Invalid/unsupported imported path syntax produces no editable handles. Invalid
  movements are ignored. Playback still rejects incompatible normalized topology;
  no equalization, fallback, or new geometry support was added.
- GSAP exports, dependencies, UI/styles, and both sibling repositories are unchanged.

## Verification

- Production build passes. Lint: zero errors, the two existing Hook warnings in
  App and ExportPanel. Git whitespace checks pass.
- A temporary headless Edge fixture bundles the actual PathHandles,
  useStagePathAuthoring, path geometry utility, and authorPath with React and the
  installed Motion Engine. No dependencies or repository test script were added.
- Browser mouse input exercises real pointer capture and dragging under a rotated,
  translated, non-uniformly scaled parent. SVG coordinate comparisons use 0.0001
  tolerance. Cancellation events other than Escape are dispatched by the fixture.

| Check | Result |
| --- | --- |
| Initial geometry | Original relative-command d string stays exact; sequential labels and CTM handle placement pass for open/closed subpaths. |
| Click threshold | Sub-threshold movement leaves geometry and model unchanged. |
| Interior drag | Live preview and commit move the anchor and adjacent controls while preserving the other subpath. |
| Closed seam | The joined start/end remain coincident and the other subpath remains unchanged after commit. |
| Cancellation | Escape, pointercancel, lost capture, and blur restore geometry without model changes. |
| Drag after scrub | Uses evaluated path geometry and animated target CTM; commits on the 30fps timebase. |
| Capture | Current rendered path is retained by authorPath at the capture time. |
| Scrub during drag | Cancels without model mutation and retains the newly evaluated path. |
| Compatible paths | Edited multi-subpath models evaluate and render correctly at endpoints and intermediate times. |
| Unsupported input | Malformed geometry returns no handles; incompatible topology remains rejected. No browser exceptions during checks. |

## Limits

The focused browser fixture verifies component/hook integration and timeline/adapter
rendering; it does not replace full-application manual acceptance of import, capture
buttons, transport playback, or exports. Touch/pen, other browsers, and dedicated
selection/modal/unmount cancellation checks were not run. Motion Engine intentionally
keeps coincident endpoints of an open path independent; only closed subpaths share a
seam. Edited curves serialize as normalized cubics, with the engine's existing arc
approximation. Untouched imported geometry retains its original string.
