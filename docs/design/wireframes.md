# Dispatch field wireframes — v2

Issue #86 · Concept C selected on PR #85. Replaces the Gate 2 Workshop ledger layouts. Normative companions: [components](components.md), [tokens](tokens.json), [motion](motion.md). Copy keys below refer to the current [copy deck](../content/copy-deck.md); exact text is maintained there, never invented in diagrams.

## Shared frame and breakpoint behavior

Every page: skip link → header → main (one h1) → optional closing CTA → footer. Main and tab order follow that sequence. Header is static/in-flow. Menu and Services disclosures work without JS; desktop nav starts at 1024px to fit six-service navigation. The brand and destinations come from site config.

| Viewport at 16px root | Container / gutters | Header and actions | Main layout |
|---|---|---|---|
| 320px | 272px / 24px each | Menu; audit CTA inside menu. Hero primary full width then secondary link; labels wrap | One column; 48px section padding; never crop the dispatch story |
| 390px | 342px / 24px each | Same; no extra device breakpoint | Same, additional width goes to readable copy/diagram |
| 768px | 704px / 32px each | Menu + compact visible audit CTA (from 480px); action rows wrap, intrinsic buttons | 8-column grid; 80px sections; service copy/illustration equal columns |
| 1024px | 960px / 32px each | Full nav + Services disclosure + audit CTA; no sticky overlay | 12-column grid; 80px sections; inner headers left aligned |
| 1440px | 1280px maximum / centered (80px effective each) | Same; no new navigation behavior | 12 columns; hero diagram capped at 928px; body still ≤65ch |

Breakpoints use rem: 480/768/1024/1440px equivalent. At enlarged text, allow components to stack earlier rather than clip. Root size unchanged; 200% text and 400% zoom reflow to the narrow arrangement. All links/buttons ≥44×44px, no horizontal page scroll. Caption and diagram labels are ≥16px rendered: small screens get compact geometry/vertical lanes, not a uniformly shrunk wide SVG. Service row art may change visual side only if noninteractive; replay remains with copy so focus order never zigzags independently of reading order.

## Home `/`

Goal: immediately understand the repetitive work we remove, see an illustrative workflow, reach the free audit call. Centre the promise above the field at **every width**, not the old split hero.

```text
Header
                    h1: home.hero
                    lede + supporting line
                    [primary audit CTA] [secondary services link]
             Order to invoice | Example workflow
                  Shop → Spreadsheet → Invoice tool
                 caption + complete text alternative
                        [Replay workflow]
h2: home.services + intro
01 copy + explicit detail link + replay    | workflow illustration
02 workflow illustration                  | copy + detail link + replay
03–06 repeat (mobile: copy then illustration every time)
h2: home.process → Talk / Scope / Build / Hand over → how-we-work link
closing-cta → Footer
```

| Order / hierarchy | Copy block and section content | Actions / conditions |
|---|---|---|
| 1 / h1 | `home.hero`: “We automate the boring work in your business”, lede, supporting line; no exploration eyebrow | Primary “Book a free audit call” to config destination; secondary “See what we do” to Services. Both before illustration |
| 2 / figure | `home.field`: example tag, Shop/Spreadsheet/Invoice tool, caption and accessible description; full-width perspective field with bounded luminous lane | Replay button after caption, exposed only with allowed enhancement; no invented dashboard metrics |
| 3 / h2, six h3 | `home.services`: intro, number/group, service name, summary and `for` line from §0, example caption/alternative from §3.7 | Explicit detail link + service-specific replay in copy column. Six services in deck order below |
| 4 / h2, four h3 | `home.process`: Talk / Scope / Build / Hand over, each with sentence | **Include** this optional band: gives operations buyers the working method after capability examples. Link to How we work |
| 5 / conditional h2 | `home.about`, only once Q6 roles/consent supplied | Omit whole section until supplied; no empty founder panel. `home.proof` remains omitted at launch per Q5 |
| 6 / h2 | `closing-cta`, sentence and primary | One repeat audit CTA after the service/process content; then footer |

