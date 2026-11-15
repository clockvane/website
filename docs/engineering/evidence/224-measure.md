# Evidence: body measure ≤ 75 characters per line (#224, round 2)

Measured in Chromium (Playwright, `reducedMotion: reduce`) against `astro preview` of the production
build, at 1280 px and 1440 px. Characters per line = characters of the paragraph's text ÷ number of
distinct line boxes (from `Range.getClientRects()`). Paragraphs of 60 characters or more were checked.

## Change

| Item | Before | After | Where |
|---|---|---|---|
| `layout.measure` | 38 rem (608 px) | 34 rem (544 px) | `docs/design/tokens.json` |
| Body paragraphs | capped at the measure only inside `.measure` | capped at `layout.measure` everywhere (`:where(p:not(.lead))`, zero specificity) | `src/styles/utilities.css` |
| Contact form hint | uncapped (713 px, 81 cpl) | capped at `layout.measure` | `src/components/ContactForm.astro` |
| Figure label (`components.md`) | "12 px" for the figcaption that is now Caption | Micro role only for tags and fact labels; figure caption is the Caption role | `docs/design/components.md` |

## Results (worst paragraph per page, characters per line)

| Page | 1280 before | 1280 after | 1440 before | 1440 after | Target |
|---|---|---|---|---|---|
| / | 76 ("A technical issue…", reviewer measure at 38 rem) | 72 | 76 | 72 | ≤ 75 |
| /about/ | 65 | 65 | 65 | 65 | ≤ 75 |
| /how-we-work/ | 77 ("Every project is quoted…") | 69 | 77 | 69 | ≤ 75 |
| /contact/ | 81 (`p.hint`) | 41 | 81 | 41 | ≤ 75 |
| /privacy/ | 77 (analytics paragraph) | 68 | 77 | 68 | ≤ 75 |
| /services/ | 101 (uncapped body) | 73 | 101 | 73 | ≤ 75 |
| /services/ai-automation/ | 72 | 66 | 72 | 66 | ≤ 75 |
| /services/website-creation/ | 62 | 62 | 62 | 62 | ≤ 75 |
| /services/expert-support/ | — | 69 | — | 69 | ≤ 75 |
| /services/solutions/ | — | 71 | — | 71 | ≤ 75 |
| /404/ | — | 39 | — | 39 | ≤ 75 |

The maximum after the change is 73 characters per line, across 1280 and 1440 px, on every public
page and the 404 page. "Before" values for `/` and `/privacy/` are the UX review's 38 rem measurements;
the other "before" values were measured on an intermediate build at 36 rem, which gave the same 76–77 for the
paragraphs inside the measure, and 81 and 101 for the uncapped paragraphs (those do not depend on the token). `/services/` at 101 characters per
line before the change was an uncapped body paragraph in the services section; it now sits at the measure.

## Checks run on this commit

- `npm run lint`: pass. `npm run typecheck`: 0 errors. `npm test`: 295 passed (29 files).
- `PORT=4401 npm run test:e2e`: 142 passed, including axe at 320, 360, 768 and 1280 px.
- Contrast is unchanged from the PR body (#666666 on #FFFFFF 5.74:1; #666666 on #F4F4F4 5.22:1).
- Lighthouse is run by CI on the preview (`lighthouse` check); the change adds no requests or JavaScript.
