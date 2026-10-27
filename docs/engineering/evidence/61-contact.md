# Contact verification — issue #61

Measured on 2026-10-27 against the production static build, Node 24.22.1.

- `npm run lint`: ESLint, Stylelint and Prettier pass.
- `npm run check`: Astro and TypeScript pass, no errors/warnings/hints.
- `npm test`: 44 tests in eight files pass; 100% measured line coverage for
  site config and `src/lib/`, including both contact modules.
- `npm run build`: four static pages, social image, robots and sitemap; 1.62 s.
- `npm audit --audit-level=high`: no vulnerabilities.
- Playwright: 19 tests pass with one Chromium worker, including the existing shell
  suite. Contact covers client/server field errors, focused summaries and field
  links, read-only sending state and duplicate guarding, successful inline
  confirmation, network/delivery/rate failures with input preservation and retry,
  and native no-JS validation and both 303 redirect outcomes. Endpoint interception
  uses the real portable handler with deterministic delivery dependencies.
- Axe: zero WCAG A/AA violations for initial, invalid, failed and successful forms;
  Contact, Thanks and Error also pass at 320/1280 px. Visible controls are at least
  44×44 px; no horizontal overflow at 200% text. Utility pages are noindex and absent
  from the sitemap. The enhanced success flow passes under the strict configured CSP.
- Local Playwright Chromium lacks system libraries. The committed suite ran with
  a scratch-only launcher and the existing bundled Chromium/shared libraries, as
  for #57. No workaround, browser dependency or Lighthouse dependency ships.

Lighthouse 13.5.0, mobile defaults, three sequential runs on port 4412:

| Metric | Run 1 | Run 2 | Run 3 | Budget |
| --- | ---: | ---: | ---: | ---: |
| Performance | 99 | 99 | 100 | ≥95 |
| Accessibility / Best Practices / SEO | 100 / 100 / 100 | 100 / 100 / 100 | 100 / 100 / 100 | ≥95 each |
| LCP | 1.563 s | 1.551 s | 1.540 s | ≤2.0 s |
| CLS | 0.00144 | 0.00144 | 0.00144 | ≤0.05 |
| TBT | 0 ms | 0 ms | 0 ms | ≤150 ms |

Seven requests and 100,509 transferred bytes; no Lighthouse run warnings. Contact
JavaScript is 7,290 gzip bytes (budget 15 kB); its three stylesheets total 3,313 gzip
bytes (budget 30 kB). Other pages still ship no client script. Fonts remain two
self-hosted WOFF2 files totalling 84,916 bytes. ContactPage uses microdata, avoiding
an inline script/CSP exception.

Fonts-loaded screenshots: Contact [320 px](61-contact-320.png) ·
[1280 px](61-contact-1280.png); utility pages [Thanks](61-thanks-320.png) ·
[Error](61-error-320.png).

These measurements exercise the contract with injected successful/failed delivery,
not a live provider. Per ADR-002, the Worker remains an error-only stub until the
owner selects the delivery channel. Its endpoint and site origin remain reserved
non-live config values. No deployment or real delivery was performed. Activation,
the optional timing signal's limitations and edge rate-limit scope are documented
in [the contact notes](../contact.md).