| Width | Hero and field | Six service rows | Process and closing band |
|---|---|---|---|
| 320 | h1 44px, centred, natural wrapping; CTA before compact vertical/stepped field; no perspective detail required to decode route | Copy → actions → illustration/caption; one ruled row at a time, 24px padding. Nodes simplified, labels full-size | Vertical numbered ol; CTA full width |
| 390 | Same h1 and order, roomier node lane; no fixed hero height | Same single-column rows; every caption fully visible | Same |
| 768 | Fluid h1 ≈50px; centred lede ≤42rem; wide field when labels fit, otherwise compact | Equal copy/illustration columns, gap up to 80px; even rows art left. One row per service, never 2×3 cards | Process 2×2 in chronological row order; closing text/action stacked |
| 1024 | Fluid h1 ≈66.6px; copy ≤65rem, field ≤58rem | Equal columns with 32px row padding, alternating art; all controls stay beside copy | Four process columns; closing text 8/action 4 columns |
| 1440 | Fluid h1 ≈93.6px (104px cap beyond this); diagram remains 928px, not full 1280px | Same; extra width is whitespace, not more services per row | Same; no sticky/pinned chapter |

Focus order within main: hero primary → secondary → hero replay if available → each service detail link and replay → process link → conditional about link → closing CTA. Illustrations do not enter tab order. At 320px the full headline may occupy several lines; do not shrink it below 44px to force the illustration above the fold.

## Services overview `/services/`

One h1/lede from `services.intro`, then labelled “Services” anchor nav listing all six at every width; wrap to a vertical list on mobile. No duplicate home dispatch hero. Six ruled sections use h2 service names; within each: summary → `for` → “how the work runs” → typical-work list → detail link/replay → illustration/caption (side-by-side at tablet). Copy = `services.<slug>.summary`, diagrams/alternatives = §3.7. Do not turn the list into icon cards or label the illustrations as live systems.

| Width | Header / jump nav | Row layout | Closing |
|---|---|---|---|
| 320 | 44px left-aligned h1; lede; six stacked anchor targets | Single column, 24px row padding; h2, problem, audience, workflow sentence, list, link/replay, compact figure | `services.help-choose` supplies one CTA band; full-width button |
| 390 | Same, wrapping labels never truncate | Same | Same |
| 768 | 50px inner h1; jump links wrap in flow | Equal copy/figure columns, alternating decorative art; text column contains the complete typical-work list | One stacked band |
| 1024 | 56px inner h1; jump nav remains in flow | Same, 32px row padding; no sticky index obscuring targets | Text 8/action 4 columns |
| 1440 | 56px h1; 1280px container | Same; cap prose at 65ch | Same |

Heading outline: h1 → six h2 service headings → h2 help-choose. No duplicate closing band. Focus: jump links → each detail link/replay → primary closing CTA. Anchor sections use scroll margin; headings are programmatic targets if needed, not extra tab stops.

## Service detail template `/services/<slug>/`

All six share one template (FR-6). Slugs/order: **process-automation → ai-automation → ai-cost-optimization → cloud-devops → websites-and-apps → custom-software**. Related links come from shared content/config, never from a locally duplicated menu.

| Order / hierarchy | Copy block | Placement and action |
|---|---|---|
| 1 / breadcrumb, h1 | `services.<slug>.intro` + service name | Home → Services → current plain-text item; lede + primary audit CTA |
| 2 / figure | `services.<slug>.animation`, caption/alternative from §3.7 | One service sequence, after CTA, never competing with headline; replay after caption |
| 3 / h2 | `services.<slug>.what` (“What we do”) | Prose; do not repeat the same illustration here |
| 4 / h2 | `services.<slug>.for` (“Who it is for”) | Audience situation, not an invented client proof panel |
| 5 / h2 | `services.<slug>.deliverables` (“Typical deliverables”) | Plain list, no unconfirmed schedule badges |
| 6 / h2 | `services.<slug>.process` (“How an engagement runs”) | Ordered steps; no fabricated durations |
| 7 / h2 | `services.<slug>.needs` (“What we need from you”) | Plain list |
| 8 / h2 | `services.related` | Two explicit sibling links; card variant allowed, no whole-card invisible link |
| 9 / h2 | `closing-cta` | Primary audit CTA, then footer |

