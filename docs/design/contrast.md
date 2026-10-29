# Dispatch field v2 — computed contrast

Issue #86. Exhaustive **allowed pairs**, using opaque sRGB values from [tokens.json](tokens.json). Ratios are symmetric: reversed button label/icon pairs use the same rows. Canvas and panel are the only surfaces for text/controls; no light theme or extra bright band. Focus uses ice on the exposed canvas/panel gap, including around primary buttons. Disabled controls use panel fill, muted text and line border, never opacity.

| Foreground / background | Ratio | Needed (text / UI) | Result / uses |
|---|---:|---|---|
| `#F4F7FF` / `#090E19` | 18.00:1 | 4.5 / 3 | PASS — Body, heading, secondary default, field hover/active border; link hover; primary active fill/edge and reversed canvas label/icon on canvas |
| `#BACBE0` / `#090E19` | 11.67:1 | 4.5 / 3 | PASS — Secondary prose, hints/placeholders, disabled/read-only labels and icons on canvas |
| `#B5EDFF` / `#090E19` | 15.18:1 | 4.5 / 3 | PASS — Link, primary fill/edge and reversed canvas label/icon, focus, success symbol, opaque path core on canvas |
| `#E1F7FF` / `#090E19` | 17.41:1 | 4.5 / 3 | PASS — Link active, secondary active border/icon, primary hover fill/edge and reversed canvas label/icon on canvas |
| `#7D92AE` / `#090E19` | 6.06:1 | 4.5 / 3 | PASS — Borders, rules, grid, disabled boundary and meaningful diagram strokes on canvas |
| `#FFB4AB` / `#090E19` | 11.36:1 | 4.5 / 3 | PASS — Error text, symbols, message/invalid-field borders on canvas |
| `#F4F7FF` / `#131F32` | 15.43:1 | 4.5 / 3 | PASS — Body, heading, secondary default, field hover/active border; link hover; primary active fill/edge and reversed canvas label/icon on panel |
| `#BACBE0` / `#131F32` | 10.01:1 | 4.5 / 3 | PASS — Secondary prose, hints/placeholders, disabled/read-only labels and icons on panel |
| `#B5EDFF` / `#131F32` | 13.01:1 | 4.5 / 3 | PASS — Link, primary fill/edge and reversed canvas label/icon, focus, success symbol, opaque path core on panel |
| `#E1F7FF` / `#131F32` | 14.92:1 | 4.5 / 3 | PASS — Link active, secondary active border/icon, primary hover fill/edge and reversed canvas label/icon on panel |
| `#7D92AE` / `#131F32` | 5.19:1 | 4.5 / 3 | PASS — Borders, rules, grid, disabled boundary and meaningful diagram strokes on panel |
| `#FFB4AB` / `#131F32` | 9.74:1 | 4.5 / 3 | PASS — Error text, symbols, message/invalid-field borders on panel |

All pairs pass normal-text AA, so no large-text exception is used (large threshold: 3:1 at ≥24px or ≥18.7px bold). The line token is intended for UI, but also exceeds 4.5:1. Filled primary buttons use canvas labels/icons on ice/default, iceHover/hover and text/active. Secondary controls, all error/success messages, forms, cards, dark bands and links use one of the rows above. No other foreground/background pairing is permitted.

No transparent color is specified for contrast-bearing content, so alpha flattening is unnecessary. Static glow has blurred/decorative alpha only inside a clipped empty lane; **no text, controls, meaningful icons, nodes or focus indicators on it**. The unblurred ice core supplies the route meaning; do not treat halo contrast as evidence. Moving/fading shapes duplicate the always-readable description and are decorative. Forced-color system palettes are user-agent controlled, not additional authored hex pairs.

Reproduce the role self-check with `node .agentops-scratch/contrast.mjs`. The persistent check is `npx vitest run tests/unit/lib/design/tokens.test.ts`: it resolves actual tokens, verifies each ratio and minimum, both dark surfaces and compatibility aliases, and catches drift in the recorded ratios. The token audit extension contains the chosen palette pairs; the committed test supplies the reusable algorithm, addressing PR #85's contrast reproducibility finding.
