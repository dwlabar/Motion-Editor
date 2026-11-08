# Phase 3: Data Model & Export System

## Purpose

Phase 3 formalizes the animation editor as a **true authoring tool**.

Up through Phase 2, the system proves that timeline-based SVG animation authoring is possible, editable, and stable. Phase 3 makes those animations **persistent, reusable, and portable**.

At the end of Phase 3, animations created in the editor must be able to:

* Exist independently of the editor
* Be exported as clean GSAP code
* Be re-imported to fully restore authoring state

Phase 3 is intentionally data- and architecture-focused. UI and UX polish are explicitly out of scope.

---

## Animation Model Contract

The animation model is the single source of truth.

It must:

* Contain no editor-only state
* Contain no GSAP runtime state
* Be serializable to JSON
* Be deterministic and versioned

### Root Structure

```js
{
  version: 1,
  id: String,
  label: String,
  duration: Number, // seconds
  tracks: Track[]
}
```

### Track Structure

Each track represents a single animated property on a single SVG target.

```js
{
  targetId: String,     // SVG element id
  property: String,     // position | opacity | scale | rotation | etc
  keyframes: Keyframe[]
}
```

Rules:

* One track per targetId + property pair
* Tracks may exist with zero keyframes
* Track ordering is not semantically meaningful

### Keyframe Structure

```js
{
  time: Number,         // seconds
  value: Any,           // property-specific
  ease?: String         // optional GSAP ease string
}
```

Rules:

* Keyframe times are unique per track
* Keyframes are always sorted by time
* Easing is optional and purely declarative
* No derived or cached values are allowed

### Property Value Conventions

* position: `{ x: Number, y: Number }`
* opacity: `Number`
* scale: `Number`
* rotation: `Number` (degrees)

Additional properties may be added in later phases but must follow the same rules.

---

## Export System

Phase 3 introduces **two export targets**. Both exports consume the animation model and must not depend on any editor-specific code.

### Export Target A: Raw GSAP Timeline Code

#### Description

Exports a plain JavaScript file containing GSAP timeline code.

The output must:

* Be readable and hand-editable
* Use standard GSAP 3 APIs
* Contain no references to the editor
* Be deterministic for the same input model

#### Output Characteristics

* Uses `gsap.timeline()`
* Uses explicit `.to()` calls
* Uses absolute timeline positioning
* Uses easing only if defined in the model

The exporter is a **code generator**, not a runtime builder.

---

### Export Target B: Reusable React Component

#### Description

Exports a complete React component that recreates the animation using GSAP.

The output must:

* Be copy-paste usable in a clean React project
* Use `useRef` and `useEffect`
* Contain no editor dependencies
* Be self-contained

#### Component Expectations

* SVG is assumed to already exist in the DOM or be passed as children
* Timeline creation occurs on mount
* Optional props may include:

  * `paused`
  * `onComplete`

The generated component represents a **production-ready animation artifact**.

---

## Import / Restore System

Phase 3 supports restoring animations back into the editor.

### Import Rules

* Imported data must match the current animation model version
* No migration or backward compatibility is required
* Invalid or mismatched versions may be rejected

### Restore Expectations

On successful import, the editor must:

* Replace the current animation model
* Rebuild the GSAP timeline
* Restore full timeline, keyframe, and inspector state

---

## Explicit Non-Goals

The following are intentionally **out of scope** for Phase 3:

* Vertex or path morphing
* Timeline zooming or scaling
* Multi-keyframe selection
* Undo / redo system
* Easing curve UI
* Presets or templates
* Timeline snapping customization
* UX or visual polish

These concerns are reserved for later phases.

---

## Phase 3 Completion Criteria

Phase 3 is considered complete when:

* The animation model is stable, versioned, and documented
* Animations can be exported as raw GSAP code
* Animations can be exported as reusable React components
* Animations can be re-imported to restore editor state

At this point, the editor transitions from a prototype into a true animation authoring system.
