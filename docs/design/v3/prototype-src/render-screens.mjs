// Renders screens.mjs to public/labs/v3/screens/<id>-<width>.{avif,webp}. Run from the repository root:
// node docs/design/v3/prototype-src/render-screens.mjs [id ...]
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { screens, screenCss } from './screens.mjs';

const out = 'public/labs/v3/screens';
const scratch = '.agentops-scratch/v3/screens-render.html';
const widths = [320, 640, 960];
const font = resolve('public/fonts/public-sans-latin-wght-normal.woff2');
const only = process.argv.slice(2);
const list = only.length ? screens.filter((s) => only.includes(s.id)) : screens;

mkdirSync(out, { recursive: true });
writeFileSync(
  scratch,
  `<!doctype html><meta charset="utf-8"><style>@font-face{font-family:'Public Sans';src:url('file://${font}');font-weight:100 900}${screenCss}</style>` +
    list.map((s) => `<div class="scr" id="${s.id}" style="width:${s.w ?? 480}px;height:${s.h}px">${s.html}</div>`).join(''),
);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 2 });
await page.goto('file://' + resolve(scratch));
await page.evaluate(() => document.fonts.ready);
let total = 0;
for (const s of list) {
  const png = await page.locator(`#${s.id}`).screenshot({ type: 'png' });
  const overflow = await page.locator(`#${s.id} > .fill`).evaluate((e) => e.scrollHeight - e.clientHeight);
  if (overflow > 0) console.log('OVERFLOW', s.id, overflow);
  for (const w of widths) {
    const base = sharp(png).resize({ width: w });
    const a = await base.clone().avif({ quality: 62, effort: 5, chromaSubsampling: '4:4:4' }).toBuffer();
    const b = await base.clone().webp({ quality: 82, effort: 5 }).toBuffer();
    writeFileSync(`${out}/${s.id}-${w}.avif`, a);
    writeFileSync(`${out}/${s.id}-${w}.webp`, b);
    if (w === 640) total += a.length;
    if (a.length > 100000 || b.length > 100000) console.log('TOO BIG', s.id, w);
  }
}
await browser.close();
console.log('screens', list.length, 'avif@640 total kB', Math.round(total / 1024));
