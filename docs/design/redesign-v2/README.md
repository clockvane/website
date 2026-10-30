# Redesign v2 — two immersive worlds (Gate 2c)

Change request 2 (`docs/product/BRIEF.md`, 2026-10-30): the concept C pages were too basic. These are
two real-time WebGL worlds, each built around the Clockvane idea: **precision clockwork that runs by
itself, and a vane that shows direction.** Open them on a laptop and on a phone:

- **Concept 1 — The Movement:** `/labs/concept-1/`
- **Concept 2 — The Vane Field:** `/labs/concept-2/`

Add `?static` to see the static render, `?tier=1` to force the phone tier, or `?s=3` to freeze the
world at chapter 3. Research: `research-notes.md`. Evidence: `evidence/`.

**Recommendation: Concept 2, The Vane Field. Merging this PR approves Concept 2.**

## What both share
- The headline, lede and call to action are plain HTML, painted first. The fonts are self-hosted, and
  there are no third-party requests and no library. Each world is raw WebGL2 with hand-written GLSL;
  the shaders move into three.js `ShaderMaterial` inside the ADR-005 worker for production.
- One continuous world. Scrolling moves through 8 chapters: the hero, then the six services in copy-deck
  order, then the call to action. Each service is a **transformation of the same world**. There are no
  boxes, arrows, cards or icons.
- The world interface:
  1. **The vane** turns to face the cursor (or the last touch).
  2. A **magnetic CTA** leans toward the cursor.
  3. **Cinematic transitions**: a chromatic split that grows with scroll speed, plus bloom and grain, in one post pass.
  4. **Sound**, off by default, is synthesised with WebAudio, with no audio files.
- The policy follows ADR-005 §3–5:
  - The world starts after first paint (idle callback, 2 s cap).
  - Tiers come from pointer, cores, memory and viewport.
  - DPR is capped at 1.5, 1.75 or 2 by tier, and adaptive quality steps down on p90 frame time.
  - Rendering pauses when the tab is hidden.
  - These all get the **static render of the same world** (a poster rendered from the scene):
    - reduced motion
    - data saver
    - no WebGL2
    - software GPU
    - ≤ 2 GB memory
    - a scene error

## Concept 1 — The Movement
**World:** an endless precision mechanism of machined gear rings on one filament of electric-blue light
(`#5CE1FF`). The camera flies along the axle, and the vane hangs at the centre. It is raymarched signed
distance fields, so there is no geometry to download.

| Chapter | Transformation of the same world |
|---------|----------------------------------|
| Hero | Rings drift loose and out of step. The vane turns to the cursor. |
| 01 Business process automation | The loose rings **lock** into one mechanism and turn together (meshing speeds). |
| 02 AI automation | The vane grows and lights up, and the filament brightens: direction, found. |
| 03 AI cost optimization | Every second ring falls away and the rest run finer. Fewer parts, the same motion. |
| 04 Cloud and DevOps | The mechanism is copied into a field of identical mechanisms, all in step. |
| 05 Websites and apps | The gears flatten into a clean, concentric dial face. |
| 06 Custom software | Every gear is re-cut to one new tooth shape, made to fit. |

**What a first-time visitor remembers:** flying *inside* a watch movement made of light and dark
metal, with the vane turning to look at them. **Why it could be a Site of the Day nominee:** cinematic
material and light, a raymarched world with no assets (the same craft as Igloo), and a camera journey
with real depth.
**Risk:** raymarching is fill-rate heavy. Phones need tier 1 (60 % render scale, 56 steps). In a
software renderer it falls to 2 fps on desktop, which is why software GPUs get the poster. Some service
transformations (cost, custom software) are subtle without the caption.

## Concept 2 — The Vane Field (recommended)
**World:** wind made of light. Up to 200 k particles in filament orange (`#FF8A52`) stream past a
monumental vane built from the same particles. Every particle computes its own target for each chapter
on the GPU, so the same light re-forms, with turbulence in between, like wind changing direction.

| Chapter | Transformation of the same world |
|---------|----------------------------------|
| Hero | Wind parts around a giant particle vane that turns to the cursor. |
| 01 Business process automation | Scattered motes fall into seven lanes and move as one. |
| 02 AI automation | The stream is read as it passes; the few unclear pieces lift out and wait in a holding orbit for a person. |
| 03 AI cost optimization | The whole wind tightens into one fine ring. Far less volume, the same flow. |
| 04 Cloud and DevOps | The light stacks into identical tiers, and a release wave rises through them. |
| 05 Websites and apps | The wind settles into one clear, flat page. |
| 06 Custom software | One strand winds into two parts that lock together. |
| Call to action | The vane re-forms. |

**What a first-time visitor remembers:** "the whole site is one cloud of light that rebuilds itself
for every service", plus the vane following their cursor. **Why it could be a Site of the Day nominee:**
it is the morph-particle language of the current winners (Igloo, BlueYard), here with a story per
morph that matches the copy word for word, and it holds frame rate on phones.

## Concept against audience (PRD audiences)

| Audience | What they need in 5 seconds | Concept 1 | Concept 2 |
|----------|-----------------------------|-----------|-----------|
| Small-business owners | "These people make my boring work run by itself" — no jargon | Impressive, but gears read as "engineering". | **Better.** Lanes, a sorted stream and a page are literal pictures of their work. |
| Startup founders and CTOs | Proof of craft; fast on their phone | **Strongest wow**, but heavier on a phone GPU. | Strong wow; 60 fps phone tier. |
| Operations and IT managers | A clear process story, with a person in the loop | Lock-in reads well; the AI step is abstract. | **Better.** The "unclear pieces wait for a person" morph matches the AI automation promise. |
| Everyone on mid-range Android | A readable page at once; no jank | Needs heavy down-scaling. | **Cheaper.** One draw call, no per-frame CPU. |

**Why Concept 2.**
- Every service transformation tells the copy-deck story *literally*, so the spectacle explains the business instead of decorating it.
- It is far cheaper per pixel than raymarching, so mid-range phones get the real world, not the poster.
- It maps one-to-one onto ADR-005: three.js `Points` + `ShaderMaterial` in the worker, with GPGPU later.

Concept 1's metal-and-filament look can come back as the material of the call-to-action chapter in a later iteration.
**Merging this PR approves Concept 2 (The Vane Field)** as the direction for the build tickets.

## Open points for the owner (answered at this gate)
- The DRAFT world captions under each service are design text. The copy writer replaces them in the copy deck.
- [[PLACEHOLDER: frame rate on a real mid-range phone — measured by the owner on the preview link; the agent machine has no GPU]]
