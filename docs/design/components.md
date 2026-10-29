# Dispatch field components — v2

Issue #86 · Implements the owner's Concept C selection on [PR #85](https://github.com/clockvane/website/pull/85#issuecomment-6507923611). This is the production specification; the selected prototype is a historical snapshot. [Tokens](tokens.json) · [wireframes](wireframes.md) · [motion](motion.md) · [computed contrast](contrast.md). These replace Workshop ledger rules, including its light-only forms and CSS stroke-draw animation.

## Color and focus contract

Dark-first and **dark-only at launch**: canvas `palette.canvas`, opaque panels `palette.panel`. No light theme is offered because the selected direction and its evidence cover dark surfaces; maintaining a second visual system would add unapproved scope. OS light preference keeps this theme; forced colors use system colors. `color.dark.*` supplies every semantic role. Historical `color.light.*` and `color.inverse.*` alias it for existing consumers; they do not create light panels or bright footer bands. Do not mix legacy palette names with semantic roles.

Text/heading = `text`; secondary prose, hints and disabled labels = `muted`; borders/icons/grid = `border`; links, path core, focus and success symbol = `link`/`focus`/`success`; errors = `error`. All fills, labels, outlines and meaningful graphics are opaque. No opacity dimming for disabled controls, translucent panels, or animated text. Never put text, icons, focus rings or controls on glow: clip the decorative halo to a separate route lane, excluding opaque node/label boxes. The route's opaque ice core supplies meaning. `elevation.glow` is static; panel shadows use `elevation.flat`. Canvas/panel contrast does not delineate a control: use the border token.

**F (all controls):** immediate `stroke.focus` (3px) solid `focus` outline, `stroke.focusGap` (5px) offset; the gap exposes the containing canvas or panel. Reserve `space.2` clearance around targets; never clip rings. Use `:focus-visible`, also `:focus` on programmatically focused summaries/results. Outline persists in hover, active and error states. No controls on bright button fills other than that button's own canvas-colored label/icon. Forced colors: Canvas/CanvasText, ButtonFace/ButtonText and Highlight; preserve native inputs and visible borders. Use `layout.anchorOffset` for scroll padding/margins if sticky navigation is enabled; default v2 header is static.

All pairs, including reversed primary label/fill and icon/fill pairs, are enumerated in [contrast.md](contrast.md). Hover/active color swaps are instant: no interpolation through untested pairs. Body text needs 4.5:1; UI/focus/meaningful graphics need 3:1; every specified pair exceeds 4.5:1. Success/error always include text and a distinct symbol, never color alone.

## Interactive primitives

Here and below, roles are `color.dark.*`. Primary labels/icons stay `onAction` in every enabled state. All enabled primitives use F. States are exhaustive; N/A means no such interaction is provided.

| Primitive | Default | Hover | Active / current / open | Disabled | Loading | Error |
|---|---|---|---|---|---|---|
| Primary button / CTA anchor | `action` fill/border, `onAction` text/icon | `actionHover` fill/border | `actionActive` fill/border; no required movement | `disabledFill`, `disabledText`, dashed `border`; native disabled button, no opacity | Same default colors; sending label; `aria-disabled` and duplicate-submit guard, retain focus | Return to enabled default; associated error banner, not red CTA |
| Secondary / replay / disclosure | `surface` fill, `text`, `border` | `link` text/border | `linkActive` text/border; disclosure marker changes direction immediately | `disabledFill`, `disabledText`, dashed `border` | Same default; text status only when an actual async action exists | Associated message; replay falls back to complete static illustration |
| Text link | `link`, underline | `linkHover`, thicker underline | `linkActive`; current nav also `aria-current=page` and persistent underline | No disabled anchors; omit unavailable destination or use plain explanatory text | N/A: native navigation | N/A: destination owns error state |
| Text field / textarea | `surface` fill, `text`, `border`; hint/placeholder `muted` | `text` border | `text` border plus F while focused | `disabledFill`, `disabledText`, dashed `border`; read-only uses solid border | Read-only during send, values selectable | `error` border, error text + symbol; F retained |

Small actions/nav/replay: `size.target` minimum 44×44px, padding `space.2`/`space.4`. Standard controls/buttons: `size.control` 48px minimum height, padding `space.3`/`space.6`; hero CTA `size.largeControl` 56px minimum. Textarea: `size.textarea` 160px minimum, vertical resize. All use `radius.small` 4px and `stroke.border` 1px. Heights are minima; labels wrap. Standalone glyphs use `size.icon` 20px and inherit label color. Mobile CTA full width, from `compactCta` intrinsic and wrapping. Anchors styled as buttons remain anchors; replay/submit remain buttons. Disclosure uses native details/summary, not ARIA menu roles.

## Type and layout

