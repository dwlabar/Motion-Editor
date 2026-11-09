# T02 timeline and playback integration

Status: DONE, 2026-11-08. Application version 0.1.0; project/model schema 1.
The user approved finalization on 2026-11-08. T03 is NEXT. No additional testing was performed during finalization; the automated evidence and unverified cases below remain unchanged.

## Implementation

`src/App.jsx` calls the public Motion Engine APIs directly. `createTimeline(model)`
validates and snapshots the model, `createSVGAdapter(targets)` captures mounted SVG
baselines, and `createPlaybackController()` evaluates and renders each update.
The existing normalized playhead maps to model seconds through `seek()`.
Controller state drives Play/Pause and completion; Loop uses `setLoop()`.
Restart keeps the existing paused return to zero; Play at the end starts again.

Model or SVG changes clean up the previous layout effect before creating a new
adapter. Cleanup suppresses callbacks, pauses the controller, restores the adapter,
and clears its reference. The new controller seeks the retained playhead and resumes
if playback was active and the playhead is before the end. Duration changes preserve
absolute seconds and clamp to a shorter end. Adapter snapshots restore properties
absent before a first keyframe and avoid composing onto previous rendered frames.

Invalid models, missing animated targets, incompatible paths, and non-path targets
for path tracks stop the whole preview and show an error. Pressing Play repeats the
error if preview remains unavailable. Source data stays editable and exportable.
No property filtering, topology conversion, compatibility layer, or GSAP fallback
was added. A valid subsequent model/project rebuild restores preview.

GSAP imports needed for property capture, stage authoring, MorphSVG editing, and
exports remain. The unused legacy builder is retained for later dependency cleanup.
Persistence, selection, authoring controls, styles, exports, package metadata, and
the lockfile were not changed.

## Automated checks

- `npm.cmd run build`: passed.
- `npm.cmd run lint`: zero errors; the same two existing Hook dependency warnings
  in App's autosave availability and ExportPanel's export effect.
- Headless Microsoft Edge 157.0.4341.42, desktop viewport 1440 × 1000, using the
  local Vite app in React Strict Mode. Temporary Node/CDP tooling used installed
  software only, with a fresh browser profile and no dependency changes or npm
  test script. Project fixtures entered through the existing File input; ruler
  gestures, keyframe selection/deletion, and nudging used browser input events.
  Buttons and input changes also exercised the existing React event handlers.
- No uncaught application exceptions in the completed browser runs.

| Area | Verified result |
| --- | --- |
| Load and timing | Project loads paused at zero; empty tracks still use model duration. |
| Play/Pause | Time advances, pauses without later drift, resumes, stops at the end, and replays from the end. |
| Restart | Returns to zero and stays paused. |
| Loop | Wraps through zero while playing; disabling Loop restores endpoint stopping. |
| Scrubbing | Ruler seeks exact snapped times and renders engine transform/opacity/path values. |
| Easing | Linear and power2.inOut mixed-track output matches direct engine evaluation; default power1.out opacity interpolation verified independently. |
| Baselines | Backward scrub before the first keyframe restores inline styles, target/parent transforms, opacity, and original path data. |
| Duration | Longer duration retains absolute time; shorter duration clamps; duration before the final keyframe is rejected. Active playback resumes after a valid duration rebuild. |
| Repeated rebuilds | Multiple duration edits leave the same transform matrix and path at the same time, without accumulated transforms. |
| Model edits | Inspector scalar edits rebuild at the current playhead. Deleting to single/empty tracks holds or restores baseline values as appropriate. |
| Paths | Compatible paths interpolate; capturing rendered path data and deleting all path keys restore the original baseline. |
| Errors | Incompatible closure stops preview and reports the reason; a valid replacement project recovers. |
| SVG replacement | New SVG with reused IDs retains its new baseline; no old frame advances the playhead or changes the replacement after loading. |

For manual reproduction, load an SVG with a translated parent and a target with
`transform="translate(8 6)"` and inline opacity. Add/load tracks with first keys at
0.5s and last keys at 1.5s in a 2s model. Scrub to 1s, before 0.5s, and past 1.5s;
exercise transport; change duration repeatedly; edit and delete keys; then replace
the SVG while playing. A closed-to-open path transition should show an incompatible
path error and leave the imported baseline visible. Load compatible data to recover.

## Unresolved integration limits

### T03: GSAP authoring reads and writes

Engine preview writes inline CSS transforms; existing authoring reads GSAP's SVG
transform channels/cache and previews dragging with `gsap.set()`. These are different
state representations. No synchronization layer was introduced.

Concrete browser reproduction with a target baseline `translate(8 6)`, a parent
translation `(10, 5)`, and a linear position track `(0, 0)` at 0s to `(100, 0)` at 2s:

- At 1s, engine position is `(50, 0)` and the target CTM translation is `(68, 11)`.
- Add Position Keyframe captures `(8, 6)` through unchanged GSAP property reading,
  then the rebuilt CTM translation becomes `(26, 17)`. Capturing after a later
  scrub again returns cached `(8, 6)`.
- In a fresh SVG instance at 1s, ArrowRight authors `(9, 6)` instead of `(51, 0)`.

T03 must replace transform property reads, keyframe capture, and stage preview
writes together. Scale/rotation capture and dragging use the same GSAP machinery;
they are not established as compatible by these playback checks. Existing numeric
Inspector edits remain model-driven and were verified separately.

### Baseline transforms and T05 exports

Motion Engine composes motion with the captured target baseline. GSAP replaces
decomposed channels: position zero can remove an original GSAP translation, while
engine position zero retains the imported translation. The preview now follows
the public engine contract. Existing transformed-target models can therefore look
different from their previous GSAP preview and from unchanged GSAP/React exports.
No model conversion or export migration was performed.

### T04: path topology and editing

Engine interpolation requires the same normalized subpath count, cubic segment
count per subpath, and open/closed flags. It does not equalize, reorder, reverse,
or automatically match shapes as MorphSVG can. Supported paths play directly;
unsupported paths stop preview with the engine's reason. Existing MorphSVG anchor
editing remains for T04, including its different handling of coincident open
endpoints and raw coordinate indices. Arc conversion may affect segment counts.

Touch/pen, other browser engines, long-running timing/memory behavior, exported
consumer applications, and full stage-authoring acceptance were not tested here.
