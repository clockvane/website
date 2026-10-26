# Wireframes (MVP pages)

Status: draft for Gate 2 · Owner: UX/UI Designer · Ticket: #22
Inputs: `sitemap.md`, `user-flows.md`, `docs/product/PRD.md`, `docs/content/voice-and-tone.md`.
Low fidelity only: structure, order, content slots and CTAs. No colour, type or token decisions (see `direction.md`, `tokens.json`, later tickets). The copy deck does not exist yet, so slots name the copy-deck block that will fill them (`copy: home.hero`) and any wording shown is a label, not final copy.
`[[PLACEHOLDER: ...]]` marks content the owner must supply (PRD section 12).

## Conventions

**Breakpoints (mobile first):** M = below 768 px (single column), T = 768 to 1023 px, D = 1024 px and up (max content width 1200 px, 12 columns). Only differences from M are described per page.

**Legend:** `[ Button ]` primary action · `< link >` text link · `[ ___ ]` input · `(h1)`..`(h3)` heading level · `#n` tab order within the page main landmark.

**Page skeleton (all pages):**
1. Skip link "Skip to main content" (first focusable element, visible on focus).
2. `header` landmark: logo, nav, CTA button.
3. `main` (one `h1` per page).
4. Closing CTA band (content pages only, see sitemap).
5. `footer` landmark.

**Global rules**
- Heading order never skips a level. Section headings are `h2`, items inside are `h3`.
- Focus order follows DOM order, which follows visual order. No positive `tabindex`. Wide layouts reorder only with CSS grid placement that keeps reading order identical to DOM order.
- Every interactive target is at least 44 x 44 px on M.
- Primary CTA label is always "Start a conversation" (Contact submit: "Submit enquiry").
- Diagrams (workflow illustrations) are inline SVG with `role="img"` and a text alternative, or marked decorative with `aria-hidden="true"` when the text beside them says the same thing. Inline SVGs count towards the P-8 page weight: keep them simple, with no embedded raster and no fonts inside the SVG.

## 0. Shared components

### Header
```
M (closed)                     M (menu open)                 D
+----------------------------+ +---------------------------+ +-----------------------------------------------------+
| Clockvane          [ Menu ]| | Clockvane        [ Close ]| | Clockvane  Services  How we work  About  [Start a   |
+----------------------------+ | Services                  | |                                       conversation] |
                               |   All services            | +-----------------------------------------------------+
                               |   (five links)            |
                               | How we work               |
                               | About                     |
                               | [ Start a conversation ]  |
                               +---------------------------+
```
- M and T: logo, then a Menu built as `<details>`/`<summary>` (base pattern, no script). The CTA button sits inside the open menu **and** a compact copy of "Start a conversation" remains visible beside Menu from 480 px up. `[[DECISION for Gate 2: below 480 px, CTA only inside menu (default) or icon-only CTA]]`. Whichever option wins, update `user-flows.md` (mobile paragraph, which currently says the CTA stays visible outside the panel below 768 px) to match.
- D: full nav inline, sticky. Services is a link to `/services/` with a separate `<details>`/`<summary>` toggle next to it opening the five service links (base pattern, no script). Optional JS enhancement, not in v1: close on Escape and when focus leaves.
- Tab order: skip link, logo, Services link, Services disclosure, How we work, About, CTA.
- Current page: `aria-current="page"` plus underline.
- No script is required for navigation: the menu and Services disclosure are native `<details>`. v1 ships exactly one script (contact-form enhancement), per architecture.md.

### Footer
```
M                                D
+---------------------------+    +----------------------------------------------------------+
| (closing CTA band)        |    | (closing CTA band)                                       |
| Clockvane + one line      |    | Clockvane + line | Services (5) | Company (3)            |
| [fallback contact]*       |    | [fallback contact]*                                      |
| Services (5 links)        |    | ---------------------------------------------------------|
| Company (3 links)         |    | Privacy · (c) Clockvane · [[Q9 legal entity]] · socials* |
| Privacy · (c) · legal ... |    +----------------------------------------------------------+
+---------------------------+
```
`*` hidden when not configured in `site.config.ts` (Q8). Footer link groups use `nav` with `aria-label` ("Services", "Company"); the footer headings are `h2` visually styled small.

