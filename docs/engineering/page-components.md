# Shared page components

Issue #65 implements the design-system inventory for page composition. These static Astro
components render complete static HTML. Pages still own section order, metadata, sitemap
inclusion and the decision to omit the closing band on utility pages.

Change request 3 (#121) removed the name-based and dropped-concept components (dispatch hero,
service scenes, workflow diagrams and illustrations, scene replay) and their content modules.
The generic components below form the neutral base for the design system v3 work. The motion
controller (`src/scripts/motion.ts`, `src/lib/motion/policy.ts`, `<BaseLayout motion>`) is kept
for `[data-scene]` sections; no page uses it at the moment.

| Component | Contract |
| --- | --- |
| `sections/PageHeader.astro` | Required `title`; optional `lede`, `action: { label, href }`, `breadcrumbs: { label, href }[]`. Breadcrumbs contain ancestors only: the component appends the current title as plain text. Supplies the page's h1. |
| `sections/CtaBand.astro` | Defaults to approved `closing-cta`. Pass `content={helpChoose}` from `src/content/sections.ts` on Services to produce its single merged band. CTA label/destination use the existing shared navigation action. |
| `sections/ServiceRows.astro` | `variant="home"` (default): number, h3, summary and link. `variant="overview"`: h2, summary, work list and stable slug anchor. The four names/order/links come from `src/content/services.ts`; navigation derives its service list from the same module. |
| `sections/ProcessSteps.astro` | Required `steps: { title, body, output? }[]`; optional `variant="home"` or `"timeline"` (default). Place below an h2. Home becomes two/four columns at tablet/desktop; timeline keeps chronological order and puts optional outputs alongside steps on desktop. Empty steps render nothing. |
| `ui/Card.astro` | Optional `title`, `body`, `link: { label, href }`, default slot and `headingLevel="h2"` or `"h3"` (default). Empty cards render nothing; cards without links have no tab stops. Light palette is retained inside inverse bands. |
| `sections/ResultPanel.astro` | Required `title`, `body`; optional slot and root-absolute `actions`. Default h1 for standalone results. `inline` supplies a focusable h2 with `data-result-heading`; the caller owns focus after submission. Existing contact pages retain their specialised result behavior. |

Wrap normal page content in `.container.section`; headers and result panels deliberately add no
outer section padding. CTA bands own their container and section padding. Add ordinary headings
and approved content around service rows/process lists. Components never invent page copy.
Related-service cards should read names/links from the service module rather than duplicate them.
Service wording in `services.ts` is a DRAFT from the brief until copy deck v3 replaces it.

Responsive rules belong in `src/styles/responsive.template.css`, where the existing generator
substitutes token breakpoints. Component defaults consume custom properties for display/padding
overrides to avoid specificity conflicts with Astro's scoped styles.

## Verification

`npm test` renders the actual components through Astro's container, covering variants, optional
props, empty omission, content ordering and headings. `npm run check` checks Astro props as well
as plain TypeScript. The test-only declaration under `tests/unit/components/` describes compiled
component factories to plain `tsc`.

Run `PORT=4412 npm run test:components` for the browser fixture. It builds an isolated artifact
under ignored `.agentops-scratch/components-dist/`, injects `/__components/` only into that build,
and starts/stops one preview through Playwright. No fixture route enters production `dist/`.
Checks cover 320/768/1024/1440 px, axe, sequential keyboard navigation, focus rings, 44 px targets,
200% text, forced colors, reduced motion and reading without JavaScript. Screenshots are written
under `.agentops-scratch/65-components-*.png`. The regular `npm run test:e2e` continues to
exercise the production artifact separately.
