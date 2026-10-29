# ADR-004: Motion and visual-effects architecture

| Field | Value |
|-------|-------|
| Status | Proposed — accepted when this PR merges |
| Date | 2026-10-29 |
| Deciders | tech-lead (author) · owner (@MohammedAbdulFarhan08) final say at Gate 2b |
| Traces to | `docs/product/BRIEF.md` → "The feel" and "Not bloated — hard limits" · [ADR-001](ADR-001-stack.md) · [nfr.md](../architecture/nfr.md) P-1…P-11, SEC-1 · issue #79 |

## Context
The owner's change request asks for a futuristic, motion-rich redesign (a signature interactive hero,
"living" service visuals, a scroll-driven "How we work", page transitions, micro-interactions) that is
**not bloated**. The brief sets hard limits that Lighthouse and CI enforce:

| Limit | Value |
|-------|-------|
| Lighthouse mobile, every key page | ≥ 95 in all four categories |
| LCP / CLS / INP | ≤ 2.0 s lab / ≤ 0.05 / ≤ 200 ms |
| JavaScript per page (compressed), all effects included | ≤ 35 kB; hero visual code ≤ 15 kB |
| CSS per page (compressed) | ≤ 40 kB |
| Fonts | ≤ 3 files, ≤ 120 kB, self-hosted |
| Whole page (compressed) | ≤ 600 kB |
| Not allowed | client-side frameworks for effects, heavy 3D libraries, autoplay video backgrounds, third-party scripts, stock imagery |
| Effects | transform/opacity only, pause off-screen and in background tabs, respect reduce-motion and data-saver, static fallback without WebGL, all content usable without JS |

