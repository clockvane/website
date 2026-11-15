# Evidence: section rhythm (#226, PR #235, fix round 1)

Measured on the production build (`astro build` + `astro preview`) with Playwright,
`reducedMotion: reduce`, `getBoundingClientRect()` after `networkidle`.

## Gap between last content and the closing band

The band's own section padding is 40 px (64 px from 64rem). The gap is measured from the bottom
edge of the last content child to the top of the visible `.band` surface.

| Page | 375 px | 768 px | 1280 px | 1440 px |
|---|---|---|---|---|
| / (home) | 80 | 80 | 128 | 128 |
| /services/ | 80 | 80 | 128 | 128 |
| /about/ | 80 | 80 | 128 | 128 |
| /how-we-work/ | 80 | 80 | 128 | 128 |

Before this round, /about/ and /how-we-work/ measured 40 px (375/768) and 64 px (1280/1440)
(ux-designer review, PR body and review comment).

## Gaps between sibling sections and items

| Page | Gap between items at 375 / 768 | at 1280 / 1440 |
|---|---|---|
| /services/ (4 service rows + help block) | 80 / 80 | 128 / 128 |
| /about/ (3 grid sections) | 80 / 80 | 128 / 128 |
| /how-we-work/ (6 grid blocks) | 80 / 80 | 128 / 128 |

Before this round, services rows were separated by 96 px at 375/768 and 128 px at 1280/1440
(`padding-block` of 48 px / 64 px on each row, summed). The help block sat 32 px below its
hairline margin. Both are now the same gap as every other section step.

## Tokens used

- Services list and grid pages: `calc(2 * var(--section-content))` (`-wide` from 64rem).
- Grid pages bottom edge: `.section` (`--section-content` / `--section-content-wide`).
- Grid pages top edge: `--section-hero` / `--section-hero-wide` (unchanged).

No new raw values. Horizontal overflow: none at 375, 768, 1280 or 1440 px on these four pages.

## Checks run

- `npm run lint`: pass
- `npm run typecheck`: 0 errors, 0 warnings
- `npm test`: 295 passed
- `npm run build`: 13 pages
- `npm run test:e2e` (includes axe at 320, 768 and 1280 px): 142 passed
- Lighthouse: not run locally (WSL Chrome failure); CI `test:lighthouse` on the preview is the source.
