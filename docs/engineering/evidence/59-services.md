# Services overview and detail pages — #59

The overview composes the existing ServiceRows and merged help-choose CTA. Six static detail
pages share `src/pages/services/[slug].astro`, with existing PageHeader, ServiceScene,
ProcessSteps and CtaBand components. Copy is transcribed from copy-deck §§2–3; Q1/Q2/Q6/Q13
placeholders remain visible. The AI cost illustration describes a method, with no savings claims.

## Local verification

- `npm run lint`: passed (ESLint, Stylelint and Prettier).
- `npm run check`: passed (Astro and TypeScript; zero errors, warnings or hints).
- `npm test`: 130 tests passed, 15 files; 100% measured line coverage.
- `npm run build`: passed, including all seven Services routes.
- `npm run test:e2e -- services.spec.ts`: 29 tests passed. Metadata, copy/section order,
  anchor navigation, related links, axe at 320/1440px, reflow at 320/768/1024/1280/1440px,
  200% text, skip-link keyboard focus and no-JS/reduced-motion/Save-Data modes.
- Build tests check unique metadata, sitemap membership, Service/BreadcrumbList JSON-LD,
  process copy and CSP/script/CSS budgets. Component tests distinguish Home/overview copy.

## Screenshots

Finished static frames, full pages, at 320px and 1440px:

| Page | Mobile | Desktop |
|---|---|---|
| Overview | [320](59-services-320.png) | [1440](59-services-1440.png) |
| Business process automation | [320](59-services-process-automation-320.png) | [1440](59-services-process-automation-1440.png) |
| AI automation | [320](59-services-ai-automation-320.png) | [1440](59-services-ai-automation-1440.png) |
| AI cost optimization | [320](59-services-ai-cost-optimization-320.png) | [1440](59-services-ai-cost-optimization-1440.png) |
| Cloud and DevOps | [320](59-services-cloud-devops-320.png) | [1440](59-services-cloud-devops-1440.png) |
| Websites and apps | [320](59-services-websites-and-apps-320.png) | [1440](59-services-websites-and-apps-1440.png) |
| Custom software | [320](59-services-custom-software-320.png) | [1440](59-services-custom-software-1440.png) |

## Compressed assets

Measured from the production artifact using Node gzip, counting each distinct requested asset
once per page. Total includes compressed HTML, scripts, styles and the self-hosted font;
it excludes response headers. No renderer, extra scene JavaScript or dependency was added.
The existing controller is loaded to enhance the examples. Limits: JS 35,000 B,
controller 5,000 B, CSS 40,000 B, page 600,000 B, requests 20.

| Page | JS gzip B | CSS gzip B | Total gzip B | Requests |
|---|---:|---:|---:|---:|
| /services/ | 1022 | 4810 | 37796 | 8 |
| /services/process-automation/ | 1022 | 4901 | 36176 | 9 |
| /services/ai-automation/ | 1022 | 4901 | 36162 | 9 |
| /services/ai-cost-optimization/ | 1022 | 4901 | 36162 | 9 |
| /services/cloud-devops/ | 1022 | 4901 | 36139 | 9 |
| /services/websites-and-apps/ | 1022 | 4901 | 36100 | 9 |
| /services/custom-software/ | 1022 | 4901 | 35965 | 9 |

## Mobile Lighthouse

Lighthouse 12.6.1, Playwright Chromium, default mobile simulated throttling against
the production build served by Astro preview on port 4411. Three sequential cold runs per
page; **all 21 runs scored 100 in every category**. Median LCP is shown below;
CLS and TBT were zero in every run. These lab checks make no field INP claim.

| Page | Performance | Accessibility | Best practices | SEO | Median LCP ms | CLS | TBT ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| /services/ | 100 | 100 | 100 | 100 | 1366 | 0 | 0 |
| /services/process-automation/ | 100 | 100 | 100 | 100 | 1217 | 0 | 0 |
| /services/ai-automation/ | 100 | 100 | 100 | 100 | 1218 | 0 | 0 |
| /services/ai-cost-optimization/ | 100 | 100 | 100 | 100 | 1228 | 0 | 0 |
| /services/cloud-devops/ | 100 | 100 | 100 | 100 | 1217 | 0 | 0 |
| /services/websites-and-apps/ | 100 | 100 | 100 | 100 | 1222 | 0 | 0 |
| /services/custom-software/ | 100 | 100 | 100 | 100 | 1220 | 0 | 0 |

The initial Lighthouse CLI attempt failed before auditing because chrome-launcher tried to
create its profile in the read-only Windows AppData directory. Local measurements therefore
used Lighthouse's Node API attached to one Playwright-launched Linux Chromium over CDP,
with the default mobile settings. Reports remain in ignored
`.agentops-scratch/59-lh-<service>-<run>.json`. The committed Lighthouse CI configuration
includes all seven routes for the normal CI runner. Preview and browser were stopped.
