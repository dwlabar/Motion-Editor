# T03 stage authoring integration

Status: DONE, 2026-11-09. Application version 0.1.0; project/model schema 1.

## Implementation

App's playback effect exposes authoring operations over its current Motion Engine
timeline and SVG adapter. Captures evaluate at the controller's actual time.
Position, rotation, and scale fall back to neutral motion values (0/0, 0, and 1),
never decomposed SVG transforms. Opacity falls back to the computed imported
opacity captured before playback applies any animation.

The adapter includes identified selectable SVG elements before their first track
exists. Drag previews replace only the evaluated position entry and apply the
complete snapshot through the same adapter. Parent screen-CTM inversion remains
responsible for converting pointer displacement to motion coordinates. Finishing
or cancelling restores the current evaluated frame, including a new scrub time
if seeking occurred before cancellation. Retired authoring operations cannot
render after playback disposal.

Nudges retain the existing functional model update, including accumulation when
React batches keyboard events. Inspector edits remain model-driven. Model rebuilds
reset the adapter before capturing baselines again. Path authoring, exports,
dependencies, styles, UI, and sibling repositories are unchanged.

## Verification

- Production build passes. Lint has zero errors and the two existing Hook warnings
  in App and ExportPanel.
- Focused automated headless Microsoft Edge checks exercised the production build
  at a 1440 × 1000 viewport with an isolated browser profile. Temporary Node/CDP
  tooling used installed software, with no new dependencies or test script.
- Project fixtures loaded through the File input. Pointer drags, ruler scrubs, and
  keyboard nudges used browser input events. Capture buttons used DOM clicks;
  Inspector changes and the scrub-during-drag check invoked existing React handlers.
- Fixture: translated/rotated/non-uniformly scaled parent, target translation and
  rotation, inline baseline opacity, all four animated properties, and an untracked
  second target. Captures at 1s in a 2s model matched the normalized model's default
  power1.out values: position (75, 15), rotation 45, scale 1.75, opacity 0.65.

| Workflow | Result |
| --- | --- |
| Mid-timeline capture | All four captured values match evaluation; the target CTM is unchanged after capture/rebuild. |
| Repeated nudges | Three browser ArrowRight events and four synchronously batched events accumulate seven units. |
| CTM-correct drag | Screen displacement converts through the parent inverse; committed values match expected displacement and the committed CTM matches the preview. |
| Cancellation | Escape, pointercancel, lostpointercapture, and blur restore the previous CTM without changing the model. |
| Scrub during drag | Cancellation preserves the newly sought frame and leaves the model unchanged. |
| Inspector | Position edit persists through rebuild and backward/forward scrubbing. |
| Before-first-key capture | Neutral transform channels and imported opacity 0.6 are captured, retaining SVG baseline transforms. |
| First untracked nudge | Creates position (1, 0), retaining the target's imported translation and linear CTM components. |
| After playback | Pause then nudge uses the evaluated position and commits on the 30fps timebase. |

User approved finalization on 2026-11-09. Touch/pen, other browsers, and dedicated selection-change/modal/
unmount cancellation checks remain unverified. T04's MorphSVG geometry and T05's
GSAP/React export differences remain deferred as documented in T02. No additional browser checks were run during finalization.

Review follow-up: initial adapter targets use selectable IDs from shapeList; animated
targets and missing-target validation remain intact. DOM-fixture checks passed for
definitions exclusion, first position preview/nudging, cancellation, and baseline
composition. Build and lint passed with the same warnings; browser gestures were
not rerun after this refinement.
