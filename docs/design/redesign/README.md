# Gate 2b — three directions

Issue #80 · UX design exploration · 2026-10-29 · **Awaiting owner selection.**

The [12-site research](research.md) led to three different compositions, all dark first and using the same business copy. These are static, independently openable home-hero + services prototypes, not production pages. Only `docs/design/redesign/` is changed. The production design tokens and pages stay outside this ticket.

| Concept | Open prototype | Distinguishing idea | Reduced-motion evidence |
|---|---|---|---|
| [A — Quiet control](concept-a/README.md) | [index.html](concept-a/index.html) | Precise ledger; descending order route; three-column service list | [Phone](evidence/a-390-reduced.png) · [Desktop](evidence/a-1440-reduced.png) |
| [B — The routing dial](concept-b/README.md) | [index.html](concept-b/index.html) | Human editorial headline; routing instrument; compact paired services | [Phone](evidence/b-390-reduced.png) · [Desktop](evidence/b-1440-reduced.png) |
| [C — Dispatch field](concept-c/README.md) | [index.html](concept-c/index.html) | Large centred opening; perspective light route; alternating service scenes | [Phone](evidence/c-390-reduced.png) · [Desktop](evidence/c-1440-reduced.png) |

## Audience comparison and recommendation

These are design hypotheses against the owner's audience table, not results from user testing. All options place the audit-call CTA before the hero graphic, lead with automation, retain a direct header CTA on a phone, and avoid invented results.

| Visitor / first ten-second question | A | B | C |
|---|---|---|---|
| Small-business owner: saves time, trustworthy, easy start? | Strong: literal handoff, low interpretation cost. Could feel utilitarian. | **Strongest balance:** familiar headline, clearly labelled business tools, personable typography. | Clear CTA and plain copy, but the field may initially look like an enterprise product. |
| Startup founder / CTO: depth, modern engineering, speed? | Precise; restrained effects may undersell technical imagination. | Strong engineering metaphor; enough room for deeper service pages later. | **Strongest first impression:** dramatic, original field with a very small payload. More space before services. |
| Operations / IT manager: risk, security, return on spend? | **Best scanning:** explicit sequence and simple illustrations. | Strong: visible human-check/approval steps alongside service explanations. | Same factual examples; depth treatment adds interpretation. Requires clear example labels. |
| Agency comparison: does this look like a template? | Moderate differentiation from the route, but familiar grid. | Strong: original dial tied to the name, editorial/interface contrast. | **Most distinct:** wide dispatch scene and alternating diagrams; no stock or rendered assets. |

**Recommend B.** It makes automation approachable to small-business buyers while giving founders and operations teams a precise system to inspect. C is a credible stronger alternative if the owner's priority is cinematic presence; A is the calmest option. All three pass the same size and motion policy rather than making speed a tradeoff for boldness. Owner: comment **A, B or C** (and any desired changes) on the Gate 2b PR; the owner merges to approve. This recommendation does not authorise a rebuild.

## Scope, copy and source of truth

`render.mjs` reads `site.config.ts` for the brand and the copy deck for `home.hero`, `home.services`, and the existing service table. Run `node docs/design/redesign/render.mjs` with Node 24 to regenerate all three HTML files deterministically. Brand values are never authored in the templates. Shared CSS and each concept's theme are exploratory tokens, not changes to `docs/design/tokens.json`.

Existing headline, lede, CTA, response line and five service summaries remain verbatim. Diagram explanations, headings used as system labels and interface annotations are DRAFT prototype copy. AI cost optimization is new DRAFT copy; the brief's `[[PLACEHOLDER: owner to confirm the full service list and what "AI cost optimization" includes]]` remains unresolved. Custom software's launch scope and the booking URL remain existing owner questions. No fake project, client, number or saving is introduced. Cost bars are explicitly illustrative, without numeric axes or outcome promises.

The audit-call link lands on a labelled prototype destination. Its disclosure explains that no booking is submitted; no guessed booking URL or form is added. Page titles distinguish concepts; `noindex,nofollow` is intentional for this nonproduction work. No sitemap, structured company claims or production SEO metadata is introduced.

