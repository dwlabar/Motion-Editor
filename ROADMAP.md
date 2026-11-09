# Motion Editor Roadmap

## 0.1.0 — migration from the GSAP editor baseline

Application version 0.1.0 and project/model schema version 1 are independent. The serializable model remains authoritative. GSAP stays operational until explicitly replaced by later tasks. The sibling Motion Engine and GSAP Animation Editor repositories are read-only.

| ID | Task | Status | Scope |
| --- | --- | --- | --- |
| T01 | Project Foundation | DONE | Application identity, local Motion Engine dependency, independent storage, documentation, and roadmap. |
| T02 | Timeline and Playback Integration | DONE | Replace GSAP timeline construction, playback, scrubbing, looping, and SVG rendering with Motion Engine. Preserve existing transport controls and UI behavior. |
| T03 | Stage Authoring Integration | NEXT | Replace GSAP-dependent position dragging, nudging, property reading, inspector updates, and keyframe capture. Preserve existing editing workflows. |
| T04 | SVG Path Integration | PLANNED | Replace MorphSVG dependencies with Motion Engine path geometry APIs. Preserve path handles, anchor editing, and compatible path animation. |
| T05 | Animation Export Integration | PLANNED | Replace GSAP-based animation and React exports with Motion Engine-based outputs. Preserve existing export workflows. |
| T06 | Dependency Cleanup and Release | PLANNED | Remove remaining GSAP dependencies, update documentation, and perform focused acceptance testing of existing editor functionality. |

This approved roadmap replaces the inherited GSAP development plan. T02–T06 are not implemented as part of T01.

## T01 completion

- Preserve existing UI, icon artwork, animation behavior, comments, and schema v1.
- Keep GSAP preview, path interpolation, and exports intact; Motion Engine is installed but not wired into runtime behavior.
- Use only `motion-editor:last-session:v1` for autosave; do not migrate or alter GSAP Editor storage.
- T01 approved by the user on 2026-11-08.

## T02 completion — 2026-11-08

- Preview uses `createTimeline()`, `createPlaybackController()`, and `createSVGAdapter()` directly. Transport, model timing, supported easing, transforms, opacity, and compatible path playback use Motion Engine.
- Rebuilds pause retired controllers, suppress their final callbacks, reset adapters, and restore the playhead and active playback. Restart retains the existing paused return-to-zero behavior.
- Unsupported models/paths stop preview and report the engine error; there is no GSAP fallback or schema conversion.
- Build passes; lint has zero errors and the same two existing Hook warnings. Focused headless Edge checks pass for transport, duration changes, model edits, baseline restoration, SVG replacement, and unsupported-path recovery.
- T03 must address GSAP property/cache reads and stage preview writes. Browser checks reproduced incorrect position capture and nudging after engine scrubbing. Target baseline transforms also compose differently from GSAP, so unchanged exports can differ from preview.
- T04 retains responsibility for MorphSVG authoring geometry; engine playback requires matching normalized subpath/segment counts and closure. T05 retains responsibility for exports. No dependencies, application version, or schema versions changed.
- See [T02 verification and integration limits](DOCS/T02-VERIFICATION.md). T02 finalization approved by the user on 2026-11-08. Documented integration limits remain deferred to T03–T05.