Until now the architecture allowed "exactly one script" (the contact-form enhancement) and P-4 capped JS
at 5 kB outside Contact. ADR-001 (Astro static, zero JS by default, no UI framework) stays in force; this
ADR decides **how** motion is built inside those rules, so the designer explores within real limits
(#80) and engineers know which techniques are allowed.

## Options considered
- **A. CSS only** — keyframes, transitions, `@property`, scroll-driven animations, cross-document View
  Transitions, SMIL-free SVG animated with CSS. Zero JS.
- **B. CSS + one small vanilla TypeScript motion controller** — A, plus one shared module (target
  ≤ 5 kB) that does what CSS cannot: IntersectionObserver triggers, pausing, reduced-motion /
  Save-Data detection, small pointer interactions.
- **C. B + a Canvas 2D or hand-written WebGL hero** — B, plus one lazily loaded hero renderer
  (≤ 15 kB compressed, no library) with a static SVG/CSS fallback.
- **D. An animation library** — GSAP (+ ScrollTrigger), Motion, or Three.js for the hero. Sizes are
  approximate and must be re-measured before any future reconsideration: GSAP core + ScrollTrigger is
  in the tens of kB compressed; Three.js is well over 100 kB — on its own above the whole 35 kB budget.

### Scored matrix (1 = poor, 5 = best; weight in brackets)
| Criterion (weight) | A. CSS only | B. CSS + controller | C. B + Canvas/WebGL hero | D. Library |
|---|---|---|---|---|
| Fits the budgets: JS ≤ 35 kB, hero ≤ 15 kB, Lighthouse ≥ 95 (5) | **5** — 0 kB JS | **5** — ≈ 5 kB | **4** — ≤ 20 kB of effects JS, lazily loaded after LCP | **1** — library alone uses most or all of the budget; Three.js breaks it |
| Can deliver the brief's experiences (signature hero, living services, scroll journey, transitions) (5) | **2** — no interactivity, no pausing logic, scroll timelines not in every engine | **4** — everything except a rich generative hero | **5** — all of it | **5** — all of it |
| Accessibility and resilience: reduced motion, no-JS, Save-Data (4) | **5** — `prefers-reduced-motion` in CSS; nothing to break | **5** — one place for all motion policy | **4** — extra fallback path to maintain and test | **3** — library defaults must be overridden; more to audit |
| Security / CSP `script-src 'self'` (3) | **5** | **5** — bundled first-party module | **5** — same, no `eval`, no workers from blobs | **4** — first-party bundle possible, but bigger supply-chain surface |
| Main-thread cost / INP on a mid-range Android (4) | **5** — compositor-only animations | **5** | **4** — needs a strict frame loop (pause, idle stop) | **3** — JS-driven tweens and scroll handlers |
| Maintainability and dependency risk (3) | **5** — no dependencies | **5** — one small module we own | **4** — hand-written shader / canvas code is ours to maintain | **3** — external API, licence and upgrade churn |
| Portability, no host lock-in (2) | **5** | **5** | **5** | **5** |
| **Weighted total (max 130)** | **115** | **125** | **114** | **85** |

B scores highest, but on its own it cannot deliver the brief's signature hero. C costs 11 points for one
optional, isolated module. **Decision: B as the base for every page, with C's hero renderer allowed on
the home page only (and on at most one other page with an ADR note), and D rejected.**

## Decision
### 1. Layers, in the order we reach for them
1. **HTML + CSS first.** If CSS can do it, CSS does it. Content and layout never depend on motion.
2. **One motion controller** — `src/scripts/motion.ts`, one first-party ES module, ≤ 5 kB compressed,
   no dependencies. It owns: the motion policy (§3), IntersectionObserver triggers (adds a state
   class / `data-state` attribute; CSS does the animating), pausing, and small pointer interactions.
   Components never add their own observers or `requestAnimationFrame` loops; they register with
   the controller.
3. **One hero renderer (optional)** — `src/scripts/hero/` loaded with a dynamic `import()` by the
   controller only when the policy allows it (§3) and after the page is idle. Canvas 2D by default;
   hand-written WebGL only if Canvas 2D cannot do the concept. ≤ 15 kB compressed including shaders.

### 2. JavaScript budget per page (compressed; enforced by CI — see §6)
| Bucket | Budget |
|--------|--------|
| Motion controller (`motion.ts`) | ≤ 5 kB |
| Hero renderer (home, plus one approved page at most) | ≤ 15 kB |
| Contact-form enhancement (Contact page) | ≤ 15 kB (unchanged) |
| Any other first-party script (needs a PR reason, ADR-001 rule) | remainder |
| **Total, any page** | **≤ 35 kB**; third-party JS: **0** |

### 3. Motion policy (one place, in the controller and in CSS)
| Condition | Behaviour |
|-----------|-----------|
| `prefers-reduced-motion: reduce` | No hero renderer is loaded. All scroll-driven, looping and parallax motion is off; elements are shown in their final state. Only instant or ≤ 150 ms opacity changes for feedback (focus, hover, validation) remain. View Transitions are disabled (`@media (prefers-reduced-motion: reduce) { @view-transition { navigation: none; } }`). The static design is designed, not degraded (brief, "Calm on request"). |
| `navigator.connection.saveData` true, or `prefers-reduced-data: reduce` where supported | Same as reduced motion for the hero (static fallback, renderer not downloaded); CSS micro-interactions stay. |
| Low-power hint: `navigator.hardwareConcurrency ≤ 4` **and** `deviceMemory ≤ 2` (where exposed), or the first 30 frames average > 20 ms | Hero switches to its static fallback and stops its frame loop. |
| No JavaScript | Every element is visible in its final state: hidden-until-revealed states are applied only under a `.js-motion` class the controller adds to `<html>`. No content, link or form depends on JS (P-10). |
| WebGL unavailable / context lost | Feature-detect `canvas.getContext('webgl2' \|\| 'webgl')`; on failure or `webglcontextlost`, show the static fallback. Never a blank box. |

### 4. Allowed techniques
| Technique | Rules |
|-----------|-------|
| CSS transitions and keyframes | Animate **`transform` and `opacity` only** (plus `filter: opacity()` and colour on small elements for micro-interactions). No animating `width`, `height`, `top/left`, `margin`, `box-shadow` or `filter: blur()` on large areas. `will-change` only while an animation runs. |
| `@property` animations | Allowed for typed custom properties (angles, percentages, colours) that drive gradients, rings and progress; must have an `initial-value` so the static state is correct where unsupported. Keep them on small elements: repainting a full-viewport gradient every frame costs INP. |
| CSS scroll-driven animations (`animation-timeline: scroll()/view()`) | Allowed for "How we work" and reveal effects, inside `@supports (animation-timeline: view())`. Engine support is not universal (Firefox status was unclear when this was written), so the unsupported path must show the final state, or the controller's IntersectionObserver adds the state class. No scroll-jacking: native scrolling speed is never changed, no `scroll-snap` on long pages. |
| View Transitions API | **Cross-document** transitions only (`@view-transition { navigation: auto; }` in CSS) — no client router, no SPA. Short (≤ 300 ms), off under reduced motion. Same-document `document.startViewTransition()` allowed for in-page state changes inside the controller, with a no-API fallback that just swaps the state. |
| SVG animation | Inline or external SVG animated with CSS (`stroke-dashoffset`, `transform`, `opacity`). SMIL (`<animate>`) is not allowed (harder to pause and to disable for reduced motion). Decorative SVG has `aria-hidden="true"`; meaningful SVG has a `<title>` or a text equivalent. |
| IntersectionObserver | Only through the controller: **one** shared observer per threshold set, unobserve after one-shot reveals, used both to start and to **pause** animations that leave the viewport. No `scroll` event listeners for animation. |
| Canvas 2D / WebGL hero | Rules: (a) feature detection and a static fallback (SVG or CSS) rendered in the HTML, so it is also the LCP-safe and no-JS state; (b) the canvas is **not** the LCP element — the headline is, and it renders without waiting for JS; (c) loaded with dynamic `import()` after `requestIdleCallback` (or `load` + timeout); (d) pause with IntersectionObserver when off-screen and on `visibilitychange` when the tab is hidden; (e) **stop when idle**: no frame loop when nothing changes — run on interaction or for a bounded sequence, then stop; no infinite autoplay loop; (f) `devicePixelRatio` capped at 2; (g) canvas sized by CSS with fixed aspect ratio (CLS = 0); (h) no Web Workers from blobs, no `eval`, no WASM in v1; (i) release GPU resources on `pagehide`. |
| Pointer micro-interactions | `pointermove` handlers are passive, throttled to `requestAnimationFrame`, and write only `transform` / custom properties. Disabled for `pointer: coarse` where they add nothing. |

### 5. Not allowed, and why
| Not allowed | Why |
|-------------|-----|
| UI frameworks or islands for effects (React, Vue, Svelte, Solid, Lit…) | Runtime cost alone eats the budget; ADR-001 rejects them. |
| Animation libraries (GSAP, Motion, anime.js, Lottie players) | Tens of kB for things CSS + 5 kB of our code can do; extra supply-chain surface. Revisit only with a new ADR and measured numbers. |
| 3D engines (Three.js, Babylon, PlayCanvas) and model files (glTF) | Above the whole page JS budget; brief bans heavy 3D libraries and "generic 3D blobs". |
| Autoplay video backgrounds, animated GIF/WebP/APNG heroes | Page weight, LCP, data use; brief ban. |
| Third-party scripts, CDNs, remote fonts | CSP `script-src 'self'`, privacy, no third-party JS (P-4). |
| Inline scripts and inline event handlers (`onclick=…`), `eval`, `new Function`, `javascript:` URLs | Break CSP SEC-1. Astro `<script>` must be processed (bundled to a file); `is:inline` is forbidden except JSON-LD (`type="application/ld+json"`, data, not executed). |
| `style` attributes set from the server for animation | CSP `style-src 'self'`. Setting `element.style.setProperty()` from our own script is fine (CSSOM is not blocked by CSP). |
| Scroll-jacking, smooth-scroll libraries, cursor replacements, infinite decorative loops | Hurt usability, accessibility (WCAG 2.2.2 Pause, Stop, Hide) and INP. |
| Animating layout properties or large-area blur | Causes layout/paint per frame; jank on mid-range Android. |
| Content hidden until JS runs (outside the `.js-motion` pattern) | Breaks no-JS reading (P-10) and SEO. |

### 6. Accessibility and keyboard / focus for interactive visuals
- Anything that moves for more than 5 s, or loops, has a visible **pause control** (WCAG 2.2.2) unless
  it is off under reduced motion **and** stops by itself within 5 s.
- Interactive visuals (e.g. the hero "clockwork") are operable with keyboard: real `<button>` elements
  (inside the DOM, not drawn on the canvas) for every action, visible focus (design-system focus
  ring), logical tab order, and `Escape` returns to a neutral state. Pointer-only gestures have a
  single-pointer / keyboard alternative (WCAG 2.5.1, 2.5.7).
- The canvas itself is `aria-hidden="true"`; the story it tells exists as text in the HTML. State
  changes that matter are announced through an existing `aria-live="polite"` region, sparingly.
- No flashing more than 3 times per second (WCAG 2.3.1). Focus is never moved by an animation.
- Text over animated backgrounds keeps AA contrast in every frame (test the worst frame).

### 7. CSP compatibility
The existing policy (nfr.md SEC-1) does **not** change: `script-src 'self'`, `style-src 'self'`, no
`'unsafe-inline'`, no `'unsafe-eval'`, no `worker-src` / `blob:` additions. To keep Astro from inlining
small bundled scripts, `astro.config.mjs` sets `vite.build.assetsInlineLimit: 0` (stylesheets are
already `inlineStylesheets: 'never'`). Shaders are string constants inside the hero module.

### 8. How CI proves the budgets
| Check | What it proves | Ticket |
|-------|----------------|--------|
| Lighthouse CI resource budgets (`budget.json` or `resource-summary` assertions in `tests/e2e/lighthouserc.cjs`) on every key page, mobile preset, median of 3 | P-1…P-3, P-4 total script, P-5 CSS, P-6 fonts, P-8 page weight, P-9 requests, categories ≥ 95 | follow-up A |
| Bundle-size check over `dist/` (Vitest under `tests/unit/` or a build test reading `dist/_astro/*.js`, gzip size per chunk, per page sum) | Controller ≤ 5 kB, hero ≤ 15 kB, page total ≤ 35 kB; fails with the offending chunk name | follow-up B |
| `dist/` HTML scan: no `<script>` without `src` except `application/ld+json`, no `on*=` attributes, no `style=` attributes | CSP compatibility | follow-up B |
| Playwright project with `reducedMotion: 'reduce'` over key pages | Hero renderer not requested (network assertion), no running animations (`document.getAnimations()` empty after load), content in final state, axe passes | follow-up C |
| Playwright with JavaScript disabled (existing P-10 run) extended to motion pages | All content visible, nothing stuck in a hidden state | follow-up C |
| Playwright with WebGL disabled (`--disable-webgl`) on home | Static fallback visible, no console errors | follow-up C |
| Review checklist (standards.md) | Only transform/opacity animated, pause off-screen / hidden tab, idle stop | PR review |

**Follow-up tickets** (the EM creates them; they run after Gate 2b, before any effect is merged):
- **A.** `ci: Lighthouse CI resource budgets for P-4/P-5/P-6/P-8/P-9` (agent: qa / devops).
- **B.** `test: bundle-size and inline-script checks over dist/` + `assetsInlineLimit: 0` (agent: sde).
- **C.** `test(e2e): reduced-motion, no-JS and no-WebGL Playwright runs` (agent: qa).
- **D.** `feat(motion): motion controller src/scripts/motion.ts with policy + observers` (agent: sde),
  `Depends on` A and B.
- **E.** `feat(home): signature hero renderer` — after the concept is chosen at Gate 2b, `Depends on` D.

### 9. Feasibility input for the designer (#80)
Prototypes are judged against this ADR: Lighthouse mobile ≥ 95 report attached, the JS bytes of the
prototype listed against the §2 buckets, and a reduced-motion screenshot. A concept that needs a
library from §5 is not buildable without a new ADR.

## Consequences
- **Good:** the brief's experiences are possible while the site stays CSS-first; one module owns all
  motion policy, so reduced-motion and Save-Data behaviour is consistent and testable; no new runtime
  dependency; CSP unchanged.
- **Cost:** a hand-written hero renderer is our code to maintain; every animated component needs a
  designed static state; three new CI checks add a few minutes to CI.
- **Risk:** scroll-driven animations and cross-document View Transitions are not in every engine.
  Mitigation: both are progressive enhancement — the site is complete without them.
- **Governance:** the designer's role file still says "motion is CSS only". This ADR allows a small
  amount of first-party JS; the owner updates that file (agents do not change governance).

## How we would migrate away
- **To more capability (a library):** the controller is the only place motion code is wired, so a
  library could replace its internals behind the same `data-state` / register API; requires a new ADR
  with measured bytes and the same budgets.
- **To less (CSS only):** delete `src/scripts/motion.ts` and the hero module; because every element
  already has a designed final state without JS, pages keep working — only the enhancement is lost.
- **Off Astro:** the controller and hero are plain TypeScript modules with no framework API, so they
  move to any static generator unchanged.
