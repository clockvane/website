# Shared page components

Issue #65 implements the design-system inventory for page composition. These static Astro
components render complete static HTML. Pages still own section order, metadata, sitemap
inclusion and the decision to omit the closing band on utility pages.

Change request 3 (#121) removed the name-based and dropped-concept components (dispatch hero,
service scenes, workflow diagrams and illustrations, scene replay) and their content modules.
Issue #126 implements the approved v3 tokens, shell and shared building blocks. `BaseLayout`
loads the single motion controller (`src/scripts/motion.ts`, `src/lib/motion/policy.ts`) for
disclosures, tabs, marquees and the scripted demo. It leaves complete HTML when JavaScript,
motion or data-saving preferences prevent playback. Production page assembly stays in #58/#59.

| Component | Contract |
| --- | --- |
| `sections/PageHeader.astro` | Required `title`; optional `lede`, `action: { label, href }`, `breadcrumbs: { label, href }[]`, `current` and a `before-title` slot. Breadcrumbs contain ancestors only: the component appends `current` (default `title`) as plain text. Supplies the page's h1. |
| `sections/CtaBand.astro` | Defaults to approved `closing-cta` and the shared navigation action. Service pages pass their own `content` and `cta` (copy deck §3). |
| `sections/ServiceRows.astro` | `variant="home"` (default): number, h3, summary and link. `variant="overview"`: h2, summary, work list and stable slug anchor. The four names/order/links come from `src/content/services.ts`; navigation derives its service list from the same module. |
| `sections/ProcessSteps.astro` | Required `steps: { title, body, output? }[]`; optional `variant="home"` or `"timeline"` (default). Place below an h2. Home becomes two/four columns at tablet/desktop; timeline keeps chronological order and puts optional outputs alongside steps on desktop. Empty steps render nothing. |
| `ui/Card.astro` | Optional `title`, `body`, `link: { label, href }`, default slot and `headingLevel="h2"` or `"h3"` (default). Empty cards render nothing; cards without links have no tab stops. Light palette is retained inside inverse bands. |
| `sections/ResultPanel.astro` | Required `title`, `body`; optional slot and root-absolute `actions`. Default h1 for standalone results. `inline` supplies a focusable h2 with `data-result-heading`; the caller owns focus after submission. Existing contact pages retain their specialised result behavior. |
| `sections/TokenHeadline.astro` | `lines` of text or `{ text, service }` segments; optional `animate`. Produces one h1 with decorative inline service tokens; words remain complete without the glyphs. |
| `ui/ExampleScreen.astro` | Required example `id` and slot-specific `sizes`; optional `eager`, `priority`, `lift`. Local sources become AVIF/WebP at 320/480/640/960 widths with dimensions and HTML example captions. Lazy by default; at most one above-fold image gets `priority`. |
| `sections/Marquee.astro` | Unique `id`, accessible `label`, `tracks` of example IDs; `variant="columns"` or `"row"`. CSS movement, shared persistent pause controls, off-screen/hidden-tab pause, stopped scrollable layout under reduced motion, Save-Data or no JavaScript. |
| `sections/ServiceTabs.astro` | `tabs` from `src/content/service-tabs.ts` and an accessible `label`. Roving arrow/Home/End selection; every panel stacks without JavaScript. Use once per page (service IDs are stable). |
| `sections/AiDemo.astro` | Optional typed `copy`, defaulting to the approved scripted example. One instance per page. Complete draft without playback; keyboard pause/replay, Escape, off-screen/hidden-tab suspension and a polite completion message. |
| `sections/StoryPlaceholders.astro` | Required `heading` and `stories`. Empty data omits the whole section; placeholder mode is for fixtures/editorial previews only. Production callers must supply approved real stories or an empty list. |

Wrap normal page content in `.container.section`; headers and result panels deliberately add no
outer section padding. CTA bands own their container and section padding. Add ordinary headings
and approved content around service rows/process lists. Components never invent page copy.
Related-service cards should read names/links from the service module rather than duplicate them.
`services.ts` holds copy deck v3 service wording; `src/pages/services/[slug].astro` is the one template for all four service pages.

Responsive rules belong in `src/styles/responsive.template.css`, where the existing generator
substitutes token breakpoints. Component defaults consume custom properties for display/padding
overrides to avoid specificity conflicts with Astro's scoped styles.

## Verification

`npm test` renders the actual components through Astro's container, covering variants, optional
props, empty omission, content ordering and headings. `npm run check` checks Astro props as well
as plain TypeScript. The test-only declaration under `tests/unit/components/` describes compiled
component factories to plain `tsc`.

Run `PORT=4411 npm run test:components` for the browser fixtures. It builds an isolated artifact
under ignored `.agentops-scratch/components-dist/`, injects `/__components/` and `/__design-system/` only into that build,
and starts/stops one preview through Playwright. No fixture route enters production `dist/`.
Checks cover 320/768/1024/1440 px, axe, sequential keyboard navigation, focus rings, 44 px targets,
200% text, forced colors, reduced motion and reading without JavaScript. Screenshots are written
under `.agentops-scratch/65-components-*.png`. The regular `npm run test:e2e` continues to
exercise the production artifact separately.

The v3 fixture adds tab/demo keyboard journeys, marquee pause, reduced-motion and no-JS checks,
image output checks and 320/768/1440 px screenshots (`.agentops-scratch/126-components-*.png`).
Run `DIST_DIR=.agentops-scratch/components-dist npm run test:dist` to apply the NFR size and CSP
checks to the image-rich fixture as well as the existing production routes. Example sources
are original screens under `src/assets/examples/`. `docs/design/v3/prototype-src/` is the permanent
home of their screen definitions and PNG renderer, despite its historical name. It regenerates
those PNG sources, never public runtime assets; do not delete it during prototype cleanup.
