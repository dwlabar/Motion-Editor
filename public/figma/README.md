# Figma assets

Source: [canonical design](https://www.figma.com/design/YKXYCBUHObeNkn4CRML2UG/Untitled?node-id=1-103&m=dev), Desktop `1:49`, inspected 2026-09-15.

- `button-keyframe.svg`: component `1:30`, used by property row `1:80`.
- `icon-keyframe.svg`: exported keyframe glyph from property rows.
- `icon-shape.svg`: exported shape glyph from shape row `1:79`.
- `shadow-top.png`: stage child `1:60`.
- `divider-bottom.png`: stage child `1:65`.
- `stage-background.svg`: the actual exported pattern from stage `1:59` (source vector `1:6`), cropped to its 42 × 42 repeat cell with its original 0.08 opacity. Its gradient fills are implemented in SCSS so the pattern keeps its scale when the stage resizes. The exported path data is unchanged; T10 translates the 7 × 7 glyph to the center of its repeat cell.

All assets are local. Figma's temporary MCP asset URLs are not runtime dependencies.