| Width | Intro / diagram | Information sections / related |
|---|---|---|
| 320 | Left-aligned 44px h1; full-width CTA then compact vertical illustration with full-size labels | One column, h2 then text/list, 24px gutters; related stacked |
| 390 | Same order and type, no fixed-height figure | Same |
| 768 | 50px h1; intrinsic CTA; full-width figure capped by available 704px | Still stacked headings/content; related two columns if labels fit |
| 1024 | 56px h1, lede ≤65ch; figure ≤928px below intro | Heading 3 / content 9 columns; process stays chronological; related two columns |
| 1440 | Same, illustration centred at max width | Same 3/9 ratio, prose ≤65ch; related two columns |

Focus: breadcrumb links → hero CTA → replay if available → related links → closing CTA. Page is complete without animation. Structured data: Service + BreadcrumbList. Q13 AI cost scope/deliverables remain unconfirmed; preserve deck placeholders and example-method qualification (including the static comparison) without publishing numerical or implied guaranteed savings. Q14 final six-service list also remains open; one shared service source must update home/overview/detail/nav/footer together when resolved. No new product decision is introduced here.

## Existing pages: migration table for #88

These are restyles of existing journeys, not new copy or routes. All use the shared five-width frame above; below 768 single-column, 768–1023 still content-first, 1024/1440 use the arrangements listed. Static panels use components.md states.

| Page | Changes from Workshop ledger | Retained structure / copy / behavior |
|---|---|---|
| How we work | Dark canvas; opaque output panels; Public Sans headings; 320/390/768 vertical timeline, 1024/1440 step 8/output 4 columns. Optional one-shot decorative marker emphasis, never pinned content | `how.intro/steps/models/pricing/handover`; semantic ol, engagement/pricing/handover sections, closing CTA. Every output visible without JS |
| About | Dark canvas and ruled sections; all widths single measure without a supplied portrait; 1024/1440 text 7/portrait 5 only when image exists | `about.intro/who/expertise/name/proof`; owner-supplied facts only, absent proof/photo omitted, closing CTA |
| Contact | Dark fields/messages and next-steps panel; 320/390 full width, 768 form ≤560px, 1024/1440 form 7/one gap/panel 4 columns. Panel static, never sticky | `contact.intro/form/next-steps/privacy-note/fallback`; existing native POST/enhancement, field order and validation/focus; no closing CTA. Thanks/error use dark result panel ≤640px at all widths |
| Privacy | Dark readable prose ≤65ch, 320/390/768 contents in flow; 1024/1440 contents may sit beside prose but remain static | `legal.privacy`; h1/date/contents/h2 sections, visible links, no motion or CTA band; legal placeholders unchanged |
| 404 | Dark result panel ≤640px, left-aligned inner h1, full shell and visible recovery links at every width | `errors.404`/microcopy; root-absolute links/assets, noindex, Home/Services/Contact, no CTA band, no auto-focus |

## Build acceptance

Check all five widths plus 200% text/400% zoom, keyboard skip/menu/replay/form/result flows, AA contrast and forced colors. Reduced-motion, Save-Data, no-JS and no-WebGL must show finished illustrations and usable content. Compare the selected [390px](redesign/evidence/c-390-reduced.png) / [1440px](redesign/evidence/c-1440-reduced.png) snapshots for direction, but use this document for production content order and readable label sizes. Footer, contact states, error messages and focus behavior are fully specified in components.md. No screenshots in #86 claim that the still-unbuilt production layouts are complete.
