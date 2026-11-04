# Design system v3

Status: for approval at Gate 2e · Owner: UX/UI Designer · Ticket: #125
Source: [owner change request 3](../product/BRIEF.md) · [research](v3/research.md) · [ADR-004](../adr/ADR-004-motion-and-effects.md) · [NFR](../architecture/nfr.md) · [copy deck](../content/copy-deck.md)
Live: the shared components in `src/components/` · Files: [tokens.json](tokens.json) · [components.md](components.md) · [motion.md](motion.md) · [contrast.md](contrast.md)

## Principles
1. **The product leads.** Screens carry the page. Text says one thing, then shows it.
2. **A light canvas.** White, near-black and grey. Colour comes from example screens and service tiles.
3. **Confident type.** Few sizes, tight headings, and hierarchy from size and weight.
4. **Honest examples.** Every screen is an original design labelled as an example, in HTML text. No client names, people, logos, prices, counts or results.
5. **Name-independent.** The logo is a plain wordmark. Nothing plays on the name: no clocks, vanes, gears or clockwork. The brand has one source, `site.config.ts`.
6. **Polished and fast.** CSS-first motion that stops on request. Nothing depends on JavaScript.

## Colour
All values are in [tokens.json](tokens.json); all 42 pairs and ratios are in [contrast.md](contrast.md).

| Role | Token | Value | Use |
|------|-------|-------|-----|
| Canvas | `color.light.canvas` | #FFFFFF | Page |
| Surface | `color.light.surface` | #F4F4F4 | Stages, bands, panels |
| Text | `color.light.text` | #141414 | Headings, body |
| Muted text | `color.light.textMuted` | #666666 | Lead, supporting text; canvas and surface only |
| Action | `color.light.action` | #141414 | Primary pill, selected tab |
| Accent | `color.light.link`, `.focus` | #2447E8 | Text links and focus ring only |
| Control outline | `color.light.controlBorder` | #858585 | Secondary pills, tabs |
| Divider | `color.light.hairline` | #E5E5E5 | Decorative only, never the sole sign of a control |
| Placeholder | `color.light.placeholderFill`, `.placeholderText` | #FFF4D6, #664700 | Placeholder tag |
| Footer | `color.dark.canvas`, `.text`, `.textMuted` | #141414, #FFFFFF, #B3B3B3 | The one dark band |
| Services | `color.service.expert`, `.automation`, `.website`, `.solutions` | #C2410C, #6D3FE8, #0A6CD6, #0B7A4B | Service tiles only; automation also marks the demo's active step |

Light-first: there is no dark theme at launch. The dark group styles the footer.

## Type
One self-hosted file: Public Sans variable, 26.8 kB, OFL (`font-display: swap`, preloaded, Arial fallback with metric overrides). Budget: NFR P-6.

| Role | Token | Phone | From 64rem | Weight | Line height | Tracking |
|------|-------|-------|------------|--------|-------------|----------|
| h1 | `font.size.hero`, `.heroWide` | 40 px | 68 px | 680 | 1.04 | −0.035em |
| h2 | `font.size.h2`, `.h2Wide` | 32 px | 44 px | 680 | 1.1 | −0.025em |
| Closing h2 | `font.size.h2`, `.closingWide` | 32 px | 56 px | 680 | 1.1 | −0.025em |
| Statement | `font.size.statement`, `.statementWide` | 28 px | 36 px | 600 | 1.1 | −0.025em |
| h3 | `font.size.h3` | 24 px | 24 px | 600 | 1.3 | −0.025em |
| Lead | `font.size.lead` | 20 px | 20 px | 400 | 1.3 | 0 |
| Body | `font.size.body` | 16 px | 16 px | 400 | 1.5 | 0 |
| Small | `font.size.small` | 14 px | 14 px | 400–600 | 1.5 | 0 |
| Micro | `font.size.micro` | 12 px | 12 px | 400–600 | 1.3 | 0 |

