# Shared page components

Issue #65 implements the design-system inventory for page composition. These static Astro
components ship no JavaScript. Use them inside `BaseLayout`; pages still own section order,
metadata, sitemap inclusion and the decision to omit the closing band on utility pages.

| Component | Contract |
| --- | --- |
| `sections/PageHeader.astro` | Required `title`; optional `lede`, `action: { label, href }`, `breadcrumbs: { label, href }[]`. Breadcrumbs contain ancestors only: the component appends the current title as plain text. Supplies the page's h1. |
| `sections/CtaBand.astro` | Defaults to approved `closing-cta`. Pass `content={helpChoose}` from `src/content/sections.ts` on Services to produce its single merged band. CTA label/destination use the existing shared navigation action. Unconfirmed audit length is omitted. |
| `sections/ServiceRows.astro` | `variant="home"` (default): h3, shared summary, explicit link. `variant="overview"`: h2, problem, work list and stable slug anchor. Names/order/links/copy come from `src/content/services.ts`; navigation derives its service list from the same module. |
| `sections/ProcessSteps.astro` | Required `steps: { title, body, output? }[]`; optional `variant="home"` or `"timeline"` (default). Place below an h2. Home becomes two/four columns at tablet/desktop; timeline keeps chronological order and puts optional outputs alongside steps on desktop. Empty steps render nothing. |
| `ui/Card.astro` | Optional `title`, `body`, `link: { label, href }`, default slot and `headingLevel="h2"` or `"h3"` (default). Empty cards render nothing; cards without links have no tab stops. Light palette is retained inside inverse bands. |
| `sections/WorkflowDiagram.astro` | Required `labels`: exactly three short labels, each an array of one or two authored lines; required `description`: equivalent ordered prose explaining the steps and human approval before the final step. Both SVG variants are decorative; the adjacent figcaption supplies the single alternative. No IDs can collide across instances. |
| `sections/WorkflowIllustration.astro` | Required `variant="before-after"`, `"branching"` or `"connected-tools"`; optional equivalent `description` overrides the approved default. Content comes from `src/content/workflow-illustrations.ts`. The diagram is decorative with one adjacent figcaption, no IDs, scripts or tab stops. |
| `sections/ResultPanel.astro` | Required `title`, `body`; optional slot and root-absolute `actions`. Default h1 for standalone results. `inline` supplies a focusable h2 with `data-result-heading`; the caller owns focus after submission. Existing contact pages retain their specialised result behavior. |

Wrap normal page content in `.container.section`; headers and result panels deliberately add no
outer section padding. CTA bands own their container and section padding. Add ordinary headings
and approved content around service rows/process lists. Components never invent page copy.
Related-service cards should read names/links from the service module rather than duplicate them.
The unconfirmed custom-software ownership item is omitted from its typical-work list; the copy
deck's existing Q1 remains the source for that decision.

Responsive rules belong in `src/styles/responsive.template.css`, where the existing generator
substitutes token breakpoints. Component defaults consume custom properties for display/padding
overrides to avoid specificity conflicts with Astro's scoped styles. The diagram switches only
when its own content width reaches the tablet token; a narrow desktop column stays vertical.
SVG geometry uses percentages/em without a scaling viewBox, preserving the small text size at
200% enlargement. Keep label lines short enough for a narrow column and include full meaning
in the description. `WorkflowDiagram` retains its linear workflow and approval checkpoint.

Use `WorkflowIllustration` for the additional motifs required by wireframes §§1 and 3:

- `before-after`: the same shop, spreadsheet and invoice tool in each panel. Three person
  glyphs distinguish manual copying from automatic movement. Home uses the default caption;
  process automation passes `description={processAutomationDescription}` from the content module.
- `branching`: document → AI step, then two separate paths: Clear → Spreadsheet and
  Unclear → Person to check. The unclear path never implies automatic approval.
- `connected-tools`: one custom service with three separate connections to Tool 1, Tool 2
  and Tool 3. Tool numbers identify nodes; they are not a sequence or company claims.

Labels are wrapping HTML at `font.size.small`; original inline SVG connectors and person glyphs
use the existing diagram tokens. The tree stays vertical, including in narrow desktop columns;
comparison panels become two columns only when their own container reaches the tablet token.
At enlarged text that threshold grows with the root size. The visible caption repeats all meaning
for assistive technology and no-JS reading. An override must describe the same illustrated tools
and routes. No page routes, content claims, images or dependencies are added.

## Verification

`npm test` renders the actual components through Astro's container, covering variants, optional
props, empty omission, content ordering, headings and diagram alternatives. `npm run check`
checks Astro props as well as plain TypeScript. The test-only declaration under
`tests/unit/components/` describes compiled component factories to plain `tsc`.

Run `PORT=4412 npm run test:components` for the browser fixture. It builds an isolated artifact
under ignored `.agentops-scratch/components-dist/`, injects `/__components/` only into that build,
and starts/stops one preview through Playwright. No fixture route enters production `dist/`.
Checks cover 320/768/1024/1440 px, axe, sequential keyboard navigation, focus rings, 44 px targets,
both diagram layouts, a narrow diagram column, 200% text, forced colors, reduced motion and
reading without JavaScript. Screenshots are written under `.agentops-scratch/65-components-*.png`.
The regular `npm run test:e2e` continues to exercise the production artifact separately.

Issue #75 extends the same fixture with every illustration in wide and narrow containers.
Unit tests cover comparison content, clear/unclear routing, three service connections, escaped
caption overrides and single text alternatives. Browser checks include wrapping labels at 200%
text and comparison container switching. Illustration screenshots at 320 and 1440 px go to
`.agentops-scratch/75-<variant>-<width>.png`.

Committed visual evidence (320 / 1440 px):
[before/after mobile](evidence/75-before-after-320.png) ·
[desktop](evidence/75-before-after-1440.png),
[branching mobile](evidence/75-branching-320.png) ·
[desktop](evidence/75-branching-1440.png),
[connected tools mobile](evidence/75-connected-tools-320.png) ·
[desktop](evidence/75-connected-tools-1440.png).
