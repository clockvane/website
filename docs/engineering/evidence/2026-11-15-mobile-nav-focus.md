# Evidence: mobile navigation keyboard focus at 375 px, 2026-11-15

Supports finding F-16 in `docs/design/audit/2026-11-15.md`.

Method: Playwright (Chromium), `reducedMotion: reduce`, viewport 375 × 812, live site
`https://clockvane-website.pages.dev/`. The menu is the native `<details class="menu">` (closed on load).
The script read each header link's box and then pressed Tab 25 times from the page start.

## Result

- The menu was closed (`details.menu` open = false).
- Tab order from the start of the page reached: skip link, logo, "Book a call", **Menu** (44 × 44 px),
  then "Book a call" (in the page body), the page content, and the footer. **No link inside the closed
  panel was reached.**
- The closed-panel links measured 4–16 px wide and 120–432 px tall. They are inside a closed `<details>`,
  so they are not rendered as focusable content. The earlier scan measured them because it reads
  layout boxes, not focus.

## Conclusion

- Closed state: **met**. No invisible control takes keyboard focus.
- Open state: **not yet measured**. Target sizes of the open panel (24 px minimum, 44 px for primary
  items) and Escape behaviour are checked in #229.
