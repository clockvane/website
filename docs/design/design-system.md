# Workshop ledger design system

Status: proposed Gate 2 input · Owner: ux-designer · Issue #45. Implements Direction A from [visual directions](visual-directions.md); owner selection remains at Gate 2. Scope is tokens and specifications, not the prototype or production components. Dark mode is deferred; the inverse palette is only for local CTA/footer bands.

## Source contract

[tokens.json](tokens.json) uses the [DTCG 2025.10 format](https://www.designtokens.org/tr/2025.10/format/): typed values, sRGB color objects, dimension/duration objects and brace aliases. Root `org.design.audit` extension records permitted contrast pairs and font evidence. Generate external `src/styles/tokens.css` at build time per ADR-001, resolving aliases; convert camelCase paths to kebab-case custom properties (`color.light.actionHover` → `--color-light-action-hover`). Emit breakpoint values into media queries at generation time; CSS variables cannot supply media-query thresholds. This ticket adds no generator or runtime script.

Read [wireframes](wireframes.md) for section order, [copy deck](../content/copy-deck.md) and [microcopy](../content/microcopy.md) for every displayed string. The current CTA label is “Book a free audit call”; older ASCII sketches are not copy. Branding, domain, contact, socials and booking destination are references to `site.config.ts` only. Map copy placeholders through config; omit empty or `isPlaceholder(...)` contact/social values. Booking configuration is a build-ticket input, not a fabricated URL. Do not introduce company claims or proof in diagrams.

## Color, state and focus contract

Use `color.light.*` on Paper or Paper-deep; use `color.inverse.*` on Navy only. Light panels inside inverse bands explicitly reset all roles to light. Forms and error banners only use light panels. Ink is a button active fill, not another page theme. All colors are opaque: no opacity dimming, translucent borders or color mixing, including disabled states. This replaces the illustrative 30% card border in the direction sketch with a fully opaque boundary.

The table is exhaustive for specified text, controls, borders, icons, diagrams and focus. Ratios are symmetric, so a reversed button label/background uses the same row. Required contrast: 4.5:1 normal text; 3:1 large text (24 px or 18.7 px bold), UI and meaningful graphics. Every listed pair passes even the normal-text threshold; no large-text exception is needed. Paper and Paper-deep alone do not delineate controls: always use the border token.

| Pair (palette names and hex) | Ratio | Needed text / UI | Result and uses |
| --- | --- | --- | --- |
| Ink `#1B2433` / Paper `#F6F2EA` | 13.97:1 | 4.5 / 3 | Pass: body, headings; active button label/edge |
| Ink `#1B2433` / Paper-deep `#E9E2D3` | 12.09:1 | 4.5 / 3 | Pass: card/input text; active button edge |
| Ink-soft `#4A5565` / Paper `#F6F2EA` | 6.77:1 | 4.5 / 3 | Pass: muted text, borders, icons |
| Ink-soft `#4A5565` / Paper-deep `#E9E2D3` | 5.86:1 | 4.5 / 3 | Pass: muted/disabled text, borders, icons |
| Brass `#8A4B14` / Paper `#F6F2EA` | 6.07:1 | 4.5 / 3 | Pass: links, primary label/edge, focus, path |
| Brass `#8A4B14` / Paper-deep `#E9E2D3` | 5.26:1 | 4.5 / 3 | Pass: links, primary edge, focus, path |
| Navy `#2D3B52` / Paper `#F6F2EA` | 10.12:1 | 4.5 / 3 | Pass: inverse text; hover button label/edge |
| Navy `#2D3B52` / Paper-deep `#E9E2D3` | 8.76:1 | 4.5 / 3 | Pass: inverse active/disabled label/edge; light hover edge |
| Brass-light `#E8C98F` / Navy `#2D3B52` | 7.09:1 | 4.5 / 3 | Pass: inverse links, button label/edge, focus, borders, icons |
| Error `#8A281F` / Paper `#F6F2EA` | 7.82:1 | 4.5 / 3 | Pass: error text/icon/field border |
| Error `#8A281F` / Paper-deep `#E9E2D3` | 6.77:1 | 4.5 / 3 | Pass: error text/icon/field border |

Focus **F**: every interactive element gets a solid `stroke.focus` outline, `stroke.focusGap` offset, in the containing surface's `color.*.focus`. The gap exposes that surface, so the ring is tested against it, even around a filled button. Apply on `:focus-visible`; programmatically focused summaries, banners and confirmation headings retain the same outline with `:focus`. No clipping/overflow-hidden on targets. Reserve `space.2` around focusable children. In forced colors use system Highlight/CanvasText and retain native control appearance. F is immediate, never animated or removed on hover/error. Use `layout.anchorOffset` scroll-padding on the document and scroll-margin on targets when sticky elements are enabled.

| Primitive and variants | Default | Hover | Active/open/current | Disabled / loading / error |
| --- | --- | --- | --- | --- |
| Primary button or button-link, light | `action` fill, `onAction` label; boundary equals fill | `actionHover` fill | `actionActive` fill; no translation | Disabled: `disabledFill`, `disabledText`, border=`disabledText`, dashed boundary. Loading: same colors, sending label. Error: return to enabled default and show form banner. |
| Primary, inverse | Inverse `action` / `onAction` | Inverse `actionHover` / `onAction` | Inverse `actionActive` / `onAction` | Disabled: inverse `disabledFill` / `disabledText`, dashed border=`disabledText`. Loading retains default. Errors use a separate light panel. |
| Secondary button/disclosure, light | Paper fill, Ink text, Ink-soft border | Paper-deep fill, same text/border | Paper-deep, Ink border; disclosure chevron/open label changes | Disabled as light primary. Loading/error only for an action that actually submits, handled as primary. |
| Text link, light / inverse | Corresponding `link`, always underlined | `linkHover`, underline becomes `stroke.focus` thick | Light `linkHover`; inverse `linkActive`; current page also `aria-current` | No disabled links: omit unavailable action or render explanatory plain text. Loading/error N/A (native navigation). |

All four rows use F in every enabled state. Primary labels stay `onAction` through hover/active. Buttons use `radius.small`, `stroke.border`, UI type, minimum height `size.control` (48 px), horizontal padding `space.6`; large hero variant uses `size.largeControl` (56 px), compact nav variant `size.target` (44 px) and `space.4`. Heights are minima, labels wrap. M primary CTAs fill available width; T/D are intrinsic. Links styled as buttons remain anchors; submit remains a button. Native disabled controls leave the tab order; asynchronous submit uses `aria-disabled` plus duplicate-submit guarding to preserve focus until the result. Never rely on `aria-disabled` alone to block activation.

## Type and layout

All type uses rem units and zero tracking (`font.tracking`); retain the user's root font size. The approximate 1.25 scale is rounded for readable sizes. Heading styles do not determine semantic level. Font weights are only regular (400) and semibold (600); no added italics or synthetic faces.

| Role | Family / weight | M size | T size | D size | Unitless line height |
| --- | --- | --- | --- | --- | --- |
| h1 | heading / regular | `h1Mobile` 2.5rem | `h1Tablet` 3rem | `h1Desktop` 3.5rem | heading 1.15 |
| h2 | heading / regular | `h2Mobile` 2rem | same | `h2Desktop` 2.5rem | heading 1.15 |
| h3 | heading / regular | `h3` 1.5rem | same | same | heading 1.15 |
| Body / lists | body / regular | `body` 1.125rem | same | same | body 1.6 |
| Lede | body / regular | `lede` 1.25rem | same | same | body 1.6 |
| Labels, nav, buttons | body / semibold | `small` 1rem | same | same | ui 1.5 |
| Hints, captions, footer | body / regular | `small` 1rem | same | same | body 1.6 |

Space tokens are quarter-rem multiples: 0, 1, 2, 3, 4, 6, 8, 10, 12, 14, 18, 24. Standard rhythm: heading→lede `space.4`, paragraph→paragraph `space.4`, content→actions `space.6`, list items `space.3`, grouped controls `space.2`. Boundaries use `stroke.border`, diagram strokes `stroke.diagram`; all corners `radius.small`, bands square. `elevation.flat` has zero shadow geometry: separation comes from borders, not shadows.

| Layout | M: below `tablet` (768 px) | T: 768–1023 px | D: `desktop` (1024 px) and above |
| --- | --- | --- | --- |
| Container / grid | 1 column, `space.4` side gutters, `space.6` gap | 8 columns, `space.6` gutters/gap | 12 columns, `space.8` gutters, `space.6` gap; inner max `layout.content` (1200 px) |
| Section padding | `space.14` (56 px) vertically | `space.18` (72 px) | `space.24` (96 px) |
| Hero | Text, actions, diagram in DOM order | Stacked; diagram 60% wide, centered | Text 8 columns, diagram 4 |
| Service overview/detail | Heading then body; stacked | Same | Heading 3 columns / body 9; overview summary and work list each 6 |
| Contact | Single column; panel below form | Max `layout.form` (560 px) | Form 7 columns, 1 empty, side panel 4 |
| Home process / engagement | Vertical list | Home: 2×2; engagement stays vertical | Home: four columns; engagement step 8 / output 4 |
| About / footer | Stacked in DOM order | Same | About text 7 / optional photo 5; footer three equal columns |

Pixel equivalents assume a 16 px root. Media queries use the token rem values. At 320 px and 200% zoom nothing clips or scrolls horizontally: use `minmax(0, 1fr)`, `min-inline-size: 0`, wrapping text/URLs and wrapping action rows. Reading measure is `layout.measure` (65ch); form/result widths are capped at 100% of the available space. No CSS visual reordering. Portraits preserve supplied aspect ratio; use explicit width/height, responsive sizing and meaningful alt. Empty portrait collapses its column.

### Font delivery budget

Pinned audit sources: npm `@fontsource-variable/newsreader@5.3.0` and `@fontsource-variable/public-sans@5.3.0`. `npm pack <package>@5.3.0 --dry-run --json` reports the following actual archive-entry WOFF2 sizes, not estimates. These are acquisition sources for self-hosting, not runtime CDN requests or new dependencies in this ticket.

| Family / selected roman Latin file | Bytes | Delivery |
| --- | --- | --- |
| Newsreader: `files/newsreader-latin-wght-normal.woff2` | 58,084 | Weight-only variable; no optical-size axis. Heading face, no preload. |
| Public Sans: `files/public-sans-latin-wght-normal.woff2` | 26,832 | Weight variable; body/UI, the only preload. |
| Total | **84,916** | **2 families / 2 files / 84.916 kB** ≤ P-6's 2 / 4 / 100 kB; 15,084 bytes headroom. |

The Newsreader `standard`/`opsz` Latin roman file is 132,000 bytes alone and is excluded. Copy only the two chosen files and their OFL licences to the build's self-hosted font assets; do not import package CSS that loads other subsets/styles. Both use `font-display: swap`, normal style and only the supported weight range; request 400/600. Set `font-optical-sizing: none`, `font-synthesis: none`; fall back to the token stacks if loading fails. At implementation, measure fallback metrics for size/ascent/descent overrides (do not invent percentages), test CLS ≤ 0.05 and recount `dist/fonts/*.woff2` bytes in CI. Missing glyphs use the system fallback; adding another subset must re-pass P-6. No third-party font requests. This specification ships zero font bytes or client code.

## Component inventory and wireframe trace

Every interactive child inherits its primitive's full state table and F; parent panels/sections are not focusable. In the table, **static** means hover, focus, active, disabled, loading and error are all N/A for the container; listed links/controls still inherit their states. This avoids adding tab stops to decorative cards or diagrams. All targets are ≥ `size.target` (44×44 px) at every breakpoint, including breadcrumb and prose links: use wrapping inline-block targets with minimum dimensions, or put the link on its own line (for example the privacy-note link). Keep one h1, correct heading levels and labelled navigation landmarks.

| Component / wireframe coverage | Variants, size and behavior | States and accessibility |
| --- | --- | --- |
| Skip link / all pages | Paper-filled secondary link, `space.4` padding; first item, targets `main[tabindex=-1]`; layer `elevation.skipLink` | Hidden offscreen until focused; F, remains above header. Native link behavior; disabled/loading/error N/A. |
| Header / §0 | Light, `layout.header` minimum height. Logo text from config. M/T native `details/summary` Menu; service children nested in list. Below `compactCta` (480 px) CTA inside menu only; 480–1023 also show compact external CTA. D full nav + Services overview link and separate labelled disclosure. | Summary uses secondary states/F; chevron and label indicate open; no ARIA menu roles or manual `aria-expanded`. Nav links use link states/F and current underline. No loading; unavailable destinations omitted. Native Enter/Space, no JS/Escape enhancement. Distinct responsive nav variants must use `display:none` on the inactive one and unique IDs. |
| Header disclosure / §0 | Paper panel, Ink-soft border, `space.4` padding; opens in flow rather than overlaying page content. D header sticky only with closed disclosures and viewport height ≥ `layout.stickyMinHeight`; open disclosures make header static via `:has(details[open])`. Layer `elevation.header`. | Links never hidden while focused. At enlarged text/zoom or wrapped nav, use static header if it exceeds the reserved `layout.anchorOffset`; verify at build. Retain all links without JS. No animation of height; F never obscured. |
| Footer / §0 | Navy, inverse roles, `space.12` padding; config brand + `site.footer-line`, Services/Company nav groups, privacy and configured contact/social links | Static; children use inverse link states/F. Group headings h2 with UI styling. Empty contact/socials vanish, no empty icons/links. Icon-only social link gets an accessible name. |
| Closing CTA / §0, pages 1–5 | Navy band, section padding; h2 + sentence + inverse primary; M stacked/full width, T stacked, D text 8 / action 4 columns | Static; button-link states/F. `closing-cta`, or `services.help-choose` as a single merged band on overview. Omit on Contact, Thanks, Error, Privacy and 404. |
| Page header / §§2–10 | h1 + lede within measure; breadcrumb on service detail; `space.6` gap to action | Static; breadcrumb is labelled nav/ol, separators decorative, last item plain text with `aria-current=page`; links/F. `*.intro` copy. |
| Service rows / §§1–3 | Home: five ruled rows, h3 + summary + link; overview: five h2 rows with work list. `space.8` padding, Ink-soft rules; not a grid of icon cards | Static; only explicit links interactive/F. Never stretch invisible links across body copy. Service names/order from shared content; no local duplicates. |
| Cards / related items, contact next steps | Light Paper-deep panel, opaque Ink-soft border, `radius.small`, `space.6` padding (`space.8` D); title, body, explicit link if any | Static; no fake hover lift/clickability. Child link states/F. Empty optional card omitted. Read-only next-steps card has no tab stop; no generic card loading/error. |
| Chores, deliverables, needs, expertise, pricing / §§1–5 | Plain ul or prose with body rhythm; label column on D service detail, `space.3` list gap | Static; no icons substituting for words. Copy keys `home.chores`, `services.<slug>.*`, `how.models/pricing/handover`, `about.expertise`. |
| Process/timeline / §§1,3,4,7 | ol; number + h3 + sentence/output; `space.6` gaps, Ink-soft connector, Paper node fill; layout table above | Static; preserve chronological DOM order, connectors decorative, numbers not color-only. `home.process`, service process, `how.steps`, `contact.thanks`. No invented durations. |
| FAQ and privacy contents / §§4,9 | FAQ as visible h3/question + paragraph (no accordion); privacy anchor nav in flow, 65ch reading measure | Static FAQ. Contents links/F, visible current location if provided. D contents may be sticky only when short enough to fit below header; otherwise static. No JS tracking/loading. |
| About teaser, portrait, proof / §§1,5,11 | `home.about`, `about.who`, `home.proof`/`about.proof`; supplied facts only; proof list empty means render nothing, including heading | Static; explicit links/F. Omit absent bio/portrait, collapse space. Image load reserves aspect ratio; failure keeps alt and dimensions. No spinner, fake logos, empty-proof message or skeleton. |
| Workflow diagram / §§1,3 | Original inline SVG: rounded node, orthogonal arrow, circular human checkpoint, ticks, labels. Paper/Paper-deep fill, Ink outline/labels, Brass path, `stroke.diagram`; `size.icon` for standalone glyphs | Static; no focus/hover tooltips. SVG `role=img`, unique title/desc IDs describing the workflow; or `aria-hidden=true` if adjacent text is equivalent. Decorative icons hidden. Labels ≥ `font.size.small`; meaning repeated in adjacent ordered prose. |
| Diagram responsive variant / §§1,3 | M vertical pipeline; T/D horizontal only if labels fit at full size, otherwise retain vertical. Never shrink labels to squeeze into a viewBox | Use only one exposed text alternative; hide unused variant from rendering/AT. Classes and external CSS only, no inline styles or SVG style tags. No embedded raster/fonts, fake case studies or measured savings. |
| Result panel / §§7,8,10 | Paper, max `layout.result` (640 px), h1, body and actions; 404 links to Home/Services/Contact; no CTA band | Static page load starts at top. Root-absolute links/assets work at nested 404 URLs. Thanks/Error/404 noindex. Inline success uses h2, F after submission; error behavior below. |

## Contact controls and end-to-end states

Form styling is light-only. Keep visible labels above fields, `space.2` label/hint gaps and `space.6` between groups. Inputs/textarea use Paper, Ink text, Ink-soft `stroke.border`, `radius.small`, `space.3` padding; minimum height `size.control`, textarea `size.textarea` with vertical resize. UI labels are semibold; entered text uses body type. Required/optional status is written, never indicated solely by color. No placeholder replaces a label. Side panel uses the card contract, follows form in DOM order and stays static (focus safety); the D sticky suggestion in the wireframe is intentionally not used for this panel.

| Control/state | Visual and behavior | Focus/announcement |
| --- | --- | --- |
| Name / reply / company / message | `contact.form` labels and hints. Name `autocomplete=name`, company `organization`; message textarea. Reply remains text for email-or-phone until Q4 is resolved; if email-only use email type/autocomplete. Length rules come from the shared schema, never design constants. | Explicit label-for/id; hints referenced with `aria-describedby`. Native required/minlength/maxlength where appropriate; no validation error on initial load. |
| Hover / active / focus | Hover/active field border Ink; fill stays Paper; focus F outside boundary. No movement or fill animation. | Preserve F on invalid/read-only fields; keyboard and pointer input use same values. |
| Invalid | Error border + visible error text and icon; retain entered values; light background unchanged | `aria-invalid=true`, error ID appended to hint IDs in `aria-describedby`. Errors named in text. Touched-field feedback on blur; do not move focus on blur. |
| Disabled / read-only | Paper-deep fill, Ink-soft text/border; disabled dashed border; read-only solid border and associated sending status | Native disabled only when intentionally unavailable, omitted from tab order. During sending, fields read-only and still selectable; no opacity reduction. |
| Honeypot | Removed from layout, assistive tree and keyboard path; no visible field/gap | Hidden, `aria-hidden=true`, `tabindex=-1`; never error-focus it. |
| Initial / filling | Empty fields + privacy note from copy, no skeleton; submit primary | Natural DOM/tab order. Optional character count near schema limit is form-enhancement only; no extra script. |
| Validation failure (JS) | Summary above form, Error border/text on Paper, `space.6` padding, h2 and list of field links | Summary `tabindex=-1`, labelled by heading, focused with F; no `role=alert` to avoid duplicate speech. Links focus invalid fields. Inline error associations remain. |
| Sending (JS) | Submit “Sending…” uses default colors, `aria-disabled=true`; block repeat submit; fields read-only | `aria-busy=true` on form; keep focus on submit until result. Separate polite live region outside busy form says “Sending your message.” No spinner required. |
| Delivery/offline/rate failure (JS) | Light Error banner above form; use matching microcopy, preserve values; reset busy/read-only/disabled, allow retry | Focus banner (`tabindex=-1`, F, labelled heading); no alert role. Fallback link only from configured contact; no contact means no fallback clause. |
| Success (JS) | Replace form with `contact.thanks`/microcopy confirmation; original page h1 remains, result h2; no repeat submit | Focus result h2 with F, `tabindex=-1`; do not also announce via live region. |
| No JS | Native validation and POST to config endpoint; server validates independently; success/failure pages per architecture | Browser-managed native validation; success redirect `/contact/thanks/`, failure route `/contact/error/` when applicable. Failure copy explicitly says text was not kept; never promise retention across navigation. |

All status copy comes from microcopy, including offline/rate-limit cases; no HTTP codes shown to visitors. A booking link uses primary anchor styling, normal same-tab navigation and a config destination; no iframe, scheduler embed or additional script. Form destination, booking availability and reply-field policy remain existing Q4/build inputs. No new product decisions are made here.

## Motion and implementation verification

Default diagram CSS shows the completed path and all labels. Optional connector draw is CSS-only, `motion.diagram` (600 ms), once, with authored SVG `pathLength` and `stroke-dashoffset` on a class. Put the start offset only in keyframes, never base styles. Scroll-driven use requires `@supports (animation-timeline: view())` and `prefers-reduced-motion: no-preference`; backwards fill may apply only inside that branch. Unsupported browsers show the finished diagram. No observer, scroll listener, animation library, loop, parallax or opacity reveal. Under reduced motion set animation/transition to none, finished stroke offsets and auto scroll behavior explicitly.

Hover feedback is immediate color/underline change. The optional 240 ms `motion.interaction` / `motion.easeOut` transition may change underline thickness only; never interpolate foreground/background independently through untested color pairs, animate focus or shift layout. Static content remains fully readable without CSS animation or JavaScript. Only ADR-001's approved scripts may ship.

Design evidence: contrast computed with `.agentops-scratch/contrast.mjs`; opaque palette makes alpha flattening unnecessary. Recompute from token values when changed. Build acceptance: keyboard/no-JS navigation and form journeys; 320 px, 768 px, 1024 px, wide desktop and 200% zoom; all states in the table, including inverse focus and disabled controls; forced colors/reduced motion; axe plus manual focus/diagram checks; local font bytes/CLS and NFR CSS/JS/page budgets. This documentation does not claim rendered UI or Lighthouse results; those belong to the prototype/build tickets.
