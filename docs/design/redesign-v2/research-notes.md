# Research notes — immersive references (Gate 2c, issue #110)

Owner's list: `docs/design/research/immersive-references.md`. On 2026-10-30 every site below was
opened live in Chromium at **1440 × 900 (desktop)** and **390 × 844 (phone, touch)**. After 5 s the
script recorded the title, the number of canvases, whether a WebGL context exists, whether three.js
announced itself (`window.__THREE__`), and the script weight from the `content-length` headers. The
browser was headless with a software GPU (SwiftShader), so the numbers show what each site *ships*,
not its frame rate. The design reading comes from the live pages, the published case studies and
our own two prototypes.

## What the live visit showed

| Site | Desktop | Phone | Script (headers) | Observation |
|------|---------|-------|------------------|-------------|
| Igloo Inc | three.js present; no canvas yet after 5 s | same | 60 kB first | Small boot, then streams the world in: the intro is generated, not downloaded. |
| BlueYard | 1 WebGL canvas, three.js | 1 canvas | 1026 kB / 506 kB | Ships a lighter bundle to phones. The nebula *is* the navigation. |
| Oryzo (Lusion) | 6 canvases, three.js | same | 464 kB | One hero object, scene-to-scene transitions. |
| Lusion | 3 canvases, three.js | same | 476 kB | The cursor pushes the matter around. |
| Lando Norris | 21 canvases, three.js | same | 408 kB / 656 kB | One loud accent on near-black; type does the shouting. |
| Bruno Simon | 1 canvas, three.js | same | 668 kB | Full world, physics. Play as navigation. |
| Active Theory | **refuses to run**: "Your browser is not supported" | same | 716 kB | Gates on a real GPU. A software renderer gets a message instead of a slideshow. |
| DeepSee Commerce | 1 canvas, three.js | same | 238 kB | Proof that a real 3D scroll journey fits in about 240 kB of script. |
| Iventions | 1 canvas, three.js | **no canvas** | 194 kB | Drops WebGL on the phone and keeps the layout. |
| Atmos (Leeroy) | 1 canvas, three.js | same | 1465 kB | Flight through clouds; heavy, but the pacing is the lesson. |
| Prometheus Fuels | no canvas at 5 s | same | 127 kB | The process story is mostly video and DOM. A warning: it reads as a slideshow. |
| Mat Voyce | 1 canvas | **no canvas** | 815 kB / 161 kB | Kinetic type; ships a ~5× lighter phone bundle without WebGL. |

**Further sites I chose (beyond the owner's list):**

| Site | Desktop | Phone | Script | Observation |
|------|---------|-------|--------|-------------|
| Unseen Studio (unseen.co) | 1 canvas, three.js | same | 655 kB | Soft light, grain and fog as brand texture. |
| Abeto (abeto.co) | three.js, no canvas at 5 s | same | 133 kB | Tiny first load; the 3D arrives after the page is usable. |
| Immersive Garden (immersive-g.com) | 6 canvases | 12 canvases | 543 kB | Several small canvases instead of one: per-section scenes. |
| Awwwards — Experimental collection | DOM, no canvas | same | 1540 kB | A directory, not a world: a source of current entries, not a technique. |
| Leeroy WebGL collection (leeroy.ca) | 1 WebGL canvas, three.js | same | 879 kB | Even the collection page is a WebGL scene: a curator signalling the bar. |
| FWA (thefwa.com) | DOM, no canvas | same | 1631 kB | Award directory. Cross-check for current winners, not a technique. |
| webdesignawards.io — WebGL | DOM, no canvas | same | 180 kB | Directory of 2026 award-winning WebGL sites. |

The directory rows are sources, not references: of the further sites, Unseen, Abeto, Immersive
Garden and the Leeroy collection page are the ones whose techniques we use.

## Techniques we take, and how

| # | Technique (source) | Where we use it | How |
|---|--------------------|-----------------|-----|
| 1 | One continuous world on a scroll timeline (DeepSee, Atmos) | Both concepts | Scroll gives a continuous chapter position `s` (0 = hero … 7 = call to action). The camera and the world are pure functions of `s`, so any scroll position renders the same frame (also used for posters). |
| 2 | One material carries the brand (Igloo's ice) | C1: dark machined metal + one filament of light. C2: light-as-wind particles. | One shader per world, one accent colour. |
| 3 | Morphing particles per section (Igloo, BlueYard) | C2 | Every particle computes its target for each chapter in the vertex shader; a staggered morph with turbulence in between. No CPU per particle. |
| 4 | Signature hero object that reacts to the cursor (Lusion, Oryzo) | Both: **the vane** | The vane turns to face the cursor (spring-damped angle). On touch it follows the last touch point. |
| 5 | Shader post: chromatic aberration, bloom, grain (Igloo transitions) | Both | One combined pass: mip-chain bloom, grain, vignette; chromatic split grows with scroll speed = the cinematic transition. |
| 6 | Magnetic UI (Lusion, Awwwards set) | Both CTAs | The button leans toward the cursor within 120 px. Off for touch and reduced motion. |
| 7 | Sound designed with motion, off by default (Igloo) | Both | Synthesised with WebAudio (no files): C1 an escapement tick locked to the mechanism; C2 wind whose pitch follows scroll speed. |
| 8 | GPU gate (Active Theory) | Both | A software rasteriser (SwiftShader, llvmpipe) gets the static render, never a 2 fps slideshow. |
| 9 | Lighter phone path (BlueYard, Mat Voyce, Iventions) | Both | Tier 1 on phones: DPR ≤ 1.5, 60 % render scale, 30 k particles / 56 ray steps; the poster stays if WebGL2 is missing. |
| 10 | Small boot, world after first paint (Igloo, Abeto) | Both | HTML headline and CTA paint first; the world starts on `requestIdleCallback` (2 s cap), fades in over a poster of itself. |
| 11 | One loud accent on near-black (Lando Norris) | Both | C1 ion `#5CE1FF`, C2 filament `#FF8A52`, on `#07080A`. |

## What we will not take
Video standing in for real-time graphics (Prometheus), 1.4 MB first loads (Atmos), "not supported"
walls (Active Theory: we show a static render instead), and any cursor effect that hides the text.
