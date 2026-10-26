# Visual directions

Status: draft for Gate 2 · Owner: UX/UI Designer · Ticket: #30
Inputs: `docs/product/PRD.md`, `personas.md`, `docs/content/voice-and-tone.md`, `wireframes.md`, `sitemap.md`, ADR-001 (plain CSS + tokens, self-hosted WOFF2), `nfr.md` (P-5 CSS ≤ 30 kB, P-6 ≤ 2 families, ≤ 4 files, ≤ 100 kB WOFF2).

Scope: direction only. The full token set (`tokens.json`), component specs and the prototype are the next tickets. Hex values below are candidates that become tokens once a direction is chosen.

## What both directions must achieve
- **Calm and competent** for a non-technical owner-operator (P1) who fears jargon, and **precise** for an ops/IT manager (P2) who reads scope closely.
- **Proof without invented proof.** No testimonials, logos or statistics exist (voice-and-tone section 10). The site itself, its documented build process and workflow diagrams carry credibility. Craft is the proof.
- **No clichés:** no gradient blobs, no stock handshakes, no robot-brain imagery, no neon "AI" glow.
- **Budget-safe:** two font families at most, up to four WOFF2 files, under 100 kB total. Illustration is inline SVG: no raster above the fold.
- Brand appears as "Clockvane" only (in production, from `site.config.ts`).

## Shared illustration system (both directions)
Illustrations are original diagrams of work, not decoration: a **before/after workflow** (a person re-keying data between tools, versus the same steps running by themselves with a human check at the one unclear step), a **pipeline** (source, step, step, result), and a **timeline** for packages (2–3 days, 1–2 weeks, 1–3 weeks). Built from five primitives: node (rounded rectangle), connector (orthogonal line with a small arrowhead), checkpoint (a circle marking "a person checks this"), tick mark (a nod to a clock dial, used as a rhythm motif) and label. Each direction styles these primitives differently; the structure is identical, so the SVG set is drawn once and themed with tokens (`currentColor` and CSS custom properties). Every diagram has `role="img"` with a text alternative, or `aria-hidden` when adjacent text says the same.

---

## Direction A: "Workshop ledger"

### Concept
A well-kept ledger on a tidy workbench. Warm paper, ink-navy text and one brass accent, set in a literate serif for headlines. It says: a careful person is doing this for you, in plain words. The clock motif is quiet: fine tick marks as section dividers and diagram rules.

### Colour (light is the default; dark variant is specified in `tokens.json`)
| Role | Hex | Used for |
|------|-----|----------|
| Paper (bg) | `#F6F2EA` | Page background |
| Paper-deep (surface) | `#E9E2D3` | Cards, alternating bands |
| Ink (text) | `#1B2433` | Headings, body |
| Ink-soft (text-muted) | `#4A5565` | Secondary text, captions |
| Brass (accent) | `#8A4B14` | Links, primary button background, key diagram path |
| Navy (inverse surface) | `#2D3B52` | Closing CTA band, footer |
| Brass-light (accent on dark) | `#E8C98F` | Links and rules on navy or ink |

Contrast (WCAG 2.2 AA: 4.5:1 normal text, 3:1 large text and UI components):
| Foreground / background | Ratio | Use | Result |
|------|-------|-----|--------|
| Ink `#1B2433` on Paper `#F6F2EA` | 13.97:1 | Body, headings | AAA |
| Ink on Paper-deep `#E9E2D3` | 12.09:1 | Text on cards | AAA |
| Ink-soft `#4A5565` on Paper | 6.77:1 | Secondary text | AA |
| Ink-soft on Paper-deep | 5.86:1 | Secondary text on cards | AA |
| Brass `#8A4B14` on Paper | 6.07:1 | Links, accent text | AA |
| Paper `#F6F2EA` on Brass `#8A4B14` | 6.07:1 | Primary button label | AA |
| Paper on Navy `#2D3B52` | 10.12:1 | Text in CTA band and footer | AAA |
| Brass-light `#E8C98F` on Ink `#1B2433` | 9.79:1 | Accent on dark | AAA |
| Brass `#8A4B14` on Paper (focus ring, 3:1 needed) | 6.07:1 | Focus outline (2 px, 2 px offset) | Pass |

### Type pairing (both SIL OFL 1.1, self-hostable)
- **Headings: Newsreader** (variable, roman only, optical size axis; subset to Latin). Calm, editorial, readable at display sizes.
- **Body and UI: Public Sans** (variable). Neutral, sturdy, clear numerals.
- Budget: Newsreader roman plus Public Sans roman = 2 files, roughly 60–80 kB subset. Italics are synthesised sparingly or avoided.
- Scale: 1.25 ratio, body 18 px / 1.6 on mobile, H1 40 px on M rising to 56 px on D, measure 62–68 characters.

### Imagery and illustration
Diagrams drawn like technical plates: 1.5 px ink strokes, flat paper-deep fills, brass for "the path the work takes now", fine tick marks along the baseline. No photos in v1. A real photo of the owner may be added to About only if supplied (PRD Q1, Q6).