One self-hosted Public Sans variable WOFF2 (existing file, **26,832 B**, OFL), 400 body / 600 headings / 650 display and primary actions; `font-display: swap`, preload that file only. System monospace labels require no font download. Remove the obsolete Newsreader preload/font declaration in #88. Font limit: ≤3 files / 120,000 B; design uses 1 file. Font fallback is Arial/sans-serif, with reflow/CLS checked at implementation.

| Role | Size and weight | Line height / tracking |
|---|---|---|
| Home h1 | Public Sans 650; `clamp(h1Mobile=2.75rem, 6.5vw, heroWide=6.5rem)`; 44px at 320/390, about 50px at 768, 66.56px at 1024, 93.6px at 1440; cap 104px on wider screens | `hero` 1.04 / `trackingRatio.hero` × 1em |
| Inner h1 | 650; `h1Mobile` 2.75rem, `h1Tablet` 3.125rem from tablet, `pageTitle` 3.5rem from desktop | `heading` 1.12 / heading ratio × 1em |
| h2 | 600; `h2Mobile` 2rem, fluid to `h2Desktop` 3.5rem using 3.5vw | `heading` 1.12 / heading ratio × 1em |
| h3 | 600, `h3` 1.375rem | `ui` 1.5 / body tracking 0 |
| Body / labels / controls / SVG labels | 400 / 600 for controls; `body` / `small` 1rem | `body` 1.6 (controls `ui` 1.5) / 0 |
| Lede | 400, `lede` 1.125rem | `body` 1.6 / 0 |
| Optional row numbers/category labels | System monospace, `label` .8125rem; never essential instructions, errors or SVG text | `body` 1.6 / label ratio × 1em |

Retain user root size; semantic heading levels are independent of size. Type ratios are numbers used with `calc(var(...) * 1em)`. No forced line breaks to fit one viewport. Body measure ≤`layout.measure` 65ch; hero copy ≤`heroCopy` 65rem, lede ≤`heroLede` 42rem; form/result ≤35/40rem. At 320px, 200% text and 400% zoom use wrapping actions, `minmax(0,1fr)`, `min-inline-size:0`, and overflow-wrap for URLs. No overflow hiding to conceal reflow failures.

Spacing scale remains quarter-rem-based. Paragraphs and heading→lede `space.4`; list items `space.3`; content→actions `space.6`; form groups `space.6`. Container ≤`layout.content` 80rem. Gutters: `space.6` below 480px, `space.8` above; sections: `space.12` below 768px, `space.20` above. Hero→field gap `space.8`; row padding `space.6` below 1024px / `space.8` above. Cards use `space.6`. Two-column row gap `space.20` when it fits at tablet; collapse to `space.8` if enlarged text needs it. Wide rhythm may use `space.28` only between major chapters. Breakpoints are rem tokens: compactCta 30, tablet 48, desktop 64, wide 90; 320/390 are validation widths, not extra device-specific queries.

## Inventory and accessibility

**Static** below means container hover/focus/active/disabled/loading/error are all N/A. Its interactive children inherit the complete primitive table and F; do not make panels focusable. Minimum target is 44×44px at all widths; give prose/breadcrumb links their own wrapping target line where needed. Each page has a skip link, labelled nav landmarks, main, footer and one h1. No positive tabindex or CSS reordering of focusable controls.

