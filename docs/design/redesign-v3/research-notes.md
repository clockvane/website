# Redesign v3 — research notes (Gate 2d, #116)

The owner asked for directions that are *completely different* from concepts 1–4. Those four are
all dark worlds made of particles or metal. These notes list what we borrow from the best animated
sites, and how each technique is rebuilt in our own code. Nothing in the prototypes is copied or
loaded from these sites.

## How the sites were opened
On 2026-10-30 each site was opened live in headless Chromium at 1440 × 900 (desktop) and
390 × 844 (phone, mobile emulation), with a 5-second wait, a screenshot and a check of its canvas
and script tags. Script: `.agentops-scratch/visit.mjs` (not committed).

| Site | Desktop | Phone | What we saw |
|---|---|---|---|
| bruno-simon.com | 200, 1 canvas | 200, 1 canvas | Full-screen three.js world, drivable toy car |
| messenger.abeto.co | 200 | 200 | WebGL bundle (`webgl-*.js`). Tiny-planet scene starts after a tap |
| activetheory.net | 200, "Not Supported" | same | Refuses software WebGL. That is a lesson in itself: **we always show a static render instead of a refusal** |
| matvoyce.tv | 200, 1 canvas | 200, no canvas | Next.js app. The WebGL layer is dropped on the phone and the type carries the page |
| obys.agency | 200, 1 canvas | 200, 1 canvas | Type-led page with a WebGL hover layer |
| locomotive.ca | 403 (bot challenge) | 403 | Blocked to headless browsers. Notes come from earlier public visits and the studio's open-source Locomotive Scroll |
| unseen.co | 200, 1 canvas | 200, 1 canvas | WebGL scene with editorial type |
| landonorris.com | 200, 21 canvases | 200, 21 canvases | Webflow site with many small canvas layers and huge display type |

## Concept 5 — Miniature World: what we borrow
| From | Technique | How we use it |
|---|---|---|
| Bruno Simon | A toy-scale world you *play with*: low-poly, soft light, physical humour | Low-poly island built from 6 primitives (box, cylinder, cone, pyramid, sphere, quad). Drag orbits the camera and springs back |
| Bruno Simon | Contact shadows instead of costly shadow maps | Soft radial "blob" shadows under every object (one blended quad each). No shadow pass, so it stays cheap on phones |
| Abeto Messenger | Tiny planet, bright daylight palette, the whole world in one frame | A round island in a pale sea with foam that rings the shore. The hero frames the whole island; each chapter dives toward one district |
| Abeto Messenger | Everything is gently alive | Parcels on the belt, flying documents, a draining gauge, a train that waits and then leaves, a crane, drifting clouds, live clock hands and a turning vane |
| Active Theory | Camera choreography driven by scroll, with damping | Each section maps to a camera state (azimuth, distance, height, target). The camera eases between them with critical damping, and the image is shifted off-centre so the copy card never covers the subject |
| Active Theory | In-world labels | Hover (or tap) near a district to show a card pinned to its 3D position |

## Concept 6 — Kinetic Editorial: what we borrow
| From | Technique | How we use it |
|---|---|---|
| Mat Voyce | Type is the hero; it drops WebGL on the phone | Hero = 4 lines of uppercase type at up to 15 % of viewport height. The one WebGL band is decoration only |
| Obys | Characters rise out of line masks on load | Headings are split into characters (SplitType-style, about 40 lines of our own code). Each one rises out of an `overflow: clip` line, staggered 22 ms |
| Obys / Unseen | WebGL displacement on hover | "CLOCKWORK" is drawn to a texture. A fragment shader ripples it around the pointer, drifts it sideways and bends it with scroll speed |
| Locomotive | Smooth scroll that does not hijack | Native scrolling only. Transforms *follow* the scroll with a lerp, so the motion has inertia while keyboard, find-in-page and screen readers work as usual |
| Lando Norris | Colour-block chapters and big numerals | Six horizontal panels in lime / ink / paper. A giant thin numeral slides at a different speed from the title (parallax) |
| Lando Norris / Mat Voyce | Variable-font weight as motion | Public Sans `wght` 100–900: titles go from thin to heavy as a panel centres, and the hero thins and stretches as you leave it |

## Four more of the best animated sites (our own picks)
| Site | Recognition | Technique worth taking |
|---|---|---|
| Igloo Inc (igloo.inc) | Awwwards Site of the Year 2024 | Procedural ice and particle shaders, with the UI set as precise technical type. Shows how far a single material can go |
| Lusion (lusion.co) | Several Awwwards SOTD / Developer awards | Physics-driven interactive 3D hero with a fast HTML fallback. A good reference for the GPU-tier approach |
| Immersive Garden (immersive-g.com) | Awwwards Agency of the Year nominee, many SOTDs | Cinematic camera paths through a single scene, with copy in calm HTML cards. Close to Concept 5's structure |
| Resn (resn.co.nz) | FWA and Awwwards regular | Playful, toy-like interactions that reward curiosity. Fits the "delight" tone of Concept 5 |
| Studio Freight / Darkroom (studiofreight.com) | Awwwards SOTD, makers of the Lenis smooth-scroll library | Native-first inertial scrolling. We follow the same principle: smooth, but never jacked |

## What we deliberately did not take
- Loading screens and "click to enter" gates (Abeto, Active Theory). Our headline and call to action
  must be readable at first paint.
- Scroll-jacking and custom scrollbars. They break keyboard and screen-reader use.
- Sound on by default.
