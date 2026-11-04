# Contrast: design system v3

Every pair below is computed from `tokens.json` with the WCAG formula. The pairs live in
[contrast-pairs.json](contrast-pairs.json), and `tests/unit/lib/design/contrast-v3.test.ts` fails if any pair
drops below its requirement.

Needed: 4.5:1 for normal text, 3:1 for UI components, focus indicators and meaningful graphics. All colours are
opaque, so nothing needs flattening. Text uses the 4.5:1 requirement even when it is large.

| Where | Foreground | Background | Ratio | Needed | Result |
|---|---|---|---|---|---|
| Body and heading text on the page | `light.text` #141414 | `light.canvas` #FFFFFF | 18.42:1 | 4.5:1 | Pass |
| Text on stages, bands, chips, demo prompt | `light.text` #141414 | `light.surface` #F4F4F4 | 16.75:1 | 4.5:1 | Pass |
| Text on cards; screen example labels | `light.text` #141414 | `light.card` #FFFFFF | 18.42:1 | 4.5:1 | Pass |
| Secondary pill or tab label, hover | `light.text` #141414 | `light.secondaryHover` #F4F4F4 | 16.75:1 | 4.5:1 | Pass |
| Secondary pill label, pressed | `light.text` #141414 | `light.secondaryActive` #E5E5E5 | 14.62:1 | 4.5:1 | Pass |
| Lead text, statement second tone, step waiting text | `light.textMuted` #666666 | `light.canvas` #FFFFFF | 5.74:1 | 4.5:1 | Pass |
| Notice bar, panel text, demo note | `light.textMuted` #666666 | `light.surface` #F4F4F4 | 5.22:1 | 4.5:1 | Pass |
| Text links on the page | `light.link` #2447E8 | `light.canvas` #FFFFFF | 6.68:1 | 4.5:1 | Pass |
| Text links in panels | `light.link` #2447E8 | `light.surface` #F4F4F4 | 6.08:1 | 4.5:1 | Pass |
| Link hover on the page | `light.linkHover` #1A34B0 | `light.canvas` #FFFFFF | 9.71:1 | 4.5:1 | Pass |
| Link hover in panels | `light.linkHover` #1A34B0 | `light.surface` #F4F4F4 | 8.83:1 | 4.5:1 | Pass |
| Primary pill, selected tab, skip link | `light.onAction` #FFFFFF | `light.action` #141414 | 18.42:1 | 4.5:1 | Pass |
| Primary pill hover | `light.onAction` #FFFFFF | `light.actionHover` #333333 | 12.63:1 | 4.5:1 | Pass |
| Primary pill pressed | `light.onAction` #FFFFFF | `light.actionActive` #000000 | 21.00:1 | 4.5:1 | Pass |
| Disabled pill label | `light.disabledText` #616161 | `light.disabledFill` #EDEDED | 5.29:1 | 4.5:1 | Pass |
| Placeholder tag | `light.placeholderText` #664700 | `light.placeholderFill` #FFF4D6 | 7.77:1 | 4.5:1 | Pass |
| Error text | `light.error` #C4261D | `light.canvas` #FFFFFF | 5.77:1 | 4.5:1 | Pass |
| Primary pill fill against the page | `light.action` #141414 | `light.canvas` #FFFFFF | 18.42:1 | 3:1 | Pass |
| Primary pill fill against a band | `light.action` #141414 | `light.surface` #F4F4F4 | 16.75:1 | 3:1 | Pass |
| Secondary pill, tab, story outline, waiting ring on the page and on cards | `light.controlBorder` #858585 | `light.canvas` #FFFFFF | 3.69:1 | 3:1 | Pass |
| Secondary pill outline on a stage or band | `light.controlBorder` #858585 | `light.surface` #F4F4F4 | 3.35:1 | 3:1 | Pass |
| Disabled pill outline against its fill | `light.controlBorder` #858585 | `light.disabledFill` #EDEDED | 3.15:1 | 3:1 | Pass |
| Focus ring on the page and on cards | `light.focus` #2447E8 | `light.canvas` #FFFFFF | 6.68:1 | 3:1 | Pass |
| Focus ring on a stage or band | `light.focus` #2447E8 | `light.surface` #F4F4F4 | 6.08:1 | 3:1 | Pass |
| Done tick on cards | `light.success` #0B7A4B | `light.canvas` #FFFFFF | 5.39:1 | 3:1 | Pass |
| Active step spinner, typing caret | `service.automation` #6D3FE8 | `light.canvas` #FFFFFF | 5.95:1 | 3:1 | Pass |
| Typing caret on the demo prompt | `service.automation` #6D3FE8 | `light.surface` #F4F4F4 | 5.41:1 | 3:1 | Pass |
| Glyph on the expert support tile | `service.onService` #FFFFFF | `service.expert` #C2410C | 5.18:1 | 3:1 | Pass |
| Glyph on the AI automation tile | `service.onService` #FFFFFF | `service.automation` #6D3FE8 | 5.95:1 | 3:1 | Pass |
| Glyph on the website tile | `service.onService` #FFFFFF | `service.website` #0A6CD6 | 5.09:1 | 3:1 | Pass |
| Glyph on the solutions tile | `service.onService` #FFFFFF | `service.solutions` #0B7A4B | 5.39:1 | 3:1 | Pass |
| Footer brand and text | `dark.text` #FFFFFF | `dark.canvas` #141414 | 18.42:1 | 4.5:1 | Pass |
| Text on a raised dark surface | `dark.text` #FFFFFF | `dark.surface` #242424 | 15.52:1 | 4.5:1 | Pass |
| Footer headings, tagline, base line | `dark.textMuted` #B3B3B3 | `dark.canvas` #141414 | 8.79:1 | 4.5:1 | Pass |
| Muted text on a raised dark surface | `dark.textMuted` #B3B3B3 | `dark.surface` #242424 | 7.40:1 | 4.5:1 | Pass |
| Footer links | `dark.link` #FFFFFF | `dark.canvas` #141414 | 18.42:1 | 4.5:1 | Pass |
| Footer link hover | `dark.linkHover` #B8C6FF | `dark.canvas` #141414 | 11.02:1 | 4.5:1 | Pass |
| Primary pill on a dark band | `dark.onAction` #141414 | `dark.action` #FFFFFF | 18.42:1 | 4.5:1 | Pass |
| Primary pill hover on a dark band | `dark.onAction` #141414 | `dark.actionHover` #E5E5E5 | 14.62:1 | 4.5:1 | Pass |
| Primary pill fill on a dark band | `dark.action` #FFFFFF | `dark.canvas` #141414 | 18.42:1 | 3:1 | Pass |
| Control outline on a dark band | `dark.controlBorder` #8F8F8F | `dark.canvas` #141414 | 5.70:1 | 3:1 | Pass |
| Focus ring in the footer | `dark.focus` #A8B8FF | `dark.canvas` #141414 | 9.62:1 | 3:1 | Pass |

## Not listed, and why

- `light.hairline` and `dark.hairline` are decorative dividers. They are never the only sign of a control, so 3:1 does not apply.
- `shadow.*`, the tile inset line and the stage fades are decorative. The fades sit at the stage edges, over moving images only, and each caption is fully readable once it moves past them.
- `light.card` equals `light.canvas` (#FFFFFF), so pairs on cards have the same ratio as pairs on canvas.
- Text inside example screens is part of an illustration with full alt text and a visible "Example" label. It is not page text. The captions on the screens are page text: `light.text` on `light.card`, 18.42:1.
