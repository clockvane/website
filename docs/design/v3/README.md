# Design system v3 and live prototype (Gate 2e)

**Merging this PR approves design system v3.**

Recommendation: approve design system v3 as built in the prototype. There is one direction, as the change request asks, so there is no choice between concepts.

- Live prototype: `/labs/v3/` and `/labs/v3/services/` on the PR preview. Open them on a phone and on a laptop.
- Specs: [design system](../design-system.md) · [tokens](../tokens.json) · [components](../components.md) · [motion](../motion.md) · [contrast](../contrast.md)
- Research: [research.md](research.md)
- Evidence: [evidence/](evidence/) holds phone and desktop screenshots and a short scroll recording.

## Decisions a merge also approves
| Decision | Recommendation | Why |
|----------|----------------|-----|
| Typeface | Keep self-hosted Public Sans (variable, 26.8 kB, OFL) | Already in the repo, one file, free. A commercial grotesque would look closer to Mobbin, but it means spend, which only the owner can approve |
| Accent | One blue, for text links and focus only | The brief says colour comes from imagery and one small accent |
| Service colours | Four tile colours, used only for service tokens | They make the four services recognisable at a glance |
| Secondary pill | White with a visible outline | Mobbin's grey fill alone fails the 3:1 boundary requirement |
| Stories | Placeholders in this prototype only. The live site omits the section until real stories are approved | Ticket #125 asks to show placeholders; copy deck §1 and rule 9 keep them off the live site |
| Tools strip | Left out | PRD Q24 is open: no confirmed tool names or permission to show logos |

## How the prototype is made
It is throwaway and is removed when design system v3 lands in code. Source is in [prototype-src/](prototype-src/):

```
node docs/design/v3/prototype-src/render-screens.mjs   # example screens to AVIF and WebP
node docs/design/v3/prototype-src/build.mjs            # pages and tokens.css
npx prettier --write public/labs/v3
```

- The brand comes from `site.config.ts` when the pages are generated, so the wordmark has one source. The generated pages use the owner's temporary labs exception. After a rename, rerun `build.mjs`.
- Design values come from `tokens.json` through the same `tokenProperties` function production uses.
- Copy comes from `docs/content/copy-deck.md`.

## Differences from the copy deck, for this prototype only
- Stories appear as placeholders (see above).
- The overview page omits "Explore…" detail links, and home's detail links go to the overview's sections, because service detail pages are not built in this prototype.

## Follow-ups for the engineering ticket
- Move production from `tokens-legacy.json` to `tokens.json`, delete the legacy file and remove the pointers in `src/styles/generate.mjs`, `src/pages/og.png.ts` and `tests/unit/lib/design/tokens.test.ts`.
- Rewrite `wireframes.md`, `user-flows.md` and `verification.md`, which keep their superseded banners. `design-system.md` §Page layouts is the source until then.
- Remove `public/labs/v3/` and `docs/design/v3/prototype-src/`.
- Use the image pipeline in NFR §1.1 instead of pre-rendered files.
