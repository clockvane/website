// Build-time only; Node 24 native type stripping requires erasable TS in config.
import { readFile, writeFile } from 'node:fs/promises';
import { siteConfig } from '../../../site.config.ts';
const here = new URL('./', import.meta.url);
const copy = await readFile(
  new URL('../../content/copy-deck.md', here),
  'utf8',
);
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );
const block = (id) =>
  copy.split(`### \`${id}\``)[1]?.split('\n### ')[0]?.split('\n---')[0];
const field = (id, key) => {
  const value = block(id)?.match(new RegExp(`^- ${key}: (.+)$`, 'm'))?.[1];
  if (!value) throw new Error(`Missing copy: ${id}.${key}`);
  return escape(value.replaceAll('{{brand.name}}', siteConfig.brand));
};
const services = [
  ...copy
    .split('### Service names (single source)')[1]
    .split('\n---')[0]
    .matchAll(/^\| `([^`]+)` \| ([^|]+) \| ([^|]+) \|$/gm),
].map(([, slug, title, summary]) => ({
  slug,
  title: title.trim(),
  summary: summary.trim(),
}));
if (services.length !== 5)
  throw new Error('Review service changes before regenerating.');
services.splice(2, 0, {
  slug: 'ai-cost',
  title: 'AI cost optimization',
  summary:
    'DRAFT · Find where AI spend goes, then test a less costly way to do the same work.',
});
const concepts = {
  a: ['Quiet control', 'Restrained / precise'],
  b: ['The routing dial', 'Balanced / human'],
  c: ['Dispatch field', 'Bold / cinematic'],
};
const mark =
  '<svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13"/><path d="M9 23L16 6L23 23L16 19Z"/></svg>';
const svg = (body, viewBox = '0 0 280 135') =>
  `<svg viewBox="${viewBox}" aria-hidden="true" focusable="false">${body}</svg>`;
const box = (x, y, w, h, body = '', cls = 'node') =>
  `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="5"/>${body}`;
const label = (x, y, text, cls = 'label') =>
  `<text class="${cls}" x="${x}" y="${y}">${text}</text>`;
const serviceVisuals = [
  [
    'One order moves from the shop to the invoice tool without retyping.',
    box(5, 32, 70, 50, label(18, 62, 'Order')) +
      '<path class="edge" d="M75 57H200M190 51L200 57L190 63"/>' +
      box(200, 32, 75, 50, label(209, 62, 'Invoice')) +
      '<g class="flow finish">' +
      box(217, 95, 36, 19, '', 'solid') +
      '</g>',
  ],
  [
    'An invoice becomes fields; unclear entries go to a person to check.',
    box(5, 15, 65, 95, label(16, 65, 'Invoice', 'hint')) +
      '<path class="edge" d="M70 60H100V35H140M100 60V106H140"/><g class="read finish">' +
      box(140, 15, 130, 40, label(151, 40, 'Clear → fields')) +
      box(140, 85, 130, 40, label(151, 110, 'Unclear → check')) +
      '</g>',
  ],
  [
    'Illustrative only: compare spend, then test a lower-cost route. No savings claim.',
    '<path class="edge" d="M20 15V112H265"/><rect class="node" x="56" y="25" width="42" height="86"/><rect class="solid cost finish" x="170" y="65" width="42" height="46"/>' +
      label(45, 132, 'Before', 'hint') +
      label(165, 132, 'Test', 'hint'),
  ],
  [
    'Code passes tests, then waits for approval before release.',
    '<path class="edge" d="M35 53H245"/>' +
      [35, 140, 245]
        .map(
          (x, i) =>
            `<circle class="node" cx="${x}" cy="53" r="23"/>${label(x - 18, 102, ['Build', 'Test', 'Approve'][i], 'hint')}`,
        )
        .join('') +
      '<g class="release finish"><path class="accent" d="M23 53L32 62L48 43M128 53L137 62L153 43"/>' +
      label(239, 59, 'Ⅱ') +
      '</g>',
  ],
  [
    'A page is assembled into a clear route from content to an enquiry.',
    box(25, 5, 230, 125) +
      '<path class="edge" d="M25 26H255"/><g class="assemble">' +
      box(40, 40, 105, 17, '', 'solid') +
      '</g><g class="assemble late finish"><path class="edge" d="M40 72H160M40 84H140"/>' +
      box(40, 98, 80, 18, '', 'solid') +
      box(180, 40, 60, 76) +
      '</g>',
  ],
  [
    'A small custom connector joins tools that did not fit together.',
    box(5, 35, 65, 60, label(17, 70, 'Tool A', 'hint')) +
      box(210, 35, 65, 60, label(222, 70, 'Tool B', 'hint')) +
      '<path class="edge" d="M70 65H210"/><g class="join finish">' +
      box(106, 40, 68, 50, label(115, 69, 'Adapter', 'ink'), 'solid') +
      '</g>',
  ],
];
const heroA = svg(
  '<path class="edge" d="M90 108V169H270V229H462"/><path class="accent" d="M448 220L462 229L448 238"/>' +
    box(28, 45, 155, 63, label(52, 83, 'Shop')) +
    box(195, 137, 155, 63, label(215, 175, 'Spreadsheet')) +
    box(365, 229, 170, 63, label(383, 268, 'Invoice tool')) +
    '<g class="flow finish">' +
    box(437, 306, 45, 22, '', 'solid') +
    '</g>' +
    label(30, 320, 'One order. No retyping.', 'hint'),
  '0 0 560 350',
);
const heroB = svg(
  '<circle class="dial-ring" cx="280" cy="190" r="135"/><circle class="dial-ring dash" cx="280" cy="190" r="106"/><path class="edge" d="M110 92L280 190L451 92M280 190V302"/>' +
    box(22, 57, 155, 64, label(55, 96, 'Shop')) +
    box(384, 57, 155, 64, label(402, 96, 'Spreadsheet')) +
    box(197, 286, 166, 64, label(220, 325, 'Invoice tool')) +
    '<circle class="node" cx="280" cy="190" r="57"/><g class="vane finish"><path class="solid" d="M280 235L304 159L280 171L256 159Z"/></g>' +
    label(239, 266, 'ROUTE', 'hint'),
  '0 0 560 380',
);
const heroC = svg(
  '<path class="horizon" d="M12 280L280 24L548 280M75 280L280 24L485 280M152 280L280 24L408 280M220 280L280 24L340 280M65 230H495M115 180H445M165 130H395M215 80H345"/><path class="accent light" d="M54 214H167L280 107L393 214H506"/>' +
    box(12, 192, 140, 65, label(38, 231, 'Shop')) +
    box(208, 60, 145, 65, label(221, 99, 'Spreadsheet')) +
    box(408, 192, 140, 65, label(419, 231, 'Invoice tool')) +
    '<g class="trail finish"><path class="solid light" d="M374 173L396 207L367 194Z"/></g>',
  '0 0 560 290',
);
const heroes = { a: heroA, b: heroB, c: heroC };
for (const [id, [name, range]] of Object.entries(concepts)) {
  const rows = services
    .map((service, index) => {
      const [caption, illustration] = serviceVisuals[index];
      return `<article class="service"><div class="service-copy"><span class="number">0${index + 1} / ${index < 2 ? 'AUTOMATION' : index === 2 ? 'EXPLORATION' : 'ENGINEERING'}</span><h3>${escape(service.title)}</h3><p>${escape(service.summary)}</p></div><div class="system">${svg(illustration)}<p class="caption">${caption}</p><button class="replay" type="button" hidden aria-label="Replay example: ${escape(service.title)}">Replay example <span aria-hidden="true">↗</span></button></div></article>`;
    })
    .join('\n');
  const html = `<!doctype html>
