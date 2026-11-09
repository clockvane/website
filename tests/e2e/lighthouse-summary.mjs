/* Prints a Markdown table of Lighthouse scores and page weights from `.lighthouseci/`
   (written by `npm run test:lighthouse`). CI appends it to the job summary, so tickets and
   reviews can cite CI instead of a local run (#97). */
import { existsSync, readFileSync } from 'node:fs';

// Optional argument: the preset, `mobile` (default) or `desktop`.
const preset = process.argv[2] === 'desktop' ? 'desktop' : 'mobile';
const dir = preset === 'desktop' ? '.lighthouseci/desktop' : '.lighthouseci';
const manifestPath = `${dir}/manifest.json`;
if (!existsSync(manifestPath)) {
  console.log(`No Lighthouse results: \`${manifestPath}\` is missing.`);
  process.exit(0);
}

const runs = JSON.parse(readFileSync(manifestPath, 'utf8')).filter(
  (run) => run.isRepresentativeRun,
);
const score = (value) =>
  typeof value === 'number' ? String(Math.round(value * 100)) : '–';
const kB = (bytes) =>
  typeof bytes === 'number' ? (bytes / 1000).toFixed(1) : '–';
const num = (value, digits = 0) =>
  typeof value === 'number' ? value.toFixed(digits) : '–';

const lines = [
  `### Lighthouse — ${preset}, representative run per page`,
  '',
  '| Page | Perf | A11y | BP | SEO | LCP ms | CLS | TBT ms | JS kB | CSS kB | Font kB | Total kB |',
  '|---|---|---|---|---|---|---|---|---|---|---|---|',
];
for (const run of runs) {
  const { audits } = JSON.parse(readFileSync(run.jsonPath, 'utf8'));
  const items = audits['resource-summary']?.details?.items ?? [];
  const size = (type) =>
    items.find((item) => item.resourceType === type)?.transferSize;
  const s = run.summary ?? {};
  lines.push(
    `| ${new URL(run.url).pathname} | ${score(s.performance)} | ${score(s.accessibility)} | ` +
      `${score(s['best-practices'])} | ${score(s.seo)} | ` +
      `${num(audits['largest-contentful-paint']?.numericValue)} | ` +
      `${num(audits['cumulative-layout-shift']?.numericValue, 3)} | ` +
      `${num(audits['total-blocking-time']?.numericValue)} | ${kB(size('script'))} | ` +
      `${kB(size('stylesheet'))} | ${kB(size('font'))} | ${kB(size('total'))} |`,
  );
}
console.log(lines.join('\n'));
