# GSAP SVG Animation Editor

## Purpose

This repository contains a browser-based, timeline-oriented SVG animation editor. Users import an SVG, select its shapes, author tracks and keyframes, preview the result with GSAP, persist a project, and generate GSAP or React code.

## Repository map

- `src/App.jsx` owns application state, editor orchestration, timeline rebuilding, and persistence coordination.
- `src/components/` contains the editor UI components.
- `src/utility/` contains SVG parsing, GSAP timeline construction, and code exporters.
- `src/styles/` contains global and component SCSS.
- `public/` contains static assets, including a sample SVG.
- `DOCS/` contains the legacy Phase 3 specification and design reference SVG.

## Commands

Use npm and the committed `package-lock.json`. In PowerShell environments that block `npm.ps1`, use `npm.cmd`.

```sh
npm.cmd ci
npm.cmd run dev
npm.cmd run build
npm.cmd run lint
npm.cmd run preview
```

There is currently no test script. Do not invent one. Install only when `node_modules` is absent or intentionally needs restoration; do not upgrade or add dependencies without explicit approval.

## Implementation conventions

- Use 2-space indentation in JavaScript, JSX, JSON, CSS, SCSS, and Markdown.
- Preserve existing code, comments, and file-level version histories.
- Keep components modular and reusable; share genuinely repeated behavior through DRY utilities.
- Prefer clear code over speculative abstractions.
- Use semantic HTML and accessible controls.
- Follow the existing BEM-style SCSS convention where it is already used.
- Do not introduce Tailwind. GSAP 3.13+ and all its plugins, including MorphSVGPlugin, are freely available in the standard `gsap` npm package. Use the existing package; dependency additions or upgrades still require explicit approval.
- Use CSS Grid and Flexbox for application layout. Do not reproduce Figma canvas coordinates with unnecessary absolute positioning.
- Absolute positioning is appropriate for editor overlays such as playheads, keyframes, selection boxes, handles, and canvas controls.

## Architecture boundaries

- The serializable animation model is the source of truth.
- GSAP timelines are derived playback state and must be rebuilt from the model.
- Imported SVG content and editor UI are separate concerns.
- Preserve editor behavior during visual redesign; do not silently rewrite the animation model, parsing, selection, timeline, persistence, or export contracts.

## Completion expectations

Run the relevant checks after source changes. Explain exactly what changed and what was verified. Do not commit or push unless explicitly instructed.

## Release workflow

### Versioning

- Use pre-1.0 Semantic Versioning: bump MINOR for meaningful new capabilities or substantial feature milestones; bump PATCH for bug fixes and small refinements.
- Decide the intended release version before substantial implementation begins.
- Update `package.json`, the top-level and root-package versions in `package-lock.json`, `CHANGELOG.md`, and version documentation as part of the milestone. Keep dependency versions unchanged unless explicitly authorized.
- Application release versions and project JSON/schema versions are independent. Do not bump the schema version merely for an application release.

### Branching

- Start meaningful work from current clean local `master` on a dedicated branch. Inspect the actual branch, status, history, and relationship to `origin/master` first; stop on unexpected or unrelated changes.
- Use `feature/<version>_<description>`, `bug/<version>_<description>`, or `task/<version>_<description>`, with hyphenated descriptions. Examples: `feature/0.2.0_svg-vertex-path-foundation`, `bug/0.1.1_timeline-drag-release`, and `task/0.1.0_versioning-baseline`.
- Do not perform substantial feature, bug, refactor, or infrastructure work directly on `master`. Small emergency/trivial exceptions require explicit user approval.

### Review and integration

1. Inspect current clean `master`, choose the version, and create the dedicated branch.
2. Implement the scoped work and run relevant checks. Leave substantial implementation uncommitted when the user needs to review the diffs in VS Code.
3. Perform manual acceptance when applicable; distinguish user-reported acceptance from automated checks and unverified cases.
4. With explicit authorization to commit, review the complete diff, stage only intended files, and run `git diff --cached --check` before committing accepted work.
5. With explicit authorization to integrate, verify branch relationships and fast-forward the accepted branch into local `master` using `git merge --ff-only` when possible. If fast-forwarding is not possible, stop and report the divergence before choosing another strategy.
6. Preserve feature/task commit history. Do not squash unless explicitly requested.
7. Do not push, tag, or delete branches unless explicitly requested. Finish integrations on clean local `master` and report the commit and final Git state.
