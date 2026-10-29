# A — Quiet control

**Restrained and precise.** A dark engineering ledger where work follows a route you can inspect. The home page puts a plain promise alongside an order moving through three tools. Fine rules, square corners and restrained mint accents make the interface feel dependable. The visual reward is seeing the handoff completed, rather than watching an abstract object move.

- [Live static prototype](index.html) · [390 px reduced-motion view](../evidence/a-390-reduced.png) · [1440 px reduced-motion view](../evidence/a-1440-reduced.png)
- **Palette:** canvas `#0c1418`, panel `#142127`, text `#f3f7f7`, secondary `#b8c7cb`, mint/action/focus `#a7e8cc`, action hover `#d5f8e8`, borders `#6e898c`. All used pairs and computed AA thresholds: [contrast table A](../evidence/contrast.md#concept-a). No light theme proposed.
- **Type:** self-hosted Public Sans variable, 400 body / 650 headings / 750 wordmark, with the operating system's monospace for annotations. One WOFF2, 26,832 bytes; no mono download. Existing OFL licence in `../../prototype/fonts/`. H1 40–80 px, body 16 px, lede 18 px, labels 13 px. Browser text enlargement is supported.
- **Rhythm:** a strict two-column hero at 1024 px; three service columns at desktop. Rules separate services rather than enclosing every item in a card. Limit 1280 px, generous 80 px section rhythm, compact 4 px corners.
- **Hero:** a descending order route from shop → spreadsheet → invoice, with a single order packet advancing into the destination. The arrow gives direction; the bounded transfer gives the self-running clockwork idea. Labels and final state render before JS.
- **Motion language:** 1.8-second handoffs; no elastic movement or glow. The order packet travels below the tool labels so no text is obscured in transit. Replay is an explicit button and Escape restores the completed composition. Service animations use the shared six examples and policy in the [comparison](../README.md#motion-and-interaction-contract).
- **Responsive:** 320/390 px stack headline, CTA and diagram, then six service rows. At 480 px side gutters become 32 px. At 768 px services become two columns; at 1024 px hero splits and services become three. Caption and replay wrap naturally. Header CTA remains visible; no menu is needed for this two-section prototype.
- **Tradeoff:** easiest to scan and lowest maintenance, but the least differentiated at first glance. The owner explicitly asked to move beyond a quiet blog; A needs the diagram to carry that change.

Prototype descriptions and diagram labels are DRAFT; business headline, lede, primary/secondary CTA and existing service names/summaries are drawn from the copy deck. AI cost optimization remains an owner-confirmation placeholder.