### Closing CTA band
`(h2)` one line + one supporting sentence + `[ Start a conversation ]`. Copy: `closing-cta`. Same block on every content page, so it stays one component. Omitted on Contact, Thanks, Error, Privacy, 404.

### Page header (inner pages)
Breadcrumb (service pages only) · `(h1)` · one-paragraph lede. Copy: `<page>.intro`.

## 1. Home `/`

Goal: what we do, for whom and the next step within 10 seconds (PRD G1). Personas P1, P2, P3.

```
D
+--------------------------------------------------------------------------+
| HEADER                                                                   |
+--------------------------------------------------------------------------+
| (h1) Hero statement (8 cols)              |  Workflow diagram (4 cols)   |
| lede                                      |  before / after, SVG         |
| [ Start a conversation ]  < See services >|                              |
+--------------------------------------------------------------------------+
| (h2) Chores we take off your hands                                       |
| 3 to 5 named examples as a plain list (not cards)                        |
+--------------------------------------------------------------------------+
| (h2) What we do                                                          |
| Five service rows: (h3) name . one line . < link >                       |
+--------------------------------------------------------------------------+
| (h2) How an engagement runs                                              |
| 4 steps in a horizontal sequence, numbered                               |
| < Read how we work >                                                     |
+--------------------------------------------------------------------------+
| (h2) Who is behind Clockvane   (only when about facts exist, Q6)         |
| short paragraph + < About >                                              |
+--------------------------------------------------------------------------+
| Proof strip (renders nothing until real proof exists, FR-5)              |
+--------------------------------------------------------------------------+
| CLOSING CTA BAND                                                         |
| FOOTER                                                                   |
+--------------------------------------------------------------------------+
```

| # | Section | Copy-deck block | Content slots | CTA |
|---|---------|-----------------|---------------|-----|
| 1 | Hero | `home.hero` | h1, lede, diagram with text alternative | Primary button, secondary link to Services |
| 2 | Chores | `home.chores` | 3 to 5 named chores `[[PLACEHOLDER: Q1 real examples of chores]]` | none |
| 3 | Services list | `home.services` | five names (from the Q1 set), one line each, link to detail | link per row |
| 4 | Way of working | `home.process` | four steps: title and one sentence | link to How we work |
| 5 | About teaser | `home.about` | `[[PLACEHOLDER: Q6 bio facts]]`; section omitted until supplied | link to About |
| 6 | Proof | `home.proof` | `[[PLACEHOLDER: Q5 real proof]]`; empty means no section and no heading | none |
| 7 | Closing band | `closing-cta` | | Primary button |

Breakpoints:
- M: hero text first, diagram below the lede (reduced, simple version), services rows full width and stacked, process steps vertical with a connecting rule, primary button full width.
- T: hero still stacked, diagram at 60% width; process steps in a 2 x 2 grid.
- D: hero two columns as drawn, process steps in one row.

Order and focus: skip link, header, hero CTA, hero secondary link, services links in order, process link, about link, closing CTA, footer. Headings: h1 hero; h2 for sections 2 to 6; h3 per service row and per process step.

## 2. Services overview `/services/`

```
+---------------------------------------------+
| (h1) Services + lede                        |
+---------------------------------------------+
| Jump list (anchor links to 5 rows)  [D only]|
+---------------------------------------------+
| For each service (x5), same structure:      |
|  (h2) name                                  |
|  problem sentence                           |
|  "Typical work" list (3 to 5 items)         |
|  < Read about {service} >                   |
+---------------------------------------------+
| Not sure which one? (h2) + short text       |
| [ Start a conversation ]                    |
+---------------------------------------------+
| CLOSING CTA BAND (merged with the above:    |
|  one band only, not two)                    |
+---------------------------------------------+
```
Copy: `services.intro`, `services.<slug>.summary` (x5), `services.help-choose`. Rows are alternating in D only through column placement (text left, "Typical work" right); on M and T they stack. No cards with icons. A service dropped in Q1 disappears here, in the nav, the footer and the home list together (single source in config/content).
Heading order: h1, five h2s. Focus order: jump list (D), then each row's link.

## 3. Service detail (x5) `/services/<slug>/`

One template (FR-6) used for process-automation, websites-and-apps, custom-software, cloud-devops, ai-automation.

