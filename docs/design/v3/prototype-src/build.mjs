// Generates the throwaway prototype pages in public/labs/v3/ from one source.
// The brand comes from site.config.ts, the design values from tokens.json and the copy from docs/content/copy-deck.md.
// Run from the repository root: node docs/design/v3/prototype-src/build.mjs && npx prettier --write public/labs/v3
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { siteConfig } from '../../../../site.config.ts';
import { tokenProperties } from '../../../../src/lib/design/tokens.ts';
import { screens } from './screens.mjs';

const root = 'public/labs/v3';
const base = '/labs/v3';
const brand = siteConfig.brand;
const tagline = 'Built by experts. Powered by AI.';
const byId = Object.fromEntries(screens.map((s) => [s.id, s]));

mkdirSync(`${root}/services`, { recursive: true });
mkdirSync(`${root}/fonts`, { recursive: true });
copyFileSync('public/fonts/public-sans-latin-wght-normal.woff2', `${root}/fonts/public-sans-latin-wght-normal.woff2`);
copyFileSync('public/fonts/Public-Sans-OFL.txt', `${root}/fonts/Public-Sans-OFL.txt`);
const tokens = JSON.parse(readFileSync('docs/design/tokens.json', 'utf8'));
writeFileSync(`${root}/tokens.css`, `/* Generated from docs/design/tokens.json; do not edit. */\n:root {\n${tokenProperties(tokens).join('\n')}\n}\n`);

const glyph = {
  expert: '<path d="M4 5.5A2.5 2.5 0 0 1 6.500 3h11A2.500 2.500 0 0 1 20 5.500v8a2.500 2.500 0 0 1-2.500 2.500H11l-4.500 4v-4A2.500 2.500 0 0 1 4 13.500z" fill="currentColor"/><path d="M8.500 9.500h.01M12 9.500h.01M15.500 9.500h.01" stroke="#C2410C" stroke-width="2.400" stroke-linecap="round"/>',
  automation: '<path d="M12 2.500 14.200 9.800 21.500 12l-7.300 2.200L12 21.500l-2.200-7.300L2.500 12l7.300-2.200z" fill="currentColor"/>',
  website: '<rect x="3" y="4.500" width="18" height="15" rx="2.800" fill="currentColor"/><path d="M3 9.500h18" stroke="#0A6CD6" stroke-width="1.800"/><path d="M6 7h.01M8.500 7h.01" stroke="#0A6CD6" stroke-width="1.800" stroke-linecap="round"/>',
  solutions: '<rect x="3.500" y="3.500" width="7.500" height="7.500" rx="2" fill="currentColor"/><rect x="13" y="3.500" width="7.500" height="7.500" rx="3.750" fill="currentColor"/><rect x="3.500" y="13" width="7.500" height="7.500" rx="3.750" fill="currentColor"/><rect x="13" y="13" width="7.500" height="7.500" rx="2" fill="currentColor"/>',
};
const token = (k, cls = '') => `<span class="tok tok--${k} ${cls}" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">${glyph[k]}</svg></span>`;
const arrow = '<svg class="arrow" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4 10h11M11 5.500 15.500 10 11 14.500" fill="none" stroke="currentColor" stroke-width="1.800" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const pic = (id, sizes) => {
  const s = byId[id];
  const w = (s.w ?? 480) * 2;
  const h = s.h * 2;
  const set = (ext) => [320, 640, 960].map((x) => `${base}/screens/${id}-${x}.${ext} ${x}w`).join(', ');
  return `<picture><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}"><img src="${base}/screens/${id}-640.webp" srcset="${set('webp')}" sizes="${sizes}" width="${w}" height="${h}" alt="${s.alt}" loading="lazy" decoding="async"></picture>`;
};
const shot = (id, sizes, extra = '') => `<figure class="shot ${extra}">${pic(id, sizes)}<figcaption class="shot-tag">${byId[id].label}</figcaption></figure>`;