<!-- Generated from render.mjs, the copy deck and site.config.ts. Prototype only. -->
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escape(name)} | ${escape(siteConfig.brand)} concept ${id.toUpperCase()}</title><meta name="description" content="${field('home.hero', 'h1')}. Explore a design direction for automation, cloud and software services."><link rel="icon" href="data:,"><link rel="preload" href="../../prototype/fonts/public-sans-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="../shared.css"><link rel="stylesheet" href="theme.css"><script src="../motion.js" defer></script></head>
<body><a class="skip" href="#main">Skip to content</a><header class="header wrap"><a class="brand" href="#main" aria-label="${escape(siteConfig.brand)} home">${mark}${escape(siteConfig.brand)}</a><nav aria-label="Main"><a href="#services">Services</a><a href="#audit" class="compact">${field('home.hero', 'cta primary')} <span aria-hidden="true">↗</span></a></nav></header>
<main id="main" tabindex="-1"><section class="hero wrap" aria-labelledby="hero-title"><div class="hero-copy"><p class="eyebrow">${id.toUpperCase()} / ${escape(name)} · Design exploration</p><h1 id="hero-title">${field('home.hero', 'h1')}</h1><p class="lede">${field('home.hero', 'lede')}</p><div class="actions"><a class="primary" href="#audit">${field('home.hero', 'cta primary')} <span aria-hidden="true">↗</span></a><a href="#services">${field('home.hero', 'cta secondary link')}</a></div><p class="support">${field('home.hero', 'supporting line')}</p></div>
<figure class="hero-visual system"><div class="visual-head"><span class="tag">ORDER → INVOICE</span><span class="tag">Example workflow</span></div><div class="diagram">${heroes[id]}</div><figcaption class="visual-foot"><p>One order moves from shop to spreadsheet to invoice tool. The direction is set; the work runs by itself.</p><button class="replay" type="button" hidden>Replay workflow <span aria-hidden="true">↗</span></button></figcaption></figure></section>
<section class="services wrap" id="services" aria-labelledby="services-title"><div class="section-head"><div><p class="eyebrow">01 / SYSTEMS THAT DO THE WORK</p><h2 id="services-title">${field('home.services', 'h2')}</h2></div><p>${field('home.services', 'intro')}</p></div><div class="service-list">${rows}</div><p class="note">Design exploration · These diagrams show examples, not client results. AI cost optimization is DRAFT; its scope and the full service list need owner confirmation.</p></section>
<section class="closing wrap" id="audit" tabindex="-1" aria-labelledby="audit-title"><p class="eyebrow">02 / START WITH ONE PROCESS</p><h2 id="audit-title">Tell us about one slow process</h2><p>Book a free audit call. We will look at one slow process and tell you what we would automate. We reply within 1 business day.</p><details><summary>Prototype note: booking destination</summary><p>This concept demonstrates the path to the audit call. It does not take bookings. The production contact page will use the booking URL from site configuration once the owner supplies it.</p></details><a class="compact" href="#main">Back to the example ↑</a></section></main>
<footer class="wrap"><p>Concept ${id.toUpperCase()} · ${escape(range)} · DRAFT for Gate 2b</p><a href="../concept-${id === 'c' ? 'a' : id === 'a' ? 'b' : 'c'}/index.html">Next concept →</a></footer></body></html>\n`;
  const arrow =
    '<svg class="link-arrow" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 16L16 4M5 4H16V15"/></svg>';
  // The local Latin subset has no arrow/pause glyphs; draw controls as SVG.
  const output = html
    .replaceAll('<span aria-hidden="true">↗</span>', arrow)
    .replaceAll('Next concept →', 'Next concept')
    .replaceAll('→', ' / ')
    .replaceAll('↑', '')
    .replaceAll('Ⅱ', 'II');
  await writeFile(new URL(`concept-${id}/index.html`, here), output);
}