```
+---------------------------------------------+
| Breadcrumb: Home > Services > {name}        |
| (h1) {name}   lede (the problem, in plain words)
| [ Start a conversation ]                    |
+---------------------------------------------+
| (h2) What we do        paragraph + SVG      |
+---------------------------------------------+
| (h2) Typical deliverables  list             |
+---------------------------------------------+
| (h2) How an engagement runs  steps (3 to 5) |
+---------------------------------------------+
| (h2) What we need from you  list            |
+---------------------------------------------+
| (h2) Related  < other services (2) >        |
+---------------------------------------------+
| CLOSING CTA BAND                            |
+---------------------------------------------+
```
| Section | Copy-deck block | Notes |
|---------|-----------------|-------|
| Intro | `services.<slug>.intro` | CR-3: names concrete chores or deliverables |
| What we do | `services.<slug>.what` | One simple SVG diagram of the workflow (before/after or pipeline); text alternative required |
| Deliverables | `services.<slug>.deliverables` | `[[PLACEHOLDER: Q1 deliverables and timelines per service]]` |
| Engagement | `services.<slug>.process` | Follows How we work; no invented durations |
| Needs from client | `services.<slug>.needs` | `[[PLACEHOLDER: Q1]]` |
| Related | `services.related` | Two sibling links, generated from config |

Breakpoints: M single column, sticky CTA not used (header button stays reachable via the menu; the closing band is the repeat). D: h2 left (3 cols), body right (9 cols), so the page scans as a labelled spec sheet. Structured data: `Service`, `BreadcrumbList`.
Focus order: breadcrumb links, hero CTA, related links, closing CTA. `aria-current="page"` on the last breadcrumb item.

## 4. How we work `/how-we-work/`

```
+---------------------------------------------+
| (h1) How we work + lede                     |
+---------------------------------------------+
| (h2) From first call to delivery            |
|  Ordered list (ol), 4 to 6 steps:           |
|   number . (h3) step . sentence . "you get" |
+---------------------------------------------+
| (h2) How we engage                          |
|  Engagement models: 2 to 3 rows             |
|  [[PLACEHOLDER: Q1/Q2 models]]              |
+---------------------------------------------+
| (h2) Pricing                                |
|  Stance per CR-4 [[PLACEHOLDER: Q2]]        |
+---------------------------------------------+
| (h2) Security and handover                  |
|  You own code and accounts; documentation   |
|  [[PLACEHOLDER: Q1 confirm ownership terms]]|
+---------------------------------------------+
| Short FAQ-style list inside page (optional) |
+---------------------------------------------+
| CLOSING CTA BAND                            |
+---------------------------------------------+
```
Copy: `how.intro`, `how.steps`, `how.models`, `how.pricing`, `how.handover`. M: steps vertical with numbers in a left gutter. D: steps as a vertical timeline in 8 cols with the "you get" output in a 4 col right column. Steps are an `ol`, so screen readers announce the count. Headings: h1, h2 per section, h3 per step.

## 5. About `/about/`

```
+---------------------------------------------+
| (h1) About + lede                           |
+---------------------------------------------+
| (h2) Who is behind Clockvane                |
|  text (7 cols) | portrait or none (5 cols)  |
|  [[PLACEHOLDER: Q6 bio, photo only if       |
|   owner supplies one]]                      |
+---------------------------------------------+
| (h2) What we are good at   (list)           |
| (h2) The name   (short, optional)           |
+---------------------------------------------+
| CLOSING CTA BAND                            |
+---------------------------------------------+
```
Copy: `about.intro`, `about.who`, `about.expertise`, `about.name`. Owner-supplied facts only (rule 9): no years in business, team counts or client names unless provided. Without a photo the column collapses and text is single column (empty state). M: photo (if any) after the first paragraph, with alt text describing the person. Headings h1, h2.

## 6. Contact `/contact/` (primary conversion)

