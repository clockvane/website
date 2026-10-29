# About page evidence — #71

The `/about/` route composes the existing BaseLayout, PageHeader and CtaBand with
copy from `docs/content/copy-deck.md` §5. The portrait column is omitted because
no photos are supplied. Owner-dependent facts remain placeholders, including the
draft name story. No public proof links are active before owner approval.

The existing shared audit CTA now reads its label and destination from site config;
the navigation export and rendered destination remain compatible with existing callers.
No dependencies, client scripts or new shared components were added. Page CSS only
spaces the expertise list using existing tokens; the page ships zero JavaScript.

## Checks

- `npm run lint`: passed (ESLint, Stylelint, Prettier).
- `npm run check`: passed (Astro: zero errors, warnings or hints; TypeScript passed).
- `npm test`: 54 tests passed; 100% line coverage across configured files.
- `npm run build`: passed; `/about/` is emitted and included in the sitemap.
- `npm run test:e2e`: 33 tests passed. About coverage includes approved founder names,
  placeholders, absent portraits/proof links, unique metadata, OG/canonical tags,
  sitemap inclusion and the config-backed CTA. WCAG 2.2 AA axe checks cover
  320/360/768/1280 px. No-JavaScript keyboard skip navigation and CTA activation,
  320/1280 px reflow and 200% text enlargement pass.
- Lighthouse CI: all assertions passed for Home and About (three runs each).
  About scored 100 in performance, accessibility, best practices and SEO in all
  three runs; LCP 1508–1515 ms, CLS ≤ 0.00018, TBT 0 ms.
  The default Chrome launcher attempted a read-only Windows temp directory under
  WSL. The successful run launched installed Playwright Chromium with a debugging
  port and used `npm run test:lighthouse -- --collect.settings.port=9222`.
  Thresholds were unchanged; the wrapper closed Chromium after the run.

## Screenshots

Inspected full-page screenshots with fonts loaded:

- [320 px](71-about-320.png)
- [1280 px](71-about-1280.png)

The screenshots intentionally show the copy deck's owner-input placeholders. These
are build-phase evidence, not approval to publish the unconfirmed facts at release.
