# Redesign v3 — two completely different directions (Gate 2d, #116)

The owner's feedback on PR #113: concepts 3 and 4 were too close to 2, and he wanted completely
different concepts. Concepts 1–4 are all dark worlds of particles or metal. This round adds two
directions that share none of that:

- **Concept 5 — Miniature World:** `/labs/world/` — a bright, toy-like island in real-time 3D.
- **Concept 6 — Kinetic Editorial:** `/labs/kinetic/` — type-led motion design, with one WebGL ripple.

Concepts 1–4 stay on PR #113's preview. The owner chooses among all six.

**Recommendation: Concept 5, Miniature World. Merging this PR approves Concept 5.**

Research and borrowed techniques: [`research-notes.md`](research-notes.md). Evidence (screenshots,
recordings): [`evidence/`](evidence/).

## Concept 5 — Miniature World (recommended)
A round island where the business runs by itself. A clock tower crowned by a weather vane (the
Clockvane mark) stands at its centre, with live clock hands and a vane that turns in the wind. The
palette is daylight: grass, sand, pale sea and one strong tangerine accent. Scrolling flies the
camera from the whole island down to each of six districts. Dragging orbits the camera, and it
springs back. Hovering or tapping a district pins a label card to it in 3D.

| Chapter | District | What runs by itself |
|---|---|---|
| Hero | The whole island | Train on its loop, clouds, clock and vane |
| 01 Business process automation | The sorting yard | Order parcels glide along the belt and drop into the truck |
| 02 AI automation | The mail room | Documents fly to their desk. The unclear one waits under the lamp for a person |
| 03 AI cost optimization | The water tower | The spend gauge drains slowly while the garden stays green |
| 04 Cloud and DevOps | The depot | The release train waits, then leaves on time past identical stacked containers |
| 05 Websites and apps | The high street | A new shop-front website lights up |
| 06 Custom software | The workshop | A crane lowers a part made to fit. It clicks in with a flash |
| Call to action | The whole island, from above | — |

The copy is the same text as concepts 1–4 (DRAFT captions are marked). The headline, the call to
action and every chapter are plain HTML on paper cards: at the bottom of the screen on a phone,
and in a left column on desktop.

## Concept 6 — Kinetic Editorial
The type is the spectacle, with no 3D world. Electric lime, near-black ink and warm paper.
- The hero headline rises out of its line masks, then thins, stretches and waves as you scroll
  (Public Sans variable weight 100–900, skewed by scroll speed).
- A WebGL band shows the word "CLOCKWORK", which ripples around the pointer (and on its own on a phone).
- A ticker of automation events, marked DRAFT as illustrative. It has a Pause button (WCAG 2.2.2).
- Six services in one horizontal chapter driven by vertical native scroll, in colour-blocked panels.
  As each panel centres, its title snaps from thin to heavy, its sentence slides out of a mask and
  a giant numeral moves at its own speed.
- "Automation that runs like clockwork": the words fly in from both sides and recombine.
- There is no scroll-jacking: native scroll, with the transforms following it.

## All six against the audiences (PRD)
| Audience | Needs in 5 seconds | Concepts 1–4 (PR #113) | Concept 5 Miniature World | Concept 6 Kinetic Editorial |
|---|---|---|---|---|
| Small-business owners | "They make my boring work run by itself", no jargon | Impressive, but abstract: particles and metal read as "tech" | **Best.** A parcel belt, a mail room and a shop front are the owner's own business, shown literally and with warmth | Clear words and very confident, but no picture of the work |
| Startup founders and CTOs | Proof of craft, fast on a phone | Strong wow | **Strong.** A whole real-time world in 24 KB of our own WebGL, no library | **Strong.** Award-style motion design. Craft shows in the type |
| Operations and IT managers | A clear process story, with a person in the loop | 2 shows the person step abstractly | **Best.** "The unclear document waits under the lamp for a person" is literal | Told only in words |
| Anyone on a mid-range Android phone | Readable at once, no jank | Needs heavy down-scaling | Phone tier: DPR ≤ 1.5, fewer trees and parcels. Software GPU gets the static render | **Lightest.** One small shader, the rest is CSS transforms |
| Distinct from every template and from the competitors | Memorable, worth a screenshot | Dark sci-fi is common in the AI space | **Most distinctive.** A bright toy world is rare among automation agencies | Kinetic type is popular with studios, less so for a services company |

**Why Concept 5:** it is the only direction that *shows* the service to a non-technical owner. The
work runs itself in front of them, and it does so with delight instead of darkness. It meets the
owner's "immersive and unmistakably futuristic" brief through precision rather than sci-fi. Concept
6 is the safe, very fast runner-up. Its ticker and kinetic type could also be reused inside
Concept 5's call-to-action and footer.

## Performance, fallbacks, accessibility (both)
| | Concept 5 | Concept 6 |
|---|---|---|
| Lighthouse mobile (Perf / A11y / BP / SEO) | 100 / 100 / 96 / 60 | 98 / 100 / 100 / 60 |
| FCP / LCP / TBT / CLS | 1.1 s / 1.3 s / 0 ms / 0 | 1.0 s / 1.1 s / 160 ms / 0 |
| Page weight (Lighthouse) | 88 KiB | 51 KiB |
| Our script / CSS / HTML (raw bytes) | 24.1 KB / 4.8 KB / 5.9 KB | 10.2 KB / 8.1 KB / 6.3 KB |
| Posters (static render) | 93 KB desktop, 28 KB phone | none needed (type) |
| Third-party requests | none | none |

The SEO score of 60 is expected: the prototypes are `noindex`. Best practices for Concept 5 lose
4 points only for a missing `/favicon.ico` on the local test server.

- **First paint:** the headline and call to action are HTML/CSS. The 3D world (5) and the ripple
  (6) start after `load` in an idle callback.
- **Fallbacks:** `?static`, `prefers-reduced-motion`, data saver and no WebGL2 all get the static
  version. Concept 5 shows a rendered poster of the same island. Concept 6 drops all motion and
  stacks the six panels vertically. Concept 5 also uses the poster when the GPU is software-only
  (SwiftShader/llvmpipe), so Lighthouse measures that path. `?tier=1|2` forces the live world.
- **Scaling:** Concept 5 sorts devices into GPU tiers by renderer string, pointer type and device
  memory (phone tier: DPR cap 1.5, fewer objects). It drops to DPR 1 if the frame rate falls below
  40 fps, and stops when the tab is hidden. Concept 6's ripple stops when the band is off-screen
  or the tab is hidden.
- **Frame rate:** the headless software renderer (SwiftShader, CPU only, the worst case) reached
  20–23 fps for Concept 5. A real mid-range phone GPU is far faster. Measuring on a real phone
  needs the owner's device on the preview link.

## Contrast (computed with `.agentops-scratch/contrast.mjs`)
See the PR body for the full table: 22 pairs, all pass AA.
