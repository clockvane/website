---
name: design-quality
description: Enterprise-grade UI/UX quality rubric, live-site audit method and before/after evidence procedure (Playwright screenshots, computed-type scan, contrast, axe, Lighthouse). Load at the start of every principal-design-engineer run, and whenever a UI change is designed or verified.
---

# Design quality: rubric, audit and evidence

The standard: a careful buyer at a large company trusts the site on first sight, and a top product
designer finds nothing to fix. Measure first, judge second, change through the design system,
verify again.

## 1. Evidence tools (copy into `.agentops-scratch/`, never commit)

### 1a. Screenshot and type scan
`design-scan.mjs` takes full-page screenshots at four widths and measures every visible text block.
It flags the misuses listed in §2.1.

```js
// node .agentops-scratch/design-scan.mjs <baseUrl> <label> [/path ...]
// baseUrl: https://clockvane-website.pages.dev (live), https://pr-<N>.clockvane-website.pages.dev
// (PR preview) or http://localhost:<PORT> (npm run build && npx astro preview --port <PORT>)
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const [base = 'https://clockvane-website.pages.dev', label = 'before', ...only] = process.argv.slice(2);
const WIDTHS = [375, 768, 1280, 1440];
const out = `.agentops-scratch/shots/${label}`;

async function pagePaths() {
  if (only.length) return only;
  const xml = await (await fetch(new URL('/sitemap-0.xml', base))).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  return [...new Set(['/', ...locs, '/this-page-does-not-exist/'])];
}

function scan() {
  const RULES = {
    'display-paragraph': (t) => t.chars > 140 && t.size >= 22,
    'heavy-paragraph': (t) => t.chars > 140 && t.weight >= 600,
    'tight-leading-text': (t) => t.lines > 1 && t.size < 24 && t.lh < 1.4,
    'tight-leading-display': (t) => t.lines > 1 && t.size >= 24 && t.lh < 1.05,
    'negative-tracking-text': (t) => t.track < -0.005 && (t.size < 32 || t.chars > 90),
    'long-measure': (t) => t.lines > 1 && t.cpl > 80,
    'short-measure-body': (t) => t.lines > 2 && t.cpl < 35 && t.size <= 20,
    'small-body': (t) => t.chars > 60 && t.size < 15,
  };
  const found = [];
  const sel = 'h1,h2,h3,h4,h5,h6,p,li,blockquote,dd,dt,figcaption,td,th,label,summary,legend,a,button,span,div';
  for (const el of document.querySelectorAll(sel)) {
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'inline' || cs.visibility === 'hidden' || cs.display === 'none') continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const text = (el.innerText || '').replace(/\s+/g, ' ').trim();
    const size = parseFloat(cs.fontSize);
    const lhPx = cs.lineHeight === 'normal' ? size * 1.2 : parseFloat(cs.lineHeight);
    const lines = Math.max(1, Math.round(r.height / lhPx));
    const t = {
      el: `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''}`,
      text: text.slice(0, 60), chars: text.length, size, weight: Number(cs.fontWeight),
      lh: +(lhPx / size).toFixed(2), track: cs.letterSpacing === 'normal' ? 0 : +(parseFloat(cs.letterSpacing) / size).toFixed(3),
      lines, cpl: Math.round(text.length / lines), color: cs.color,
    };
    const hits = Object.entries(RULES).filter(([, f]) => f(t)).map(([k]) => k);
    if (hits.length) found.push({ ...t, hits });
  }
  return found;
}

const browser = await chromium.launch();
const report = {};
for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  for (const path of await pagePaths()) {
    await page.goto(new URL(path, base).href, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const slug = path.replace(/\/+$/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-/, '') || 'home';
    mkdirSync(`${out}/${width}`, { recursive: true });
    await page.screenshot({ path: `${out}/${width}/${slug}.png`, fullPage: true });
    report[`${width} ${path}`] = await page.evaluate(scan);
  }
  await ctx.close();
}
await browser.close();
writeFileSync(`${out}/scan.json`, JSON.stringify(report, null, 2));
for (const [where, items] of Object.entries(report))
  for (const i of items)
    console.log(`${where} | ${i.hits.join(',')} | ${i.el} | ${i.size}px/${i.weight} lh ${i.lh} track ${i.track}em ${i.cpl}cpl | "${i.text}"`);
console.log(`screenshots + scan.json in ${out}`);
```

Open the PNGs with your file-reading tool and look at them: hierarchy, rhythm, alignment and
density can only be judged by eye. Compare `before` and `after` at the same width.

### 1b. Contrast, accessibility, performance
- **Contrast:** use the script in `.claude/agents/ux-designer.md` (self-check 1). Flatten transparent
  colors onto their background first.
- **Accessibility:** `npm run test:a11y` (axe on every page). For a change, also tab through the
  changed pages at 375 and 1280 px and confirm visible focus and a logical order.
- **Performance:** `npm run test:lighthouse` and `npm run test:lighthouse:desktop`. Report the four
  category scores, LCP, CLS and the page weight.

## 2. Rubric (every item is a pass or fail)
### 2.1 Typography
- **Roles.** Each text has one role:
  - display (hero, closing): short, one sentence;
  - heading levels h2 to h4;
  - lead: one or two sentences, at most about 45 characters per line on wide screens;
  - body;
  - small or meta.

  A role is never borrowed for a different job. A 3-sentence paragraph is body or lead, never a
  display "statement" (the home "problem" paragraph, 357 characters at 28 px / 600 / line height
  1.1 / −0.025em, is the reference failure).
- **Body.**
  - 16–18 px, weight 400, line height 1.5–1.65, line length 60–75 characters (65 is ideal).
  - Paragraph spacing of about 0.75–1 em. Links underlined or otherwise unmistakable.