## Motion and interaction contract

One external vanilla controller, one shared IntersectionObserver, zero animation libraries, zero Canvas/WebGL renderers. CSS supplies the finished visual before script execution. The fallback is therefore also the no-WebGL state. These concepts demonstrate ADR-004's B layer; no heavier C-layer renderer is needed.

| Scene | Meaning | Animated property / duration | Static state |
|---|---|---|---|
| A hero | Transfer an order into the invoice tool | translateX / opacity, 1.8 s | Completed handoff and directional connector |
| B hero | Set the direction between tools | rotate, 2.4 s | Vane aligned in the routing dial |
| C hero | Dispatch work toward the next destination | translate / opacity, 2.4 s | Lit route with destination marker |
| Business process automation | Move one order without retyping | translateX / opacity, 1.8 s | Order received by invoice tool |
| AI automation | Extract fields; send unclear input for checking | translateY / opacity, 1.8 s | Both labelled result paths visible |
| AI cost optimization | Compare spend with a test route | scaleY, 1.8 s | Two illustrative bars; no numerical saving |
| Cloud and DevOps | Tests complete before approval | scale / opacity, 1.8 s | Checkmarks plus an approval pause, not colour alone |
| Websites and apps | Assemble content into an enquiry path | translateY / opacity, up to 1.98 s | Complete page structure |
| Custom software | Join tools with an adapter | translateX, 1.8 s | Connected tools |

Scenes play once when entering view and then stop. Replay buttons are native keyboard controls, remain focused during playback, and never imply a real business operation. Escape stops all scenes in their final state. Off-screen and hidden-tab animations pause; they resume only if a sequence is unfinished. No loop, no scroll handler, no continuous frame callback. Motion never exceeds 2.4 s, so a persistent pause toolbar is unnecessary under ADR-004 §6.

Reduced motion, Save-Data and reduced-data preference show the finished composition, hide replay controls and run no animation. The same static presentation remains with JS disabled. All meaningful text stays visible outside the animated SVG; SVG duplicates are hidden from assistive technology. `pagehide` disconnects the observer; a back/forward cache restore reconnects it. The hero consumes **0 bytes** of dedicated renderer JS.

## Shared interaction and responsive details

No form, loading flow or network-dependent interaction is simulated. Links use an underline or filled boundary; hover thickens underlines or changes to the measured hover token. Replay hover uses the accent border and text. Active buttons move down 1 px, without animation. Focus is an opaque 3 px accent ring with 5 px offset on both dark surfaces; forced-colours uses system Highlight. Disabled replay styling is specified at full opacity but is not needed in this prototype. No invented error/success state is shown for the demonstration.

320/390 px start as a single column; 480 px increases gutters from 24 to 32 px; 768 px reveals the extra header service link and introduces each concept's service layout; 1024 px enables A/B split heroes and their final service layouts. Maximum content width is 1280 px. No fixed viewport heights, sticky header, scroll-jacking or horizontal carousel. Targets are at least 44 px. Captions and CTAs wrap; headings use fluid rem-based limits. Per-concept notes describe the differences.

## Verification

See [measurement record](evidence/README.md), [all computed contrast pairs](evidence/contrast.md) and [browser checks](evidence/browser-checks.json). Screenshots are full-page at 390 and 1440 px with reduced motion enabled. Prototypes use only local font files, external local CSS/JS, and original inline SVG. They work when opened directly or served under `style-src 'self'; script-src 'self'` without unsafe-inline.

Run `node docs/design/redesign/serve.mjs`, then open `http://127.0.0.1:4411/redesign/concept-a/` (or `concept-b/`, `concept-c/`). Stop with Ctrl+C. This serves the whole `docs/design/` folder on port 4411 so shared font paths resolve, with gzip and the ADR's strict CSP. Do not serve only an individual concept folder. These documents are review artifacts, not a request to publish a site.
