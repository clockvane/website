# Design system v3 and live prototype (Gate 2e)

**Merging this PR approves design system v3.**

Recommendation: approve design system v3 as built in the prototype. There is one direction, as the change request asks, so there is no choice between concepts.

- Historical prototype: `/labs/v3/` and `/labs/v3/services/` on the Gate 2e PR preview. Issue #126 removes those throwaway public routes; use the retained evidence below and the isolated component fixture described in [page-components.md](../../engineering/page-components.md).
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
The throwaway pages and their builder were removed in #126. The original screen definitions and renderer remain in [prototype-src/](prototype-src/) to regenerate the production image sources:

```
node docs/design/v3/prototype-src/render-screens.mjs   # PNG sources to src/assets/examples/
npm run build                                       # Astro optimises referenced screens
```

- The production wordmark reads `site.config.ts`; the prototype's temporary labs exception is no longer used.
- Design values come from `tokens.json` through the same `tokenProperties` function production uses.
- Copy comes from `docs/content/copy-deck.md`.

## Differences from the copy deck, for this prototype only
- Stories appear as placeholders (see above).
- The overview page omits "Explore…" detail links, and home's detail links go to the overview's sections, because service detail pages are not built in this prototype.

## Follow-ups for the engineering ticket
- Completed in #126: production uses `tokens.json`; the legacy token file and its references were removed.
- Rewrite `wireframes.md`, `user-flows.md` and `verification.md`, which keep their superseded banners. `design-system.md` §Page layouts is the source until then.
- Completed in #126: removed `public/labs/` and the throwaway page builder; retained only the reusable original-screen source and renderer.
- Completed in #126: images use the NFR §1.1 build-time pipeline instead of public pre-rendered files.
