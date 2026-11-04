# Research: mobbin.com and comparable product-led sites

Status: done for Gate 2e · Owner: UX/UI Designer · Ticket: #125
Method: mobbin.com opened live on 2026-11-04 in Chromium at 1440 × 900 and at 390 × 844 (phone emulation), scrolled to the end, with computed styles read from the page. Peer sites opened live at 1440 × 900 for their first screen. Values marked "seen" are read from screenshots rather than measured.

## mobbin.com

### Type
| Element | 1440 px | 390 px | Notes |
|---------|---------|--------|-------|
| h1 | 80/80 px, weight 652, tracking −0.6 px | 40/40 px, same weight | Colour `#141414`. Custom grotesque (Saans) |
| h2 | 44/48 px, weight 652 | 32/36 px | Line breaks are hand-set for two short lines |
| Closing h2 | 56/56 px | 32/36 px | The only step up from the h2 size |
| Lead | 20/26 px, `rgb(112,112,112)` | 20/26 px | Same size on both, two to four lines |
| Button | 16 px, weight 600 | Same | |

The scale has few steps. Headings are tight, and hierarchy comes from size and weight, not from colour.

### Spacing rhythm
- Section top padding: 80, 100, 160 and 200 px on desktop; 80, 100, 128 and 160 px on phone. The hero opens with 200 px (desktop) and 128 px (phone).
- Page height: 8,125 px at 1440, 9,343 px at 390. Ten sections, so about one idea per 800 px.
- Content width (seen): about 1,050 to 1,125 px, with bands running wider, to about 1,125 px inside a 1,440 px page.

### Colour
- White canvas, `#141414` text and primary pills. Grey `rgba(64,64,64,.08)` for secondary pills and light grey for the bands.
- No page accent: colour comes entirely from the app icons and screens.
- Footer: near-black, with a rounded top edge against the page and a very large faded wordmark. We don't copy the wordmark, because the design must not lean on the name.

### Radius and shadow
- Radii in use, most frequent first: 30% (app icons), 32 px (large bands), 8 px, 20 px, 18 px, 9999 px (pills), 24 px (story cards).
- Shadows are nearly invisible: `0 8px 24px rgba(0,0,0,.04)` on 29 elements, and an inset `0 0 0 .5px rgba(0,0,0,.1)` as a hairline on three.

### Imagery density
- 294 images on one page. Crisp UI on nearly every screen: the page is the product.
- A hero product frame, then a grid and a "One library for all your needs." section with six tiles (Apps, Sites, Screens, Flows, Animations, UI Elements), each with its own thumbnails.
- Text is short. Sections say one thing and then show it.

### Motion
- Page load: `hero-slot-open` 260 ms and `hero-slot-in` 440 ms bring the icons into the sentence; `supportingReveal` 500 ms and an 800 ms image reveal follow.
- Measured live: a blinking caret (1,060 ms) is the only infinite CSS or Web Animations loop on the first screen. 18 grouped elements moved by themselves within 1 s, so its carousels are script-driven.
- Scrolling is native: a 400 px wheel scroll moved the page exactly 400 px. No scroll-jacking.
- No pause control was found on the moving parts. **We must do better here**: WCAG 2.2.2 and ADR-004 §4 require one.

### Section rhythm
Hero → product frame → logos → problem and solution → one library → AI agents demo → customer stories → quote → closing → footer.

### Phone behaviour
- Header: mark, primary pill and a menu icon only.
- The hero sentence keeps its inline icons at 34 px, at 40 px type; the two buttons sit on one line when they fit.
- Tiles stack into one column, so the library section grows from 1,016 px to 2,396 px.
- The first screen still reaches a product image.

### What we take, translated
| From Mobbin | Ours | Different because |
|-------------|------|-------------------|
| Icons woven into the h1 | Service tiles after three topics | No third-party logos; the sentence reads fully without them |
| Screens everywhere | Twenty original example screens, each labelled in HTML | Rule 9: no client work or invented results |
| One library tiles | Four service tabs, each with its own thumbnails | Four services instead of six formats |
| Agent demo | Scripted request-to-draft demo with a visible DRAFT label | It never claims to be live |
| Near-black footer with large wordmark | Near-black footer, plain wordmark | Name-independent |
| Grey fill on secondary pills | White pill with a 3:1 outline | WCAG 1.4.11 needs a visible boundary; grey fill alone is 1.1:1 |
| No pause control | Pause examples button by each marquee | WCAG 2.2.2, ADR-004 §4 |

## Comparable product-led sites

| Site | What it does well | What we take | What we leave |
|------|-------------------|--------------|---------------|
| [Linear](https://linear.app) | A real, dense product frame directly under a two-line headline; an extremely quiet interface around it | Let the product screen carry the first impression | The dark theme, which the brief rules out |
| [Vercel](https://vercel.com) | Strict alignment, one black pill and one quiet secondary, three short audience links beside the hero | The discipline of two button styles only | Logo strip (we have no permission to show any) |
| [Raycast](https://raycast.com) | A single memorable statement and high-craft details | Short, confident headline sentences | Dark, glowing, abstract art: not allowed here |
| [Framer](https://framer.com) | Shows the AI prompt box as the product, so the visitor gets the idea immediately | A prompt as the visual anchor of the AI section | Heavy glow effects |
| [Cursor](https://cursor.com) | A warm light canvas with a realistic app window that shows an agent's steps and a result | Steps then a result, in plain UI, as the honest way to show AI working | A painted background behind the frame: more weight than we need |

## Quality test
Compared side by side at 1440 and 390 with the Mobbin captures: same type confidence, same pill and card language, comparable image density in the first two screens, and clearer on what is offered, since the four services are named in the first section with tabs. Where ours is deliberately weaker: real product photography cannot be matched by example screens, and the display face is the existing self-hosted Public Sans, not a commercial grotesque. The face is the one change that would visibly lift the headline; see the open question in [README.md](README.md).