## Space, radius, shadow
- **Spacing:** 4 px base: `space.1` 4, `2` 8, `3` 12, `4` 16, `5` 20, `6` 24, `8` 32, `10` 40, `12` 48, `16` 64, `20` 80, `32` 128, `40` 160 px.
- **Section rhythm:** 80 px between sections on phone and tablet, 128 px from 64rem.
- **Layout:** content 72rem, stage 85rem, gutter 20 px then 40 px, tap target 44 px.
- **Radius:** `sm` 8, `md` 12, `lg` 20 (screens), `xl` 24 (bands on phone), `xxl` 32 (bands from 48rem), `pill`.
- **Shadow:** `shadow.card` 0 8 24 at 4% for resting cards; `shadow.lift` 0 16 40 at 8% for hover and the disclosure panel.

## Breakpoints
Mobile first. `breakpoint.sm` 30rem, `md` 48rem (768 px), `lg` 64rem (1024 px), `xl` 90rem (1440 px). Layouts change at `md` and `lg`; `sm` and `xl` are reserved for production fine-tuning. Checked at 320, 390, 768 and 1440 px, without horizontal page overflow.

## Page layouts
Slots refer to [the copy deck](../content/copy-deck.md).

### Home
| Section | Copy block | Phone (from 320 px) | From 48rem | From 64rem |
|---------|------------|---------------------|------------|------------|
| Notice (prototype only) | none | Centred, wraps | Same | Same |
| Header | `site` | Wordmark, Book a call, menu | Same | Wordmark, Services disclosure, How we work, About, Book a call. Sticky throughout |
| Hero | `home.hero` | Centred; tagline, h1 with tokens, lead, stacked or wrapped pills | Same | Three set lines, stage top visible at 900 px high |
| Columns | §3.5 | Note and pause, then 3 bleeding columns, height min(34rem, 125vw) | 4 columns, 40rem | 5 columns inside the 85rem stage, min(45rem, 58vw) |
| Problem and solution | `home.problem-solution` | h2, two-tone statement, link, then full-bleed row of wide screens at 78vw | Screens 520 px wide | Same, more space |
| One place | `home.services` | Centred head, wrapped tabs, panel with 2 thumbnails, stacked pills | 3 thumbnails | Pills beside the panel text |
| AI demo | `home.ai-demo` | Copy, controls, then stage | Same | 5:7 columns, copy left |
| Stories (placeholders) | `home.stories` | One column | 3 columns | Same |
| Closing | `closing-cta` | Rounded grey band, centred | Same | 56 px h2, band to 85rem |
| Footer | `site` | Stacked groups | Brand column plus 2 groups | Same |

Primary CTA position: header, hero, each service panel and closing, so it is never more than a screen or so away.

### Services overview
| Section | Copy block | Phone | From 64rem |
|---------|------------|-------|------------|
| Intro | `services.intro` | Centred, wrapped jump pills | Same, h1 on one line |
| Row of examples | §3.5 | Note, pause, row at 78vw | Screens 520 px |
| Four services | `services.one-place`, `services.*.summary` | Tile, h2, lead, What you get, How it works, Who it is for, CTA, then stage | Two columns, alternating sides |
| Help choosing | `services.help-choose` | Stacked | Text left, pill right |
| Closing, footer | `closing-cta`, `site` | As home | As home |

## Accessibility
WCAG 2.2 AA. Skip link; one h1 per page; landmarks named where there are several; 2 px focus ring outside every control; tap targets at least 40 px high, 44 px for primary navigation and pills; tokens and motion hidden from assistive technology; no text in images that isn't also in HTML where a visitor needs it; every moving thing can be paused. See [components.md](components.md) and [motion.md](motion.md).

## Performance
Budgets are in [NFR](../architecture/nfr.md) §1; the measured prototype results are in the Gate 2e PR.