### Motion principles
Slow and mechanical, like a clock hand: a single 240 ms ease-out on hover and focus transitions, and diagram connectors that draw once (stroke-dashoffset, 600 ms) when scrolled into view. Everything is off under `prefers-reduced-motion: reduce`, with diagrams shown in their final state. No parallax, no autoplay, no scroll-jacking.

### Layout rhythm
Generous vertical space (96 px section padding on D, 56 px on M), a 12-column grid with the text column held to 8 columns and diagrams allowed to breathe wider. Sections alternate paper and paper-deep; thin tick-mark rules separate them. Corner radius small (4 px). Cards use a 1 px border rather than shadow.

### Sample composition: hero and card
```
D (1024+)
+------------------------------------------------------------------------------+
| Clockvane      Services  How we work  About             [ CTA ]               |
+------------------------------------------------------------------------------+
|  (h1, Newsreader 56)                    +--------------------------------+   |
|  Automation that runs like clockwork.   |  Before        After           |   |
|                                         |  [Email]->[Retype]->[Sheet]    |   |
|  (Public Sans 20, ink-soft)             |   ^ person, daily              |   |
|  We take over the copy-paste work your  |  [Email]=>[Read]=>(check)=>    |   |
|  team does every day...                 |            [Sheet]   brass path|   |
|                                         +--------------------------------+   |
|  [ Book a free audit call ]  <Read how we work>                              |
|  ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' ' (tick-mark rule) ' ' ' ' ' ' ' ' ' ' ' ' ' '|
+------------------------------------------------------------------------------+

Service card (paper-deep, 1 px ink-soft border at 30% is decorative only)
+---------------------------------+
| (h3, Newsreader 24) Automate    |
| repetitive work                 |
| Reports, invoices, approvals    |
| that run by themselves.         |
| Typical timeline: 1–3 weeks     |
| <See the automation build>  ->  |
+---------------------------------+
```
M: single column, diagram below the CTA, cards stacked, CTA full width.

---

## Direction B: "Control room"

### Concept
A quiet operations console. Cool grey-white surfaces, near-black text and a single deep-teal signal colour, with monospaced labels used like annotations on a system diagram. It says: this is engineered, observable and boring in the best way. It leans toward P2 and P3 (technical evaluators) while staying plain for P1.

### Colour
| Role | Hex | Used for |
|------|-----|----------|
| Surface (bg) | `#F3F5F4` | Page background |
| Surface-2 | `#E4E9E7` | Cards, bands |
| Ink (text) | `#10161F` | Headings, body |
| Ink-soft (text-muted) | `#46515E` | Secondary text, captions |
| Signal (accent) | `#0B6B58` | Links, primary button, diagram "running" path |
| Night (inverse surface) | `#10161F` | Closing CTA band, footer, optional dark mode base |
| Signal-light (accent on dark) | `#7FD8BE` | Links and diagram strokes on Night |
| Night-soft (muted on dark) | `#A9B4BF` | Secondary text on Night |

Contrast:
| Foreground / background | Ratio | Use | Result |
|------|-------|-----|--------|
| Ink `#10161F` on Surface `#F3F5F4` | 16.58:1 | Body, headings | AAA |
| Ink on Surface-2 `#E4E9E7` | 14.79:1 | Text on cards | AAA |
| Ink-soft `#46515E` on Surface | 7.38:1 | Secondary text | AAA |
| Ink-soft on Surface-2 | 6.58:1 | Secondary text on cards | AA |
| Signal `#0B6B58` on Surface | 5.89:1 | Links, accent text | AA |
| Signal on Surface-2 | 5.25:1 | Links on cards | AA |
| Surface `#F3F5F4` on Signal `#0B6B58` | 5.89:1 | Primary button label | AA |
| Surface on Night `#10161F` | 16.58:1 | Text on dark bands | AAA |
| Signal-light `#7FD8BE` on Night | 10.78:1 | Accent on dark | AAA |
| Night-soft `#A9B4BF` on Night | 8.62:1 | Muted text on dark | AAA |
| Signal on Surface (focus ring, 3:1 needed) | 5.89:1 | Focus outline | Pass |

### Type pairing (SIL OFL 1.1, self-hostable)
- **Headings and body: IBM Plex Sans** (static Regular, Medium, SemiBold; Latin subset). Engineered, slightly technical, excellent legibility.
- **Labels and data: IBM Plex Mono** (Regular). For step labels in diagrams, timeline durations and small eyebrow text only, never for paragraphs.
- Budget: roughly 3–4 WOFF2 files, about 70–95 kB subset. This sits close to P-6 (≤ 4 files, ≤ 100 kB), so it needs a measured check when built.
- Scale: 1.2 ratio, body 17 px / 1.6, H1 38 px on M rising to 52 px on D. Medium weight for headings, tight tracking at display sizes.

### Imagery and illustration
Diagrams as system maps: 1 px strokes on a faint dot grid, mono labels, a signal-colour path for the automated route, a hollow circle for "a person checks this". The same plate style appears at small size in cards as an icon-like glyph. No photos in v1.