```
M                                     D
+-----------------------------+       +-------------------------------------------+
| HEADER                      |       | HEADER                                    |
| (h1) Start a conversation   |       | (h1) Start a conversation                 |
| lede + response time        |       | lede                    | Side panel (4c) |
|                             |       |                         | (h2) What happens|
| [error summary region]      |       | [error summary region]  |  next: 3 steps   |
| Name *            [ ___ ]   |       | Name *   [ ___ ]        | Response time    |
| Reply contact *   [ ___ ]   |       | Reply contact * [ ___ ] | [[Q4 promise]]   |
|  hint: email or phone       |       |  hint                   | Fallback contact*|
| What do you want sorted? *  |       | Message *               | Privacy note     |
|   [ textarea ]              |       |   [ textarea ]          |                  |
|  (optional) Company [ ___ ] |       | (optional) Company      |                  |
| (honeypot, hidden from all  |       | [ Submit enquiry ]      |                  |
|  users and AT)              |       +-------------------------------------------+
| [ Submit enquiry ]          |
| Privacy note . fallback*    |
| FOOTER (no CTA band)        |
+-----------------------------+
```
Fields (PRD section 6: name, reply contact, short description; nothing more is required): 

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| Name | yes | text, `autocomplete="name"` | |
| Reply contact | yes | text accepting email or phone `[[PLACEHOLDER: Q4 email only, or email or phone]]` | label says what is accepted; `autocomplete="email"` if email only |
| Message | yes | textarea, native `maxlength` is the limit (no-JS); a character counter near the limit is JS-only | prompt: "What would you like off your plate?" is a label, final in `contact.form` |
| Company | no | text, `autocomplete="organization"` | marked "(optional)" in the label, not with colour |
| Honeypot | n/a | hidden | `aria-hidden`, `tabindex="-1"`, removed from layout, not display-only dependent |

`[[PLACEHOLDER: Q4 form vs book-a-call link. If a link, this page shows the link in place of the form and keeps the side panel.]]`

Copy: `contact.intro`, `contact.form` (labels, hints, errors), `contact.next-steps`, `contact.privacy-note`, `contact.fallback`.

**Form states (end to end)**

| State | What the user sees | Focus / announcement |
|-------|--------------------|----------------------|
| Initial | Empty fields, labels above inputs (never placeholder-only) | Focus stays on page start |
| Filling (JS) | Hints on blur for already-touched fields (script only; the no-JS path shows native messages on submit) | |
| Validation error (JS) | Error summary container (`tabindex="-1"`, labelled by its heading, no `role="alert"`) at the top of the form listing each problem as a link to its field; inline message under each invalid field (`aria-describedby`, `aria-invalid="true"`), icon plus text, not colour only | Focus moves to the summary; links move focus to the field |
| Validation error (no JS) | Browser's native messages from `required`, `type`, `maxlength` | Browser-managed |
| Sending (JS) | Button reads "Sending…", disabled, `aria-busy="true"`; fields stay filled and read-only | Status text in a polite live region |
| Delivery failure (JS) | Inline banner (focus container, `tabindex="-1"`, no `role="alert"`) above the form: "We could not send this. Your text is still here. Try again or use [fallback contact]" | Focus moves to the banner; button re-enabled |
| Success (JS) | Form is replaced by the confirmation content (same as Enquiry sent), `h1` stays | Focus moves to the confirmation heading |
| Success (no JS) | `303` to `/contact/thanks/` | New page load |
| Failure (no JS) | `303` to `/contact/error/` | New page load |

Breakpoints: M single column, button full width, side panel content moves below the button as "What happens next". T: single column at 560 px max width. D: form 7 cols, side panel 4 cols sticky; DOM order is form first, panel second. Structured data: `ContactPage`.
Tab order: skip link, header, Name, Reply contact, Message, Company, Submit, fallback link, footer links. The honeypot is skipped (`tabindex="-1"`, hidden). Headings: h1; h2 "What happens next".

## 7. Enquiry sent `/contact/thanks/`

```
+---------------------------------------------+
| (h1) Enquiry sent                           |
| Confirmation sentence                       |
| Expected response time [[PLACEHOLDER: Q4]]  |
| (h2) What happens next  (ol, 3 steps)       |
| < How we work >   < Home >                  |
+---------------------------------------------+
```
Copy: `contact.thanks`. No CTA band, no form, `noindex`. On the JS path this exact content replaces the form and receives focus. Direct visit with no submission still shows the same neutral page (no personal data is shown, so there is nothing to leak). M and D: single column, max 640 px.

## 8. Enquiry failed `/contact/error/`