const services = [
  {
    key: 'expert', slug: 'expert-support', name: 'Expert support', cta: 'Book an expert', link: 'Explore expert support',
    summary: 'Get advice, troubleshooting and hands-on help from an expert individual.',
    audience: 'Individuals and companies who need help with technical work.',
    get: 'Advice, troubleshooting, hands-on help and guidance from an expert individual.',
    how: 'Tell us what you need help with. We discuss the request and arrange the support with you.',
    thumbs: ['exp-request', 'exp-session', 'exp-notes'],
  },
  {
    key: 'automation', slug: 'ai-automation', name: 'AI automation', cta: 'Book a call', link: 'Explore AI automation',
    summary: 'Put AI agents and automations into your workflows to reduce repetitive work.',
    audience: 'Companies that want to spend less time sorting, copying and checking information.',
    get: "AI agents and automations designed and built into your company's workflows.",
    how: 'Choose a repeated task, agree what needs human review, then build and test the workflow.',
    thumbs: ['ai-draft', 'ai-run', 'ai-inbox'],
  },
  {
    key: 'website', slug: 'website-creation', name: 'Website creation', cta: 'Book a call', link: 'Explore website creation',
    summary: 'Give people a clear way to understand your work and use your website or web app.',
    audience: 'Any client who needs a website or web app designed and built.',
    get: 'A website or web app designed around what your visitors need to do.',
    how: 'Agree the pages or features, review the design, then build, test and prepare for launch.',
    thumbs: ['web-clear', 'web-bakery', 'web-booking'],
  },
  {
    key: 'solutions', slug: 'solutions', name: 'Solutions for companies', cta: 'Book a call', link: 'Explore solutions for companies',
    summary: 'Get software or a technical solution built around the problem you need to solve.',
    audience: 'Companies whose work does not fit an existing tool or the other services.',
    get: "Tailored software and technical solutions for your company's problem.",
    how: 'Describe the gap, agree what the solution must do, then build and review it in stages.',
    thumbs: ['sol-tool', 'sol-plan', 'sol-portal'],
  },
];
const svcUrl = (s) => `${base}/services/#${s.slug}`;

const head = (title, description, extra = '') => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="icon" href="data:,">
<link rel="preload" href="${base}/fonts/public-sans-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${base}/tokens.css">
<link rel="stylesheet" href="${base}/v3.css">
<script src="${base}/v3.js" defer></script>
${extra}</head>`;

const header = () => `<a class="skip" href="#main">Skip to main content</a>
<p class="notice">Prototype for review. Draft copy. Every screen is an example we designed.</p>
<header class="site-head">
<div class="site-head-in">
<a class="wordmark" href="${base}/">${brand}</a>
<nav class="nav-wide" aria-label="Main">
<details class="disc" data-disc>
<summary>Services</summary>
<div class="disc-panel">
<a href="${base}/services/">All services</a>
${services.map((s) => `<a href="${svcUrl(s)}">${token(s.key, 'tok--sm')}${s.name}</a>`).join('\n')}
</div>
</details>
<a href="/how-we-work/">How we work</a>
<a href="/about/">About</a>
</nav>
<span class="grow"></span>
<a class="pill pill--primary pill--head" href="/contact/">Book a call</a>
<details class="menu" data-disc>
<summary><span class="menu-icon" aria-hidden="true"></span><span class="sr-only">Menu</span></summary>
<nav class="menu-panel" aria-label="Menu">
<a href="${base}/services/">All services</a>
${services.map((s) => `<a class="sub" href="${svcUrl(s)}">${s.name}</a>`).join('\n')}
<a href="/how-we-work/">How we work</a>
<a href="/about/">About</a>
</nav>
</details>
</div>
</header>`;

const closing = () => `<section class="closing reveal" aria-labelledby="closing-h">
<div class="closing-tokens" aria-hidden="true">${services.map((s) => token(s.key)).join('')}</div>
<h2 id="closing-h">What would you like to get done?</h2>
<p class="lead">Tell us where you are stuck or what you want to build. We will help you work out the next step.</p>
<a class="pill pill--primary" href="/contact/">Book a call</a>
</section>`;

const footer = () => `<footer class="site-foot">
<div class="foot-in">
<div class="foot-brand">
<a class="wordmark" href="${base}/">${brand}</a>
<p>${tagline}</p>
<p>Expert support, AI automation, websites and technical solutions, in one place.</p>
</div>
<nav class="foot-col" aria-labelledby="foot-services">
<h2 id="foot-services">Services</h2>
${services.map((s) => `<a href="${svcUrl(s)}">${s.name}</a>`).join('\n')}
</nav>
<nav class="foot-col" aria-labelledby="foot-company">
<h2 id="foot-company">Company</h2>
<a href="/how-we-work/">How we work</a>
<a href="/about/">About</a>
<a href="/contact/">Contact</a>
<a href="/privacy/">Privacy notice</a>
</nav>
</div>
<div class="foot-base">
<p>© ${new Date().getFullYear()} ${brand}</p>
<p>India · working with clients worldwide</p>
</div>
</footer>`;

const toolbar = (id) => `<div class="toolbar">
<p class="toolbar-note" id="${id}">All screens are examples we designed, not client work.</p>
<button class="pill pill--secondary pill--small" type="button" data-pause hidden>Pause examples</button>
</div>`;

const row = (ids, label, noteId) => `${toolbar(noteId)}
<div class="row-stage" data-marquee tabindex="0" role="group" aria-label="${label}" aria-describedby="${noteId}">
<div class="track track--row"><div class="group">
${ids.map((id) => shot(id, '(min-width: 48rem) 520px, 78vw')).join('\n')}
</div></div>
</div>`;

const columns = [
  ['web-bakery', 'exp-session', 'ai-assistant'],
  ['ai-inbox', 'web-shop', 'exp-notes'],
  ['exp-request', 'ai-run', 'sol-plan'],
  ['web-booking', 'ai-draft', 'sol-portal', 'web-clear'],
  ['sol-tool', 'exp-start', 'ai-approve'],
];
const colSizes = '(min-width: 64rem) 260px, (min-width: 48rem) 30vw, 44vw';

const panels = services
  .map(
    (s) => `<div class="panel" id="panel-${s.key}" data-panel aria-labelledby="h-${s.key}">
