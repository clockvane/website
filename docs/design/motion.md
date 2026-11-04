# Motion — design system v3

Status: for approval at Gate 2e · Owner: UX/UI Designer · Ticket: #125
Architecture and limits: [ADR-004](../adr/ADR-004-motion-and-effects.md). Live: `src/components/` and `src/scripts/motion.ts`.

Motion is smooth and subtle. It supports the product screens and never carries information by itself. CSS first, with one small vanilla controller. Only `transform` and `opacity` move, apart from colour on small controls.

## Tokens
| Token | Value | Use |
|-------|-------|-----|
| `motion.duration.fast` | 150 ms | Button and tab colour |
| `motion.duration.base` | 240 ms | Hover lift, arrow |
| `motion.duration.slow` | 500 ms | Hero tokens, demo result |
| `motion.duration.reveal` | 600 ms | Scroll reveal |
| `motion.duration.columnSlow` | 90 s | One loop of columns 1, 3 and 5 |
| `motion.duration.columnFast` | 70 s | One loop of columns 2 and 4 |
| `motion.duration.row` | 80 s | One loop of the row |
| `motion.ease.standard` | cubic-bezier(0.2, 0, 0, 1) | Everything that starts and stops |
| `motion.ease.out` | cubic-bezier(0, 0, 0.2, 1) | Reserved for entrances in production |
| `motion.ease.linear` | cubic-bezier(0, 0, 1, 1) | Marquees, spinner |

## Inventory
| Element | What happens | Trigger | Stops by | Reduced motion and no JavaScript |
|---------|--------------|---------|----------|----------------------------------|
| Hero tokens | Scale 0.6 to 1 and fade, 80 ms stagger | Page load, CSS only | Finishes in under 1 s | Reduced: no animation. No JavaScript: plays, because it needs none |
| Columns | `translateY` loop, opposite directions | `.js-motion` | Pause button, hover, focus inside, off-screen, hidden tab | Stopped; the stage scrolls by itself |
| Row | `translateX` loop | `.js-motion` | Same | Stopped; the row scrolls by itself |
| Reveal | Fade and rise 16 px, once | IntersectionObserver at 12%, under `.js-motion` | Finishes | Final state |
| AI demo | Prompt types (2.4 s), four steps (0.75 s each), result fades | Demo card scrolled into view, once; Replay | Pause control, Escape, finishes after about 5.7 s | Finished draft |
| Hover lift | Rise 4 px with a larger shadow | Hover on static screens, `hover: hover` only | Pointer leaves | About instant |
| Button press | Scale 0.98 | `:active` | Release | About instant |

## Rules kept from ADR-004
- **No JavaScript, no hidden content.** Hidden-until-revealed states exist only under `.js-motion`.
- **Reduced motion, `prefers-reduced-data` and save-data.** The controller doesn't add `.js-motion` and the demo stays finished. CSS also removes all animation under `prefers-reduced-motion`.
- **WCAG 2.2.2.** Every loop has a real pause button before it in DOM order, and once paused it stays paused until pressed. The demo has its own Pause control.
- **Loop copies.** Added by the controller, `aria-hidden`, `alt=""`, nothing focusable, same image URLs so there are no extra requests. The HTML has no duplicates.
- **CLS.** Stage heights are fixed and images carry `width` and `height`. The demo's untyped text and result box hold their space. Measured CLS: see the Gate 2e PR.
- **No flashing, no scroll-jacking, no autoplay video, no `scroll` listeners.** The spinner is the only fast loop, and it is a small ring.
- **CSP.** External CSS and JS only, with no `style` attributes in the pages. The controller adds no inline style.

## Speed
Column loops move at about 10 px/s at desktop size, slow enough to read a label as it passes. Don't go faster: at twice the speed the screens read as decoration, not product.

## Controller
Under the 5 kB controller limit (P-4). It holds marquee copies, the pause state, the two observers, tabs, the demo and disclosures. In production the contact enhancement stays a separate script.