```
+---------------------------------------------+
| (h1) We could not send your enquiry         |
| Your text was not kept.                     |
| Use [fallback contact]* or try the form     |
| [ Back to the form ]    (button-link)       |
+---------------------------------------------+
```
Copy: `contact.error`. If no fallback contact is configured, the sentence about it is omitted and only the back-to-form action remains. `noindex`, no CTA band. Heading h1 only. The message is plain, says what happened, what was and was not saved, and what to do.

## 9. Privacy `/privacy/`

```
+---------------------------------------------+
| (h1) Privacy notice   Last updated: date    |
| In-page contents (anchor list, D: sticky)   |
| (h2) What we collect                        |
| (h2) Why and on what basis                  |
| (h2) Who receives it                        |
| (h2) How long we keep it                    |
| (h2) Your rights and how to use them        |
| (h2) Cookies and analytics                  |
| (h2) Who we are  [[PLACEHOLDER: Q9]]        |
+---------------------------------------------+
```
Copy: `legal.privacy`; content depends on the real data flow `[[PLACEHOLDER: Q9 legal entity, jurisdiction; Q10 analytics tool]]`. Not legal advice: flagged for owner review. Reading width max 70 characters; contents list is a plain `nav` of anchors. Headings h1, h2 only. No CTA band.

## 10. 404 `404.html`

```
+---------------------------------------------+
| HEADER (full, so the user can navigate)     |
| (h1) We could not find that page            |
| One sentence: it may have moved.            |
| < Home >  < Services >  < Contact >         |
| FOOTER                                      |
+---------------------------------------------+
```
Copy: `errors.404`. Must work at any URL depth, so all asset and link paths are root-absolute. `noindex`. Title "Page not found". No search. Focus starts at the top; no auto-focus script.

## 11. Cross-page states

| Element | Loading | Empty | Error |
|---------|---------|-------|-------|
| Static pages | No spinner; server-rendered; fonts swap with a size-matched fallback so there is no layout shift | n/a | n/a |
| Contact form | See form states (section 6) | n/a | See form states |
| Proof strip / `/work/` | n/a | Component renders nothing, heading included; page not built | n/a |
| About photo | Reserved aspect ratio (no shift) | Column collapses | Image failure: alt text shows, layout holds |
| Service menu | n/a | n/a | Without JS, link goes to the overview |
| Footer contact, socials | n/a | Hidden when config empty | n/a |
| Diagrams (SVG) | Inline, no network | n/a | n/a |
| 404 / error pages | n/a | n/a | Defined in sections 8 and 10 |

## 12. Accessibility notes (all pages)

- Landmarks: `header`, `nav` (labelled), `main`, `footer`; one `h1` per page; heading outlines are given per page above.
- Keyboard: every control reachable and operable by keyboard; the skip link target is `main` with `tabindex="-1"`. Native `<details>` disclosures and the mobile menu respond to Enter and Space. Escape-to-close and close-on-focus-leave are an optional JS enhancement, not in v1 (matches sitemap.md).
- Focus: visible focus indicator on every interactive element, not obscured by the sticky header (WCAG 2.2 SC 2.4.11 Focus Not Obscured); use `scroll-margin-top` equal to the header height on anchor targets and focus targets.
- Target size: at least 24 x 24 px (SC 2.5.8) and 44 x 44 px on M by our own rule.
- Forms: visible labels, hint text and errors tied with `aria-describedby`; SC 3.3.7 Redundant Entry (nothing asked twice); SC 3.3.8 Accessible Authentication does not apply (no login). No CAPTCHA.
- Motion: none is required to understand content; honour `prefers-reduced-motion`.
- Reflow at 320 px wide with no horizontal scroll; text resizes to 200% without loss.
- Colour is never the only carrier of state (errors, current page, links get icon, underline or text).

## 13. Open items

| Item | Needed from | Affects |
|------|-------------|---------|
| Q1 services offered, deliverables, timelines | Owner | Home, Services, all service pages, nav |
| Q2 pricing stance and Q4 response time | Owner | How we work, Contact, Thanks |
| Q4 form vs book-a-call link, notification channel | Owner | Contact, Thanks, Error |
| Q5 proof | Owner | Home proof strip, `/work/` |
| Q6 bio and photo | Owner | About, Home teaser |
| Q8 contact details and socials | Owner | Footer, fallback contact |
| Q9 legal entity, Q10 analytics | Owner | Privacy, footer |
| Copy deck blocks named above | Content writer | All pages |