<div class="panel-head">
<div>
<h3 id="h-${s.key}">${s.name}</h3>
<p>${s.summary}</p>
<p class="for"><strong>For:</strong> ${s.audience}</p>
</div>
<div class="panel-cta">
<a class="pill pill--primary" href="/contact/">${s.cta}</a>
<a class="pill pill--secondary" href="${svcUrl(s)}">${s.link}${arrow}</a>
</div>
</div>
<div class="thumbs">
${s.thumbs.map((id) => shot(id, '(min-width: 64rem) 340px, (min-width: 48rem) 30vw, 44vw')).join('\n')}
</div>
</div>`,
  )
  .join('\n');

const steps = ['Read the example request', 'Identify the service', 'Draft a reply', 'Wait for review'];

const home = `${head('Expert support, AI automation and websites', 'Get expert help, AI automation, websites and technical solutions in one place. Tell us what you need and book a call.')}
<body>
${header()}
<main id="main">
<section class="hero">
<p class="eyebrow">${tagline}</p>
<h1>Get expert <span class="nb">support, ${token('expert')}</span> <br class="br-wide"><span class="nb">AI automation ${token('automation')}</span> and <span class="nb">websites ${token('website')}</span> <br class="br-wide">built around your needs.</h1>
<p class="lead">Stuck on technical work or ready to build something? Expert individuals help individuals and companies, from advice to hands-on delivery.</p>
<div class="cta-row">
<a class="pill pill--primary" href="/contact/">Book a call</a>
<a class="pill pill--secondary" href="${base}/services/">Explore our services${arrow}</a>
</div>
</section>

<section class="stage-wrap" aria-label="Example screens">
<div class="content">${toolbar('stage-note')}</div>
<div class="stage" data-marquee tabindex="0" role="group" aria-label="Scrolling columns of example screens" aria-describedby="stage-note">
<div class="columns">
${columns
  .map(
    (ids, i) => `<div class="col col-${i + 1}"><div class="track"><div class="group">
${ids.map((id) => shot(id, colSizes)).join('\n')}
</div></div></div>`,
  )
  .join('\n')}
</div>
</div>
</section>

<section class="problem reveal" aria-labelledby="problem-h">
<div class="content">
<h2 id="problem-h">Move past the work that holds you up</h2>
<p class="statement"><span class="tone">A technical issue can leave you unsure what to try next. Repeated data entry can take time away from other work. A confusing website can make it hard for people to find what they need.</span> Get help with the problem in front of you. We bring expert support, AI automation, website creation and technical solutions together, with a clear scope before work begins.</p>
<a class="link" href="/how-we-work/">See how we work${arrow}</a>
</div>
${row(['wide-studio', 'wide-flows', 'wide-board', 'wide-orders'], 'Scrolling row of example screens', 'row-note')}
</section>

<section class="oneplace reveal" id="services" aria-labelledby="oneplace-h">
<div class="content">
<div class="section-head">
<h2 id="oneplace-h">One place for the technical work you need</h2>
<p class="lead">Ask for expert help, automate a repeated task, build a website or discuss a solution for your company.</p>
</div>
<div class="tabs" role="tablist" aria-label="Services" data-tabs hidden>
${services
  .map(
    (s, i) => `<button class="tab" type="button" role="tab" id="tab-${s.key}" aria-controls="panel-${s.key}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${token(s.key, 'tok--sm')}<span>${s.name}</span></button>`,
  )
  .join('\n')}
</div>
${panels}
</div>
</section>