- **Headings.**
  - Line height 1.05–1.2 for large sizes, 1.2–1.3 for h3/h4.
  - Negative letter spacing only at 32 px and above: −0.01 to −0.03em, scaled to size.
  - Weight 600–700. Sentence case.
  - Each step in the scale is visibly distinct, at a ratio of about 1.2–1.333.
- **Scale.**
  - One modular scale in tokens, made fluid with `clamp()` between 375 and 1440 px.
  - No in-between sizes that only one component uses.
  - Each heading is clearly larger and stronger than the lead below it. The squint test passes.
- **Emphasis.**
  - Use weight or color, never both plus size.
  - Muted text (for contrast effects) still meets 4.5:1. Don't use grey and black to split one
    sentence unless it reads naturally aloud.
- **Fonts.**
  - Self-hosted, `font-display: swap`, a metric-matched fallback (no CLS), at most 2 families, and
    only the weights used.
  - Turn on tabular numerals for figures in tables.
- **Wrapping.**
  - `text-wrap: balance` on headings and `pretty` on body text.
  - No orphans in headlines.
  - Phone numbers and short labels never break (the `tel-non-breaking` rule in CI).

### 2.2 Layout and spacing
- **Rhythm.**
  - All spacing comes from the spacing tokens, on one 4/8 px rhythm.
  - Section padding is consistent by section type.
  - Related items sit closer together than unrelated ones (proximity).
- **Grid.** Content widths come from tokens. Text columns are never wider than the measure. Edges
  align with the grid.
- **Responsive.** Check 375, 768, 1280 and 1440 px:
  - no horizontal scroll;
  - nothing cramped at 375;
  - nothing floating in empty space at 1440;
  - images and cards keep their proportions.
- **Density.** Mobile reads like a designed mobile page, not a squeezed desktop page.

### 2.3 Components and interaction
- **One component per pattern.** Buttons, links, cards, tabs, form fields and notices each have one
  implementation. Variants are defined in `components.md`.
- **States.** Every interactive element has:
  - default, hover and active states;
  - a focus-visible indicator with at least 3:1 contrast;
  - disabled, loading, error and success states where they apply.
- **Targets.** At least 24×24 px (WCAG 2.5.8). Primary actions are at least 44 px tall.
- **Forms.** Each field has a visible label and inline errors linked to the field. There is an error
  summary on submit. Success is confirmed clearly. No placeholder-only labels.
- **Motion.**
  - Motion has a purpose: 150–300 ms, standard easing.
  - Nothing moves without the visitor's intent except clearly labelled example marquees, and those
    have a pause control.
  - `prefers-reduced-motion` turns non-essential motion off (ADR-004).

### 2.4 Color and surfaces
- Color comes from role tokens (text, muted, accent, surface, border, danger, success), never raw
  values.
- Contrast is computed: 4.5:1 for text, 3:1 for large text, UI parts and focus indicators.
- Limit surface levels. Borders and shadows are consistent. One radius family.

### 2.5 Content and conversion
- Each page answers in its first screen: what this is, who it is for, and what to do next.
- One primary action per screen. Secondary actions look secondary.
- Headings are specific and benefit-led. Body copy is front-loaded and scannable.
- Trust comes from specifics that are true: the process, the scope, the response time, the privacy
  terms. No invented proof (rule 9).
- Every page has: a unique title and description, OG tags, structured data where it fits, a sitemap
  entry, and real 404, empty, loading and error states.

### 2.6 Engineering quality
- **CSS.** Use tokens and scoped component styles, not new global utility sprawl. No `!important`.
  No magic numbers. Use logical properties (`margin-inline`, `padding-block`).
- **HTML.** Semantic HTML first. ARIA only when no native element does the job.
- **JavaScript.** As little as possible, progressive enhancement, within the 50 kB budget per page.
- **Tests.** A design decision that matters gets a test, so a regression fails CI:
  - e2e assertions on roles, headings and links;
  - visual or type checks where they are cheap.

## 3. Severity
- **P0 (broken):** illegible or inaccessible text, a broken layout at a width, a failing contrast
  ratio, a keyboard trap, or a performance budget exceeded.
- **P1 (unprofessional):** a role misused (display paragraph), an inconsistent scale or spacing,
  missing states, a weak hierarchy on a key page.
- **P2 (polish):** alignment, rhythm, micro-interactions, wrapping, small copy improvements.
- **P3 (opportunity):** a feature or content addition that would help visitors decide.

## 4. Audit report format (`docs/design/audit/<date>.md`)
1. **Summary.** The top 5 problems by visitor impact, and the target state in two sentences.
2. **Scores.** A table of each rubric area per page (pass, fail, or partial) with the key
   measurement.
3. **Findings.** `ID | Severity | Page / element | Measured | Target | Why it matters | Fix (system-level)`.
4. **Plan.** Phases (foundations, components, pages, features). Each phase lists its ticket numbers.

Screenshots stay in `.agentops-scratch/`. The report quotes measurements, not images.

## 5. Before/after table for every UI PR
| Page @ width | Element | Before | After | Target |
|---|---|---|---|---|
| / @375 | problem paragraph | 28px/600/lh 1.1/−0.7px, 34 cpl | 18px/400/lh 1.6, 58 cpl | body role |

Add the Lighthouse scores (mobile and desktop) and the contrast table for any new color pair.

## 6. Self-critique prompts (run before every PR and every fix push)
- Is there one obvious focal point and one obvious next step on each changed screen?
- Does any text look too big, too heavy, too tight or too long for what it says?
- Would two people building the next page reuse what I built, or invent their own?
- What would the harshest principal designer you know circle in red? Fix that, then look again.
- Did I check 375 px as carefully as 1280 px? And keyboard, reduced motion and forced colors?
