# Home-page prototype · Gate 2

Open **index.html** directly in a browser. Keep its `fonts/` directory alongside it.
No server, network, framework or browser JavaScript is needed. The template is a
source file, not the preview. This is design evidence for #46, not production UI.

The proposed **Workshop ledger** direction uses warm paper, Newsreader headings,
Public Sans body text, brass actions and a navy closing band. A quiet before/after
diagram introduces the work; plain chores, five ruled service rows and a numbered
process follow. There are no photos, invented proof or decorative animation.

## Review the interaction

- At **375 px**, the hero stacks text, actions and diagram; the main action fills
  the width. Menu opens in flow and contains the header CTA.
- At **480 px**, a compact header CTA also appears. At **768 px**, the diagram
  uses 60% width and the process becomes a 2 × 2 grid.
- At **1280 px** (desktop starts at 1024 px), hero and closing band use 8:4
  columns, process uses four columns, and footer uses three. The header is sticky
  only with closed disclosures and a viewport at least 768 px tall.
  A container query also makes it static when enlarged root text would wrap the
  desktop header beyond its reserved focus clearance; unsupported browsers stay static.
- Tab from the skip link through navigation, hero actions, services, process,
  closing CTA and footer. Use Enter/Space on native Menu/Services disclosures;
  the browser owns their behaviour. Focus outlines are immediate and visible.
  Skip/service jumps focus the landmark and outline its heading, keeping the
  indicator on screen rather than around the full-width page boundary.
- “See what we do” and Services jump to the home service list. Links that would
  leave Home reveal a **DRAFT destination note** after the footer, with its intended
  route and a return link. These notes are prototype annotations, not other pages,
  booking confirmations or working contact forms. No dead URLs or external requests.
- Check **320 px**, **200% zoom**, reduced motion and forced colors too. The diagram
  uses HTML labels at the token text size and original inline SVG connectors and
  human symbols; its caption is the single exposed text alternative. Neither
  diagram labels nor page content shrink with an SVG viewBox.

## Sources and regeneration

Layout/state contracts: [wireframes](../wireframes.md),
[design system](../design-system.md), [tokens](../tokens.json).
Page text: [copy deck](../../content/copy-deck.md) blocks `home.hero`, `home.chores`,
`home.services`, `home.process`, `closing-cta`, `site.footer-line`; navigation and
skip-link text also follow [microcopy](../../content/microcopy.md).

`index.template.html` owns the home layout and copy slots. `render.mjs` reads all
CSS values and media thresholds from tokens, service names/order/descriptions from
the shared copy table, and branding from **site.config.ts**. `index.html` is its
committed, offline output; brand literals there are generated, not another config.
Do not edit generated HTML. To refresh with the repo's Node 24 toolchain:

```sh
npm ci
node docs/design/prototype/render.mjs
```

Regeneration uses the existing project dependencies to load the typed config;
viewing the result requires none. Inline CSS is confined to this offline artifact;
production still requires external CSS under ADR-001's CSP. No production files,
token definitions, architecture or governance change here.

Font assets are the two roman Latin weight-only WOFF2 files from
`@fontsource-variable/newsreader@5.3.0` (58,084 bytes) and
`@fontsource-variable/public-sans@5.3.0` (26,832 bytes): **84,916 bytes total**.
Both are self-hosted under SIL OFL 1.1; the notices are in `fonts/`. Only Public
Sans is preloaded. Both use swap and token fallbacks; no optical-size font is loaded.

## Open content

The deck remains a Gate 2 draft. Existing placeholders remain visible for example
chores, the fifth service, audit length and legal identity. Founder roles/consent
are pending, so the entire about teaser is omitted. Empty proof, contact and social
data produce no sections or links. Destination notes retain the existing Q4 booking
and Q9 legal-review gaps. No company claims or owner decisions are added here.

Dark mode remains deferred; the navy band is a local inverse surface. Native link
navigation has no loading/disabled/error states. No animation or transitions are
needed; reduced-motion users receive the same completed diagram.

## Verification evidence

The [320 px mobile](screenshots/home-320.png) and
[1280 px desktop](screenshots/home-1280.png) screenshots show the default view.
Local Chromium verification also covered 375, 480, 768 and 1024 px: no horizontal
overflow, local fonts loaded, and all visible controls at least 44 × 44 px. Axe
reported zero WCAG A/AA violations at 375/1280 px, with disclosures closed and open.
Keyboard focus/order, every fragment destination, 200% text enlargement, a 640 × 450
zoom-equivalent viewport, forced colors, reduced motion and JavaScript-disabled
navigation passed. These are prototype checks, not a production accessibility audit.

The HTML validator and project lint, type checks, unit tests (3/3) and build passed.
Computed token contrast: minimum **5.26:1**, including light/inverse interactive
states, boundaries, focus and meaningful SVG strokes. All colors are opaque.
The offline document makes **zero external requests** and ships **zero JS bytes**;
local WOFF2 assets total 84,916 bytes. The final measured gzip sizes are recorded in
the PR. Production Lighthouse/CLS and cross-browser acceptance remain build/release
checks; no Lighthouse score is claimed for a file-system prototype.
