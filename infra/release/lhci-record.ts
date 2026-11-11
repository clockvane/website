// Lighthouse history recorder (docs/devops/cicd.md, Observability). No dependencies.
// Usage: node infra/release/lhci-record.ts --manifest .lighthouseci/manifest.json \
//   --history <dir>/metrics/lighthouse.json --url https://… --sha <sha> --date YYYY-MM-DD \
//   --failures failures.md
// Appends one entry to the history file and writes a Markdown list of scores under the
// threshold to --failures (the file is empty when everything passes).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export const THRESHOLD = 95;
export const CATEGORIES = [
  'performance',
  'accessibility',
  'best-practices',
  'seo',
] as const;

export type Scores = Record<(typeof CATEGORIES)[number], number>;
export type Entry = {
  date: string;
  sha: string;
  url: string;
  pages: Record<string, Scores>;
  min: number;
};
type ManifestRun = {
  url: string;
  isRepresentativeRun?: boolean;
  summary: Record<string, number>;
};

/** Scores (0-100) per page path from the representative runs of an LHCI manifest. */
export function pagesFromManifest(runs: ManifestRun[]): Record<string, Scores> {
  const pages: Record<string, Scores> = {};
  for (const run of runs.filter((r) => r.isRepresentativeRun)) {
    const scores = {} as Scores;
    for (const c of CATEGORIES) {
      scores[c] = Math.round((run.summary[c] ?? 0) * 100);
    }
    pages[new URL(run.url).pathname] = scores;
  }
  return pages;
}

export function buildEntry(
  pages: Record<string, Scores>,
  meta: { date: string; sha: string; url: string },
): Entry {
  const all = Object.values(pages).flatMap((s) => Object.values(s));
  return { ...meta, pages, min: all.length ? Math.min(...all) : 0 };
}

export function failures(entry: Entry): string[] {
  const out: string[] = [];
  for (const [path, scores] of Object.entries(entry.pages)) {
    for (const c of CATEGORIES) {
      if (scores[c] < THRESHOLD) out.push(`- \`${path}\` ${c}: ${scores[c]}`);
    }
  }
  return out;
}

function arg(name: string): string {
  const i = process.argv.indexOf(`--${name}`);
  const value = i > -1 ? process.argv[i + 1] : undefined;
  if (!value) throw new Error(`Missing --${name}`);
  return value;
}

function main(): void {
  const runs = JSON.parse(readFileSync(arg('manifest'), 'utf8'));
  const entry = buildEntry(pagesFromManifest(runs), {
    date: arg('date'),
    sha: arg('sha'),
    url: arg('url'),
  });
  if (!Object.keys(entry.pages).length) {
    throw new Error('No representative Lighthouse runs in the manifest');
  }
  const historyPath = arg('history');
  let history: Entry[] = [];
  try {
    history = JSON.parse(readFileSync(historyPath, 'utf8'));
  } catch {
    // First run: the file does not exist yet.
  }
  mkdirSync(dirname(historyPath), { recursive: true });
  writeFileSync(
    historyPath,
    `${JSON.stringify([...history, entry], null, 2)}\n`,
  );
  const bad = failures(entry);
  writeFileSync(arg('failures'), bad.length ? `${bad.join('\n')}\n` : '');
  console.log(
    `Recorded ${Object.keys(entry.pages).length} pages, min ${entry.min}`,
  );
}

if (process.argv[1]?.endsWith('lhci-record.ts')) main();
