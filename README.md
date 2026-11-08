# Motion Editor

**0.1.0 — unreleased, T01 foundation complete.** A browser-based SVG animation editor derived from GSAP Animation Editor, being migrated to the standalone Motion Engine library.

## Migration status and boundaries

T01 establishes package identity, the local engine dependency, branding, and independent autosave. Motion Engine is available but is not yet connected to preview or export. GSAP remains operational for playback, path interpolation, and GSAP/React code generation. Existing UI, icon artwork, behavior, and project JSON/model schema version **1** are preserved.

- This repository owns React UI, SVG import, selection, tracks/keyframes, persistence, and integration.
- `../motion-engine` provides the standalone library through `file:../motion-engine` and is read-only during editor tasks.
- `../gsap-animation-editor` is the original application and a read-only reference. Do not modify its files or browser storage.
- The serializable animation model is the source of truth; playback state is derived and is not persisted.
- Later tasks replace GSAP in explicit stages. T01 adds no runtime adapter, compatibility layer, or schema migration.

## Setup and development

Keep Motion Engine checked out beside Motion Editor. Its package exports `src/index.js`; the local dependency requires the sibling directory to remain available. Use Node.js and npm with the committed lockfile:

```sh
npm.cmd ci
npm.cmd run dev
npm.cmd run build
npm.cmd run preview
```

`npm.cmd run lint` is also available. There is no test script. Dependency additions or upgrades require approval. The stack remains React, Vite, Sass, svgson, DOMPurify, and GSAP, with Motion Engine added locally.

## Basic usage

1. Open **File** to import SVG artwork or load project JSON. Sample artwork is in `public/`.
2. Select an object on the stage or timeline. Add Position, Opacity, Rotation, Scale, or eligible Path tracks.
3. Move the playhead and add keyframes with the diamond button or **K**. Edit selected keyframes in Properties; drag objects or existing path anchors on the stage.
4. Set duration, scrub, and use Play/Pause, Restart, and Loop to preview with GSAP.
5. Use **File → Download Project** for portable backups and **Load Project** to reopen them. Autosave and Save Now use browser local storage.
6. Open **Export** to copy GSAP code or a React component scaffold. React output requires you to supply the SVG markup.

## Persistence

Project JSON schema version **1** stores `svgSource` and `animationModel`; downloads also contain lightweight metadata. Application version 0.1.0 is independent of the schema.

Autosave, restoration, Save Now, and Clear Autosave use only `motion-editor:last-session:v1`. Motion Editor does not read, migrate, clear, or overwrite GSAP Editor autosave. Storage is local to the browser and origin; download project JSON for a portable copy.

## Architecture

- `src/App.jsx`: application state, orchestration, derived timeline lifecycle, and persistence.
- `src/components/`: editor panels and controls.
- `src/hooks/`: stage authoring interactions.
- `src/utility/`: SVG parsing, model utilities, GSAP builder, and exporters.
- `src/styles/`: global and component SCSS.
- `public/`: static assets, local fonts, and sample artwork.
- `DOCS/`: inherited historical specification and design references, not the active migration plan.

Imported SVG content stays separate from editor overlays and controls. Preserve model, parsing, selection, timeline, persistence, and export contracts during migration. See [ARCHITECTURE.md](ARCHITECTURE.md), [AGENTS.md](AGENTS.md), and [ROADMAP.md](ROADMAP.md) for implementation boundaries and migration planning.

## Current limitations

- Stage zoom/pan, timeline zoom, and undo/redo are unavailable.
- SVG import sanitizes content. External/embedded images and fonts, stylesheets, SMIL, `foreignObject`, DTD/entity declarations, CSS variables/escapes, and inline `!important` priority are unsupported. Text and `use` can render but have no timeline-authoring controls.
- Path editing moves existing anchors only; drawing paths, adding/removing anchors, and editing Bézier handles are unsupported.
- Clear Autosave can remain disabled after Save Now until reload.
- React export is a scaffold with an empty SVG placeholder.
- Touch/pen, cross-browser, dedicated screen-reader, and external React export acceptance are not established by T01. Modal focus trapping and trigger-focus restoration are not implemented.

The inherited history in [CHANGELOG.md](CHANGELOG.md) describes the original GSAP editor, not Motion Editor releases or acceptance.
