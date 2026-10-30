# Immersive web references — owner research, 2026-10-30

Research commissioned by the owner for change request 2 in `docs/product/BRIEF.md`. It answers one
question: **what do the most celebrated futuristic websites do that our current pages don't?**
Agents: learn from these, never copy them. Open each live site on a laptop and on a phone before you design.

## Why our current pages look basic

The concept C build (PRs #93, #104) faithfully followed the 29 October limits: 35 kB of script, a 15 kB
hero and no 3D library. Under those limits the only option was SVG, so the result looks like
documentation:

1. **The visual vocabulary is boxes and lines.** Rectangles joined by connectors, card rows and
   flowcharts read as a slide deck, not as an experience.
2. **There is no light, depth or material.** Flat fills, with no lighting, reflection, glow, fog, grain
   or real 3D.
3. **The layout is a template.** A centred hero, then alternating text and picture rows, then a footer.
4. **Motion is decoration on top of static pictures.** It is not a world the visitor moves through.

## Reference sites

| Site | Who / recognition | What makes it remarkable | Borrow the principle |
|------|-------------------|--------------------------|----------------------|
| [Igloo Inc](https://www.igloo.inc) | Abeto with Bureaux · Awwwards Site of the Year 2024; Webby 2026 honoree | Procedurally grown ice crystals hold each project. Houdini particle simulations swirl into a shape for each link. The UI is drawn in WebGL, with shader glitches and SDF text scrambles. Transitions use chromatic aberration and frost. Sound is synced to the particles. The intro renders in real time with shaders, keeping files small. Stack: three.js, three-mesh-bvh, GSAP, Svelte. ([case study](https://awwwards.com/igloo-inc-case-study.html)) | One material world (ice) carries the whole brand. The navigation *is* the 3D scene. Text effects come from shaders, not DOM. |
| [BlueYard](https://www.blueyard.com) | Unseen Studio | A bespoke nebula of 30,000+ particles. Clusters represent the industries the firm invests in, and the nebula is the navigation. Houdini animations are baked to compressed textures for WebGL. ([project](https://unseen.co/projects/blue-yard/)) | An abstract particle "galaxy" that *maps the business*. This fits a company with six services. |
| [Oryzo](https://oryzo.ai) | Lusion | Keynote-style 3D product storytelling around one hero object. Seamless scene-to-scene transitions, deliberate restraint and deadpan humour. ([behind the scenes](https://blog.lusion.co/oryzo-bts-part-1-7-concept-and-creative-direction)) | One hero object stays at the centre of every scene. Premium pacing beats effects everywhere. |
| [Lusion](https://lusion.co) | Lusion (studio site) | Shader and particle research, physics-driven 3D and cursor-reactive scenes. | Interaction that feels physical: the scene responds to the cursor like matter. |
| [Lando Norris](https://landonorris.com) | Awwwards Site of the Day, 17 Nov 2025 (8.18), plus Developer Award; animations/transitions scored 8.6 ([Awwwards](https://www.awwwards.com/sites/lando-norris)) | One electric accent (`#D2FF00`) on near-black (`#111112`). Bold type, high-energy transitions. | One loud accent colour on black reads as "fast and modern" instantly. |
| [Bruno Simon](https://bruno-simon.com) | Awwwards Site of the Month (Nov 2019); new version 2025 ([Creative Bloq](https://www.creativebloq.com/news/3d-car-portfolio)) | The portfolio is a drivable three.js world with physics. | Play turns a visitor into an explorer. |
| [Active Theory](https://activetheory.net) | Studio site | Real-time WebGL worlds that also run on phones. | Mobile is a first-class 3D target, not an afterthought. |
| [DeepSee Commerce](https://deepseecommerce.com) | Hon Tran ([case study](https://www.hontran.dev/blog/webgl-website-examples)) | A three.js scene with a scroll-driven camera, depth fog and light scattering, built on an iceberg metaphor. DPR capped, renders only when visible, tuned for mid-range Android. | Scroll moves the *camera*, not the page. Performance comes from discipline. |
| [Iventions](https://iventions.com) | Awwwards Site of the Day; CSSDA Website of the Month, Oct 2025 | Each project is a spotlit installation in a three.js scene, revealed in pace with GSAP. | Lighting turns content into an exhibition. |
| [Atmos](https://atmos.leeroy.ca) | Leeroy | Scrolling flies the visitor through a cloudy sky while the story unfolds. | Scrolling as flight: a journey, not a list. |
| [Prometheus Fuels](https://prometheusfuels.com) | — | WebGL storytelling that explains a technical process. | A deep-tech process made tangible in 3D. This is our job too. |
| [Spaace](https://spaace.io) | — | Intense, high-end WebGL for a gaming audience. | How far "bold" can go. |
| [Mat Voyce](https://matvoyce.tv) | GSAP Site of the Year 2025 nominee | Kinetic typography: letters stretch, snap and recombine on scroll. | Type itself can be the spectacle. |
| [Toom Archives](https://immersive-g.com/projects/aten7) | Immersive Garden | Worldbuilding as a site. | Atmosphere and art direction at agency-top level. |

Collections to browse for more: [Awwwards experimental](https://www.awwwards.com/websites/experimental),
[Leeroy WebGL collection](https://leeroy.ca/en/collections/best-webgl-immersive-sites) and
[WebGL on webdesignawards.io](https://www.webdesignawards.io/technology/webgl).

## What the best immersive sites share

Sources: [Igloo case study](https://awwwards.com/igloo-inc-case-study.html),
[Digital Strategy Force on 2026 Awwwards](https://digitalstrategyforce.com/journal/why-are-immersive-experiences-dominating-the-2026-awwwards/),
[svilenkovic on 2026 3D](https://svilenkovic.com/3d/fwa-2026-3d). The vendors' own statistics are not
verified, so only the practices are listed here.

- **One continuous real-time 3D world.** The page is a camera journey through it, driven by a
  normalised scroll position (0 → 1) on a master timeline.
- **GPU particles and custom GLSL shaders** for light, fog, refraction, chromatic aberration, bloom and
  grain. These replace flat illustration entirely.
- **Morphing.** One particle system forms a different shape for each section or link (Igloo, BlueYard).
- **The UI belongs to the scene.** WebGL text effects (SDF scramble, glitch), magnetic and
  cursor-reactive elements, and transitions between scenes and pages.
- **Sound designed with the motion.** It is always optional and off until the visitor turns it on.
- **Discipline makes it fast:**
  - Detect the GPU and device tier before the first scene. Scale particles, resolution and
    post-processing to match.
  - Cap the device pixel ratio.
  - Compile shaders and load textures in the background.
  - Compress assets (KTX2/Basis textures, Draco/Meshopt geometry).
  - Render only while visible.
  - Keep every scroll frame under about 4 ms.
  - Give a beautiful static fallback to devices without WebGL, with reduced motion or with data saver.
  - Offer WebGPU where it helps, with WebGL2 as the baseline.

## Hard no-gos for Clockvane

- Boxes joined by arrows, flowcharts, card grids or icon rows as the main visual. Flat SVG
  illustration as the hero.
- Stock 3D blobs, robots, glowing brains, purple "AI" gradients, matrix rain.
- Autoplay video backgrounds standing in for real-time graphics.
- Effects that hide the message: the headline and the call to action are readable at once on every
  device.
