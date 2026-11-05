// Renders screens.mjs to PNG sources in src/assets/examples/ (NFR §1.1); Astro optimises them at
// build time. Run from the repository root: node docs/design/v3/prototype-src/render-screens.mjs [id ...]
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { screens, screenCss } from './screens.mjs';

const out = 'src/assets/examples';
const scratch = '.agentops-scratch/v3/screens-render.html';
const font = resolve('public/fonts/public-sans-latin-wght-normal.woff2');
const only = process.argv.slice(2);
const list = only.length ? screens.filter((s) => only.includes(s.id)) : screens;

mkdirSync(out, { recursive: true });
mkdirSync('.agentops-scratch/v3', { recursive: true });
writeFileSync(
  scratch,
  `<!doctype html><meta charset="utf-8"><style>@font-face{font-family:'Public Sans';src:url('file://${font}');font-weight:100 900}${screenCss}</style>` +
    list.map((s) => `<div class="scr" id="${s.id}" style="width:${s.w ?? 480}px;height:${s.h}px">${s.html}</div>`).join(''),
);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 2 });
await page.goto('file://' + resolve(scratch));
await page.evaluate(() => document.fonts.ready);
for (const s of list) {
  const overflow = await page.locator(`#${s.id} > .fill`).evaluate((e) => e.scrollHeight - e.clientHeight);
  if (overflow > 0) console.log('OVERFLOW', s.id, overflow);
  writeFileSync(`${out}/${s.id}.png`, await page.locator(`#${s.id}`).screenshot({ type: 'png' }));
}
await browser.close();
console.log('screens', list.length);
