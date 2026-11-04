# Evidence — NFR v3 image pipeline

Measured 2026-11-04 by the tech lead for [NFR v3](../../architecture/nfr.md) §1.1 (issue #123).

## Method
- A temporary page and 12 generated PNG screens (1600×1000, about 155 kB each; flat UI with text and one
  gradient), removed afterwards and not committed.
- Astro 7.4.2, sharp 0.35.5, Node 24.22.1, on the 8 GB WSL laptop, with `npm run build`.
- `<Picture formats={['avif']} fallbackFormat="webp" widths={[320, 480, 640, 960]} sizes="…" />`.

## Results
| Measure | Result |
|---------|--------|
| Files generated | 108 for 12 screens: 4 AVIF and 5 WebP each (4 widths plus the full-size `src`) |
| AVIF size, one screen | 320w 4.8 kB · 480w 8.9 kB · 640w 13.3 kB · 960w 22.6 kB |
| WebP size, one screen | 320w 7.1 kB · 480w 13.6 kB · 640w 20.3 kB · 960w 33.6 kB · 1600w `src` 58.0 kB |
| Image step, cold | 12.7 s (about 1 s per screen; `real` 17.6 s for the whole build) |
| Whole build, cached | 1.6 s, with all 108 files reused from `node_modules/.astro/assets` |
| HTML | `width="1600" height="1000"` kept; `srcset` and `sizes` present; 0 `style=` attributes |

## What this shows
- P-8 is reachable: 40 screens at the largest AVIF candidate is about 0.9 MB, leaving about 0.6 MB for
  HTML, CSS, script and fonts.
- O-3 needs the CI cache only as the number of screens grows: at about 1 s per screen on this laptop, 40
  screens is about 40 s cold.

## Not measured
- **Real screens.** These are synthetic. Screens with photos or heavy gradients will be larger, which is
  why P-7 caps each file at 100 kB. Re-check when the first real screens land.
- **Peak build memory (O-3, ≤ 2 GB).** The memory-measuring command was not permitted in this run.
- **Actual Lighthouse totals, and whether `astro preview` compresses responses.** The preview server could
  not be started in this run, so the `dist/` scan owns the gzip budgets either way.
- **CI runner speed.** Timings are from this laptop only.
