# Motion Editor Roadmap

## 0.1.0 — migration from the GSAP editor baseline

Application version 0.1.0 and project/model schema version 1 are independent. The serializable model remains authoritative. GSAP stays operational until explicitly replaced by later tasks. The sibling Motion Engine and GSAP Animation Editor repositories are read-only.

| ID | Task | Status | Scope |
| --- | --- | --- | --- |
| T01 | Project Foundation | DONE | Application identity, local Motion Engine dependency, independent storage, documentation, and roadmap. |
| T02 | Timeline and Playback Integration | NEXT | Replace GSAP timeline construction, playback, scrubbing, looping, and SVG rendering with Motion Engine. Preserve existing transport controls and UI behavior. |
| T03 | Stage Authoring Integration | PLANNED | Replace GSAP-dependent position dragging, nudging, property reading, inspector updates, and keyframe capture. Preserve existing editing workflows. |
| T04 | SVG Path Integration | PLANNED | Replace MorphSVG dependencies with Motion Engine path geometry APIs. Preserve path handles, anchor editing, and compatible path animation. |
| T05 | Animation Export Integration | PLANNED | Replace GSAP-based animation and React exports with Motion Engine-based outputs. Preserve existing export workflows. |
| T06 | Dependency Cleanup and Release | PLANNED | Remove remaining GSAP dependencies, update documentation, and perform focused acceptance testing of existing editor functionality. |

This approved roadmap replaces the inherited GSAP development plan. T02–T06 are not implemented as part of T01.

## T01 completion

- Preserve existing UI, icon artwork, animation behavior, comments, and schema v1.
- Keep GSAP preview, path interpolation, and exports intact; Motion Engine is installed but not wired into runtime behavior.
- Use only `motion-editor:last-session:v1` for autosave; do not migrate or alter GSAP Editor storage.
- T01 approved by the user on 2026-11-08. T02 remains NEXT and has not begun.