| Component | Size, layout and content | States and accessibility |
|---|---|---|
| Skip link | Primary colors, `space.4` padding; first target, `elevation.skipLink`; links to main with tabindex -1 | Offscreen only until focus; F visible above header; native navigation; disabled/loading/error N/A |
| Header | Static opaque canvas; `layout.header` 5rem minimum, bottom border; config brand. Under desktop: native Menu disclosure; below 480 CTA inside only, 480–1023 compact CTA outside too. Desktop: inline nav + Services link and separate disclosure of six services | Links/disclosures use primitives/F; current underline; in-flow panel, no overlay or animated height. Inactive responsive variant display:none with unique IDs. Native keyboard and no-JS menu; no page-wide Escape listener. Long labels wrap; never cover content |
| Footer | Canvas + border, `space.12` block padding; stacked below desktop, three columns above; `site.footer-line`, Services/Company navs, config contacts/socials | Static; links/F. No CTA duplicate. Omit unset contacts/socials; social icons named. Six services from shared content, no invented availability/status chips |
| Page header | Copy `<page>.intro`; left aligned inner h1/lede; service breadcrumb above; action below with `space.6` gap | Static; breadcrumb nav/ol; current item plain text + aria-current; links/F. No skeleton, reveal or autofocus |
| CTA band | Opaque panel bounded by rules; h2 + sentence + primary, `closing-cta`; single column below desktop, text 8/action 4 columns above | Static; CTA states/F. Overview merges `services.help-choose` into this one band. Omit on contact, result routes, privacy, 404 |
| Service row | Six ruled canvas rows, number/name/summary/for/link plus opaque panel illustration; h3 Home / h2 overview. Stack at 320/390; equal columns from tablet. Copy first in DOM; even row visual sits left only when it is decorative and noninteractive | Static; explicit detail link/F, no stretched row link. Replay stays with copy in DOM/tab order. No status counters or fabricated results. Full breakpoint contract in wireframes |
| Card | Panel fill + border, small radius, `space.6` padding; related service / next steps / engagement model | Static; no hover lift. Only explicit link uses primitives/F. Empty optional card omitted; no generic loading/error skeleton |
| Process / timeline | Semantic ol, numbered h3/text/output; `space.6` gap, border-colored connectors and panel nodes. Home vertical → 2×2 tablet → four columns desktop; How we work remains vertical | Static text; decorative node emphasis per motion.md. Links/F if supplied. Chronology preserved; every output visible with no JS; no made-up timings or progress percentages |
| Workflow / dispatch field | Original SVG perspective field, panel nodes, border paths, ice route, canvas-colored ink on ice chips only; `stroke.diagram` 1.5px, hero ≤58rem. HTML caption and example label; no network imagery | Static diagram baseline; decorative SVG aria-hidden when caption plus accessible HTML description convey all steps. Otherwise role=img with unique title/desc IDs. Labels ≥1rem at rendered size; mobile re-layout, never tiny scaled labels. Replay primitive/F; see motion.md for playing, paused, unavailable and error states |
| Result panel | Panel or canvas with boundary if panel; ≤`layout.result`, h1/body/actions, `space.6` padding. Thanks/error copy from deck; inline success uses h2 under existing h1 | Static page load starts at top. Inline success heading receives F. No loading state for static route; failure is named text + error symbol and recovery link. Never imply saved text after native POST redirect |
| Contact fields / messages | Form ≤`layout.form`; label, hint, input, error in DOM order. Name/reply/message/company order from microcopy; `space.2` label/hint gaps. Next-steps card follows form, never sticky | Field primitives/F; native labels, required/optional words, autocomplete, shared-schema limits; no placeholder-only labels. Disabled fields absent from tab order, read-only selectable. Error IDs appended to hint aria-describedby; aria-invalid only after validation. Honeypot absent from layout, AT and tab order |
| 404 | Full shell, ≤`layout.result`; `errors.404` / microcopy, Home/Services/Contact links, no CTA band, no diagram | Static; link states/F; root-absolute links/assets, noindex; no autofocus, timed redirect or fake search |

## Contact journey states

| State | Presentation and behavior | Focus / announcement |
|---|---|---|
| Initial / filling | Labels and hints visible; no initial validation or skeleton | Natural order; touched-field validation on blur never moves focus |
| Validation failure | Panel error summary, error border/text/icon and list of field links; inline messages; keep values | Focus summary tabindex -1, labelled h2, F, no role=alert; field links focus their inputs |
| Sending | Default primary with “Sending…”; form aria-busy, fields read-only, submit aria-disabled with duplicate-submit guard | Keep focus on submit; one polite live region outside busy form uses microcopy sending message; no spinner |
| Offline / delivery / rate failure | Error banner, preserved values in JS path; reset busy/read-only and retry enabled. Config-only fallback link | Focus labelled banner tabindex -1 with F; no duplicate alert announcement |
| Success | Replace form with deck confirmation; original page h1 retained, result h2; no repeat submit | Focus result h2 with F, no duplicate live announcement |
| No JS / script failure | Native required/length validation and POST to config endpoint; server independently validates, uses thanks/error routes | Browser manages validation/navigation. Native error route explicitly says text was not kept; no promise of retention |

All error/status strings come from [microcopy](../content/microcopy.md); page copy from the [deck](../content/copy-deck.md). Booking/contact destinations and brand values remain config references. No new copy, testimonials, durations, savings or response promises are authored here. Existing unconfirmed copy stays flagged until its owning content ticket resolves it.

## Implementation handoff (#88)

No token path is removed or renamed. Added canonical palette keys, `color.dark.*`, system label family, display weight, hero/label sizes, tracking ratios, hero layout widths, wide breakpoint, border aliases, static glow and motion tokens. All retain types the current generator serializes; borders use separate dimension/color primitives rather than an unsupported composite border type. Legacy palette mirrors: paper→canvas, paperDeep→panel, ink→text, inkSoft→muted, brass→ice, navy→iceHover, brassLight→ice. These remain concrete color objects because the existing OG image reads their hex values directly; the unit check asserts they equal canonical values. Existing error key now contains the dark-safe error color.

Token generation therefore changes current rendered colors and type now, even though #86 edits no source component. This is an intermediate restyle, not the completed C layout. #88 must adopt `color.dark`, set color-scheme:dark, apply display weight/fluid hero sizing, remove Newsreader, change header/layout rules and update SVG node fills/ink roles. Never treat a legacy palette name as its former hue. Keep aliases until all consumers migrate; no runtime theme switch or new JS is needed. Validate all new states in the component gallery, 320/390/768/1024/1440, 200% text, 400% zoom, forced colors, keyboard, axe, no-JS, reduced motion and Save-Data before claiming production v2 complete.
