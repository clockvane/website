# Evidence: open mobile menu target sizes and Escape, 375 px, 2026-11-15

Closes the open-state half of F-16 (`docs/design/audit/2026-11-15.md`) for #229. Companion to
`2026-11-15-mobile-nav-focus.md` (closed state).

Method: Playwright (Chromium), viewport 375 × 812, `reducedMotion: reduce` and `no-preference`,
local `astro preview` of the `main` build. The menu is the native `<details class="menu">`.

## Measurements (menu open)

| Element | Before (measured) | Target | After |
|---|---|---|---|
| Primary links ("All services", "How we work", "About") | 335 × 44 px, 16 px | ≥ 44 px tall (primary), ≥ 24 px | 335 × 44 px, pass |
| Service sub-links (4) | 335 × 44 px, 16 px | ≥ 24 px tall | 335 × 44 px, pass |
| Focus indicator on a panel link | 2 px solid `--color-light-focus` (#2447E8), 2 px offset | visible, ≥ 3:1 | pass (token value) |
| Escape with focus in the panel | menu closes; focus on the Menu toggle | closes, focus returns | pass |
| Escape with focus on the Menu toggle | menu closes; focus stays on the toggle | closes | pass |
| Panel transition and animation (reduced motion) | `0s`, animation `none` | none | pass (also `0s` with motion allowed) |
| axe on the header with menu open | 0 violations | 0 | pass |
| Tab order, menu closed (25 presses) | no panel link reached | not focusable | pass |

## Result

The open state already meets the ticket criteria. No product code changed. The change is a
regression test, `tests/e2e/mobile-nav.spec.ts` (5 tests, all passing against the preview), which
enforces the closed-state Tab order, the open-state target sizes, Escape behaviour, reduced motion and
axe.

Ticket #229 is closed as **not-a-defect** for the navigation itself: the touch and keyboard behaviour
was already correct, and the audit's scan flagged closed-panel boxes that are not focusable.
