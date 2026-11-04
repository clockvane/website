# Issue #126 — design system v3 verification

Verified locally on 2026-11-04, resuming `sde3/126-design-system-v3`. The site shell and existing
pages use the approved v3 tokens. New page building blocks are exercised in an isolated fixture;
Home and Services assembly remain #58 and #59. Neither fixture route is published in `dist/`.

## Checks

| Command | Result |
| --- | --- |
| `npm run lint` | ESLint, Stylelint token rules and Prettier pass |
| `npm run check` | Astro and TypeScript pass; 0 errors, warnings or hints |
| `npm test` | 154 tests pass; reported line coverage 100% |
| `npm run build` | 8 static pages; final warm build 794 ms |
| `npm run test:e2e` | 57 pass, including axe, contact success/failure/native POST, keyboard, 320 px reflow, enlarged text, forced colours and reduced motion |
| `npm run test:components` | 15 pass, including pause/replay, tab keyboard navigation, off-screen pause, runtime reduced-motion changes, no-JS reading and responsive images |
| `npm run test:components -- --grep "no horizontal"` | 3 pass after completing the fixture headline and waiting for images to decode for screenshots |
| `npm run test:dist` | 35 pass on the production artifact |
| `DIST_DIR=.agentops-scratch/components-dist npm run test:dist` | 41 pass on the isolated image-rich artifact |

The budget scan counts annotated Astro `<picture>` elements and distinct image URLs, includes
lazy images in whole-page weight, checks the actual `MotionScript` chunk, and checks font totals.
The existing CSP tests remain intact. No dependencies or host integrations were added.

## Reduced-motion flake (QA review of `38c0758`)

`demo spinner pauses off-screen…` failed on `document.getAnimations().length` (35, expected 0).
Reproduced in 3 of 5 runs and logged the survivors: all 35 were `CSSTransition`s with a 1 ms duration
on the demo's steps, result and marquee tracks, started when the preference changed. No marquee or
spinner `CSSAnimation` remained, and the count was 0 after 300 ms. They came from the global
`transition-duration: 1ms` override, so reduced motion still briefly started transitions, against
P-15. Nothing listens for `transitionend`. The override is now `transition: none`, and the test's
immediate assertion is unchanged, with no polling or retry.

| Command, after the fix | Result |
| --- | --- |
| `npx playwright test … -g "demo spinner pauses\|reduced motion: nothing" --repeat-each=15` | 30 of 30 pass |
| `npm run test:components`, three runs, each after deleting the fixture build | 15 pass every run |
| `npm run test:e2e` | 57 pass |
| `npm run lint`, `npm run check` | pass; 0 errors, warnings or hints |
| `npm run build`, then `npm test` | 8 pages; 154 pass |
| `npm run test:dist` | 35 pass |

Lighthouse was not rerun locally for this one-line change; it applies only under reduced motion,
and the CI `lighthouse` job runs on the new commit.

## Mobile Lighthouse

The repository's `tests/e2e/lighthouserc.cjs` ran three mobile audits per configured URL; all
assertions passed. Representative results from the 15-run collection:

| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 100 | 100 | 100 | 100 | 1206 ms | 0 | 0 ms |
| `/about/` | 100 | 100 | 100 | 100 | 1361 ms | 0 | 0 ms |
| `/how-we-work/` | 100 | 100 | 100 | 100 | 1360 ms | 0 | 0 ms |
| `/contact/` | 100 | 100 | 100 | 100 | 1359 ms | 0 | 0 ms |
| `/privacy/` | 100 | 100 | 100 | 100 | 1205 ms | 0 | 0 ms |

Contact was rechecked with three runs after the final field-radius/helper-colour alignment;
its row above uses that final artifact. All three runs passed the same assertions.

Local launcher detail: plain `npm run test:lighthouse` hit chrome-launcher's WSL Windows-temp
detection (`EROFS` under Windows AppData). A scratch wrapper launched the installed Linux
Playwright Chromium with `--remote-debugging-port=9222`, then ran the same LHCI autorun/config
with `--collect.settings.port=9222`, closing Chromium in `finally`. This changes only how the
browser starts; audit settings, three-run collection and assertions are unchanged. The preview
used port 4411. CI continues to use the normal `lighthouse` job; remote results are pending PR CI.

The 404 and contact result pages remain intentionally noindex and are covered by the browser
suite, rather than the indexable-page Lighthouse SEO assertion.

## Artifact budgets

Gzip at level 9, decimal kB; whole-page estimates include HTML, CSS, scripts, fonts and the
largest AVIF candidate of each distinct screen, including below-fold screens.

| Asset or page | Measured | Limit |
| --- | --- | --- |
| Shared motion controller | 1,959 bytes | 5,000 bytes |
| Contact enhancement | 7,405 bytes | 15,000 bytes |
| Maximum production page scripts (Contact) | 9,364 bytes | 50,000 bytes |
| Maximum production CSS (How we work) | 4,677 bytes | 40,000 bytes |
| V3 fixture CSS | 6,286 bytes | 40,000 bytes |
| Fonts | 1 file, 26,832 bytes | 3 files, 120,000 bytes |
| Largest generated AVIF/WebP file | 47,318 bytes | 100,000 bytes |
| V3 fixture distinct image candidates | 349,293 bytes | Included below |
| Whole v3 fixture | 391,647 bytes | 1,500,000 bytes |
| Largest production page (Contact) | 43,573 bytes | 1,500,000 bytes |

All fixture images use AVIF plus WebP, responsive source sets/sizes, explicit dimensions and
lazy loading. The fixture deliberately tests below-fold instances; a future page supplies eager
loading and, at most once, high priority through `ExampleScreen` when placing an image above the fold.

## Visual evidence

The fixture screenshots use the reduced-motion finished state and decode images before capture.
The active-motion path is covered separately by the browser suite. Screenshots were inspected
for type, control contrast, image labels, reflow and footer layout.

- [Components at 320 px](126-components-320.png)
- [Components at 1440 px](126-components-1440.png)
- [Contact and shell at 320 px](126-contact-320.png)
- [Contact and shell at 1280 px](126-contact-1280.png)

Existing page copy and unresolved facts remain owned by their page/content tickets. No real
stories or client claims were added. The story component renders nothing with an empty list;
its placeholder mode is only for editorial previews. `public/labs/` is removed. The original
screen definitions and PNG renderer remain as reproducible asset sources, with documentation
updated to distinguish them from the deleted throwaway page builder.
