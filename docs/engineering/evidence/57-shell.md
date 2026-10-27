# Shared shell verification — issue #57

Measured on 2026-10-27 against the production static build, Node 24.22.1.
This is the placeholder page and shared navigation, not completed marketing pages or the contact journey.

- `npm run lint`: ESLint, Stylelint (CSS and Astro), Prettier passed.
- `npm run check`: Astro and TypeScript passed, zero errors/warnings/hints.
- `npm test`: 15 tests in 5 files passed; 100% line coverage for configured sources.
- `npm run build`: one page plus PNG/robots endpoints and sitemap built in 1.82 s.
- `npm audit --audit-level=high`: zero vulnerabilities.
- Playwright: 8 tests passed, one Chromium worker. No-JS keyboard navigation passed at
  320/480/768/1024/1280 px. Axe found zero WCAG A/AA violations with disclosures closed/open at
  320/1280 px. Visible targets were at least 44×44 px. Both fonts loaded; 200% text had no horizontal
  overflow. Forced-colors keyboard focus and reduced-motion checks passed.
- Local browser libraries were unavailable for Playwright's packaged Chromium. The committed suite
  ran through a scratch-only launcher using Chromium with matching shared libraries and a local
  fontconfig file. No browser workaround or extra browser dependency ships with the site.

Lighthouse 13.5.0, mobile preset, three sequential runs against `astro preview` on port 4411:

| Metric | Run 1 | Run 2 | Run 3 | Budget |
|---|---:|---:|---:|---:|
| Performance / Accessibility / Best Practices / SEO | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | ≥95 each |
| LCP | 1.389 s | 1.400 s | 1.368 s | ≤2.0 s |
| CLS | 0.00053 | 0.00053 | 0.00053 | ≤0.05 |
| TBT | 0 ms | 0 ms | 0 ms | ≤150 ms |

CSS: 2,446 gzip bytes (≤30 kB). Client JavaScript: 0 bytes (≤5 kB).
Fonts: two self-hosted WOFF2 files, 84,916 bytes total (≤100 kB), with only the body face preloaded.
Lighthouse recorded four requests and no third-party resources.
Unit tests recompute the approved opaque color pairings; their minimum contrast is 5.26:1.

Default, fonts-loaded screenshots: [320 px](57-layout-320.png) · [1280 px](57-layout-1280.png).

Canonical, OG and sitemap URLs intentionally use the reserved origin in `site.config.ts` until its
production-domain placeholder is replaced. Navigation follows the approved sitemap; destination
pages remain their own feature tickets. Preview indexing restrictions still come from the existing
host preparation step. These measurements do not claim complete-site, cross-browser or release acceptance.
