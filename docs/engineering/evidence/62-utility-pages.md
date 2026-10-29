# Issue #62 — 404 and privacy pages

The static build now includes `/404.html` and `/privacy/`, composed from the existing
result panel, page header and base layout. Unknown nested paths return HTTP 404 with
Home, Services and Contact links. Privacy is included in the sitemap; the 404 page is
excluded and has `noindex, follow`. Neither page has a closing CTA band.

Copy follows copy-deck sections 9 and 10. As issue #62 explicitly requires, the
draft's analytics provider, visit-count and cookie assertions remain Q10 placeholders:
the security privacy document specifies no analytics by default. Legal entity,
publication date, legal review, legal basis, rights, retention and delivery-channel
placeholders remain visible for owner review before launch. The privacy contact reads
the configured email, which is still a placeholder. No provider is activated here.

Verified on 2026-10-28 with Node 24 and the committed lockfile:

- `npm run lint`: ESLint, Stylelint and Prettier pass.
- `npm run check`: Astro and TypeScript pass with zero diagnostics.
- `npm test`: 53 tests across nine files pass; measured logic/config line coverage is 100%.
- `npm run build`: six static pages plus robots, social image and sitemap build successfully.
- `PORT=4412 npm run test:e2e`: 35 tests pass with one Chromium worker. Coverage includes
  unique titles/descriptions across the built pages, metadata, sitemap membership,
  unresolved privacy facts, unknown nested path status, keyboard recovery to Home and
  Contact without JavaScript, and existing contact/shell regressions.
- Axe reports zero WCAG A/AA violations on both utility pages at 320 and 1280 px;
  Privacy also passes the shared 360/768/1280 px route checks. No horizontal overflow.

Screenshots were visually inspected at both widths:
404 [320 px](62-404-320.png) · [1280 px](62-404-1280.png);
Privacy [320 px](62-privacy-320.png) · [1280 px](62-privacy-1280.png).

Three mobile Lighthouse runs on `/privacy/` passed every configured NFR assertion:
performance, accessibility, best practices and SEO scored **100 on every run**.
LCP was **1.516–1.526 s**, CLS **0.00018**, TBT **0 ms**, with no run warnings.
The scratch runner reused the existing Linux Chromium workaround documented for #65;
no launcher or dependency changes ship. Preview used port 4412 and stopped afterward.

Both pages contain zero script elements. Gzipped external CSS totals **2,863 bytes**
for Privacy and **2,812 bytes** for 404, within the 30 kB page budget. Existing fonts
are unchanged. There are no new dependencies, third-party requests, cookies or storage.