### Motion principles
Crisp and informative: 150 ms linear-ish transitions, a step-by-step highlight that walks along the pipeline diagram once on view (each node lights for 300 ms in sequence), and a blinking-free status dot. Fully disabled under `prefers-reduced-motion`. No decorative animation.

### Layout rhythm
Tighter and more modular than A: an 8 px base grid, 80 px section padding on D and 48 px on M, content in visible module cards (8 px radius, 1 px border, no shadow). Light and Night bands alternate once on the page (closing CTA and footer are Night). Hero is split left text, right diagram, with the mono eyebrow above the H1.

### Sample composition: hero and card
```
D (1024+)
+------------------------------------------------------------------------------+
| Clockvane      Services  How we work  About             [ CTA ]               |
+------------------------------------------------------------------------------+
|  AUTOMATION . CLOUD . WEBSITES      (Plex Mono 13, ink-soft)                 |
|  (h1, Plex Sans Medium 52)          +- - - - - - - - - - - - - - - - - -+   |
|  Automation that runs               :  [inbox] -> [read] -> (check) ->  :   |
|  like clockwork.                    :                       [sheet]     :   |
|                                     :  dot grid, signal path, mono labels:   |
|  We take over the copy-paste work   +- - - - - - - - - - - - - - - - - -+   |
|  your team does every day.                                                   |
|  [ Book a free audit call ]  <Read how we work>                              |
+------------------------------------------------------------------------------+

Service card (surface-2, 8 px radius, 1 px border)
+---------------------------------+
| [glyph: 3-node pipeline]        |
| (h3, Plex Sans Medium 22)       |
| Automate repetitive work        |
| Reports, invoices, approvals.   |
| 1–3 WEEKS  (Plex Mono 13)       |
| <See the automation build>  ->  |
+---------------------------------+
```
M: single column, diagram stacked under the CTA and scrolling horizontally never (it reflows to a vertical pipeline).

---

## Comparison
| Criterion | A: Workshop ledger | B: Control room |
|-----------|-------------------|-----------------|
| First impression | Warm, human, editorial | Cool, precise, engineered |
| Best persona fit | P1 owner-operator, still credible to P2 | P2 ops/IT and P3 founder, still plain for P1 |
| Fits "calm, not flashy" | Strongly | Strongly, slightly more technical |
| Differentiation from AI/SaaS templates | High: serif, paper, brass are rare in this field | Medium: dark/mono/teal is common in dev-tool sites |
| Fits tone ("We automate the boring stuff", plain words) | Very good: serif reads as human | Good: mono labels can feel jargon-y if overused |
| Font budget risk (P-6) | Low: 2 variable files | Medium: 3–4 static files near 100 kB |
| Contrast headroom | Lowest text pair is 5.86:1; brass at 6.07:1 | Lowest text ratio 5.25:1; most pairs are AAA |
| Dark mode | Needs a designed navy/ink variant | Natural: Night is already the base |
| Diagram legibility | Good; fills and brass carry meaning | Excellent; dot grid and mono labels suit workflows |
| Risk | Could read "boutique/agency" if copy gets precious | Could read like every dev-tool site |

## Recommendation: Direction A, "Workshop ledger"
1. The primary buyer (P1) is a non-technical owner who wants to know the firm is real, calm and honest. A warm, literate look signals a person, not a platform. With no testimonials or logos available, that human feel does work that proof would normally do.
2. It differentiates. Most automation and AI sites use dark, mono and teal or purple. A paper-and-ink look with a brass accent is rare in the field and cannot be mistaken for a template.
3. It is the cheaper build: two variable font files, no mono, and the diagram system relies on fills and one accent colour.
4. P2 and P3 are still served by the diagrams (precise, labelled) and the documented process. The mono idea from B can be borrowed for tiny labels later only if a font budget exists. That is a possible refinement, not part of this recommendation.
5. Risk to manage: the ledger look can drift toward "boutique". Copy must stay plain (see voice-and-tone) and the layout stays restrained: no ornament beyond tick marks.

If the owner prefers a more technical feel, B is a safe alternative and needs only a font-budget check.

## Open items for the owner (Gate 2)
- Choose A or B (or request a blend).
- Dark mode: in or out of v1? (A needs an extra designed variant; B gets it nearly free.) Default recommendation: out of v1, honour `prefers-color-scheme` later.
- Primary CTA label conflict between docs: `voice-and-tone.md` says "Book a free audit call", `wireframes.md` says "Start a conversation". The sample compositions above use the voice-and-tone label. The copy deck ticket should settle it. No design impact.
- Photo of the owner on About: supply or omit (PRD Q1, Q6).

## Licence and portability notes
Newsreader, Public Sans, IBM Plex Sans and IBM Plex Mono are all SIL Open Font License 1.1: free for web use, self-hostable and redistributable. Files are subset to Latin, served from the site origin (`font-src 'self'`), `font-display: swap`, and only the body face is preloaded (ADR-001). Source files and licences are fetched at build time by the build ticket; none are added in this PR. Exact file sizes are a verify-at-build item against P-6.