<section class="demo reveal" id="demo" aria-labelledby="demo-h" data-demo>
<div class="content demo-grid">
<div class="demo-copy">
<p class="tag-draft">DRAFT · Scripted example</p>
<h2 id="demo-h">From a request to a draft you can check</h2>
<p class="lead">See how an AI step could sort an incoming request and prepare a reply for review.</p>
<p class="demo-note">This example uses fictional input. It does not run a live service or send a message.</p>
<div class="cta-row cta-row--left" data-demo-controls hidden>
<button class="pill pill--primary pill--small" type="button" data-demo-toggle aria-label="Pause example: AI reply example">Pause example</button>
<button class="pill pill--secondary pill--small" type="button" data-demo-replay aria-label="Replay example: AI reply example">Replay example</button>
</div>
<p class="sr-only">A fictional website request becomes a draft reply asking which pages need updates. The reply waits for review and is not sent.</p>
<p class="sr-only" aria-live="polite" data-demo-status></p>
</div>
<div class="demo-stage">
<div class="demo-card">
<p class="demo-label">Example incoming request</p>
<p class="demo-input">“I need help updating the pages on my website. What information should I send?”</p>
<p class="demo-label">Prompt</p>
<p class="demo-prompt" data-demo-prompt>“Identify the service this request is about. Draft a reply asking for the details needed to discuss the work. Leave it for a person to review.”</p>
<ol class="steps">
${steps.map((t) => `<li class="step is-done" data-step><span class="step-dot" aria-hidden="true"><svg viewBox="0 0 20 20" focusable="false"><path d="M4.500 10.500 8.200 14l7.300-8" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round"/></svg></span>${t}</li>`).join('\n')}
</ol>
<div class="result" data-demo-result>
<p class="demo-label demo-label--strong">Draft reply · Needs review</p>
<p>“Thanks for getting in touch about your website. Which pages would you like to update, and what should change? Please share your website address if you have one.”</p>
<dl class="kv"><div><dt>Service</dt><dd>Website creation</dd></div><div><dt>Status</dt><dd>Not sent</dd></div></dl>
</div>
</div>
<p class="demo-close">You decide what goes out. The example stops at a draft for review.</p>
</div>
</div>
</section>

<section class="stories reveal" id="stories" aria-labelledby="stories-h">
<div class="content">
<div class="section-head">
<h2 id="stories-h">Stories from the work</h2>
<p class="lead">Placeholders for this prototype only. The live site leaves this section out until real stories are approved.</p>
</div>
<ul class="story-grid">
${[1, 2, 3].map(() => `<li class="story"><p class="tag-placeholder">Placeholder</p><h3>[[PLACEHOLDER: approved story title]]</h3><p>[[PLACEHOLDER: real problem, work done and evidenced result, with permission to publish]]</p></li>`).join('\n')}
</ul>
</div>
</section>

${closing()}
</main>
${footer()}
</body>
</html>
`;

const overview = `${head('Explore our four technical services', 'Compare expert support, AI automation, website creation and solutions for companies. See what each offers and how to start.')}
<body>
${header()}
<main id="main">
<section class="hero hero--sub">
<p class="eyebrow">${tagline}</p>
<h1>The right help for the work ahead</h1>
<p class="lead">You may need an expert's advice, a workflow that handles repeat tasks or a website built from the ground up. Start with the service that fits your problem.</p>
<nav class="jump" aria-label="On this page">
${services.map((s) => `<a class="tab" href="#${s.slug}">${token(s.key, 'tok--sm')}<span>${s.name}</span></a>`).join('\n')}
</nav>
</section>

<section class="row-wrap" aria-label="Example screens">
${row(['wide-flows', 'wide-studio', 'wide-orders', 'wide-board'], 'Scrolling row of example screens', 'row-note')}
</section>

${services
  .map(
    (s, i) => `<section class="svc reveal ${i % 2 ? 'svc--flip' : ''}" id="${s.slug}" aria-labelledby="svc-${s.key}">
<div class="content svc-grid">
<div class="svc-copy">
${token(s.key)}
<h2 id="svc-${s.key}">${s.name}</h2>
<p class="lead">${s.summary}</p>
<h3>What you get</h3>
<p>${s.get}</p>
<h3>How it works</h3>
<p>${s.how}</p>
<h3>Who it is for</h3>
<p>${s.audience}</p>
<div class="cta-row cta-row--left"><a class="pill pill--primary" href="/contact/">${s.cta}</a></div>
</div>
<div class="svc-stage">
${shot(s.thumbs[0], '(min-width: 64rem) 290px, 52vw', 'svc-a')}
${shot(s.thumbs[1], '(min-width: 64rem) 210px, 38vw', 'svc-b')}
</div>
</div>
</section>`,
  )
  .join('\n')}

<section class="choose reveal" aria-labelledby="choose-h">
<div class="content choose-in">
<div>
<h2 id="choose-h">Not sure which service fits?</h2>
<p>Tell us what you are trying to do. You do not need to choose a tool or write a technical brief first.</p>
</div>
<a class="pill pill--primary" href="/contact/">Book a call</a>
</div>
</section>

${closing()}
</main>
${footer()}
</body>
</html>
`;

writeFileSync(`${root}/index.html`, home);
writeFileSync(`${root}/services/index.html`, overview);
console.log('built', brand);
