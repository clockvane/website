/* Internal link and metadata check on the built output (docs/devops/cicd.md stage 7).
   Usage: node tests/e2e/check-links.mjs [distDir]   (default: dist)
   Checks every href/src/srcset target that is site-relative, in every HTML file: the file must
   exist and a #fragment must match an id in the target page. Also requires robots.txt, a sitemap
   and an og:image on every page. External URLs are not fetched. */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative, sep } from 'node:path';
import process from 'node:process';

const root = resolve(process.argv[2] || 'dist');
const errors = [];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const htmlFiles = walk(root).filter((f) => f.endsWith('.html'));
if (htmlFiles.length === 0) errors.push(`no HTML files in ${root}`);

for (const required of ['robots.txt', 'sitemap-index.xml']) {
  if (!existsSync(join(root, required))) errors.push(`missing ${required}`);
}

/** Map a site-relative URL path to a file in dist, or null. */
function resolveTarget(urlPath) {
  const clean = decodeURIComponent(urlPath);
  const base = resolve(root, '.' + clean);
  if (base !== root && !base.startsWith(root + sep)) return null;
  for (const c of [base, join(base, 'index.html'), base + '.html']) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

const idCache = new Map();
function idsOf(file) {
  if (!idCache.has(file)) {
    const html = readFileSync(file, 'utf8');
    idCache.set(
      file,
      new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map((m) => m[1])),
    );
  }
  return idCache.get(file);
}

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const rel = relative(root, file);
  const pageUrl =
    '/' +
    rel
      .replace(/index\.html$/, '')
      .split(sep)
      .join('/');
  if (!/<meta[^>]+property=["']og:image["']/.test(html))
    errors.push(`${rel}: no og:image`);

  const refs = [];
  for (const m of html.matchAll(/\b(?:href|src)=["']([^"']*)["']/g))
    refs.push(m[1]);
  for (const m of html.matchAll(/\bsrcset=["']([^"']*)["']/g)) {
    for (const part of m[1].split(',')) refs.push(part.trim().split(/\s+/)[0]);
  }

  for (const ref of refs) {
    if (!ref || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(ref)) continue; // external, mailto:, tel:, data:
    const [pathAndQuery, fragment] = ref.split('#');
    const urlPath = pathAndQuery.split('?')[0] || pageUrl;
    const absolute = urlPath.startsWith('/')
      ? urlPath
      : new URL(urlPath, 'http://x' + pageUrl).pathname;
    const target = resolveTarget(absolute);
    if (!target) {
      errors.push(`${rel}: broken link ${ref}`);
    } else if (
      fragment &&
      target.endsWith('.html') &&
      !idsOf(target).has(fragment)
    ) {
      errors.push(`${rel}: missing anchor ${ref}`);
    }
  }
}

if (errors.length > 0) {
  console.error(
    `${errors.length} problem(s):\n` +
      [...new Set(errors)].map((e) => `  - ${e}`).join('\n'),
  );
  process.exit(1);
}
console.log(
  `Checked ${htmlFiles.length} HTML files in ${root}: no broken internal links.`,
);
