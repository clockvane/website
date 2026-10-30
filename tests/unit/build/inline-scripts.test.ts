import { existsSync, globSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

function inlineScripts(html: string): string[] {
  const violations: string[] = [];
  // Consume comments and script bodies, so script-like text inside them is ignored.
  const scripts =
    /<!--[\s\S]*?-->|<script\b((?:"[^"]*"|'[^']*'|[^'">])*)>[\s\S]*?<\/script\s*>/gi;
  for (const match of html.matchAll(scripts)) {
    const attributes = match[1];
    if (attributes === undefined) continue;
    const values = new Map<string, string>();
    for (const attribute of attributes.matchAll(
      /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g,
    )) {
      values.set(
        attribute[1]!.toLowerCase(),
        attribute[2] ?? attribute[3] ?? attribute[4] ?? '',
      );
    }
    if (
      !values.has('src') &&
      values.get('type')?.toLowerCase() !== 'application/ld+json'
    ) {
      violations.push(`<script${attributes}>`);
    }
  }
  return violations;
}

describe('inline-script detection', () => {
  it.each([
    ['<script type="module">alert(1)</script>', 1],
    ['<script src="/_astro/motion.js"></script>', 0],
    ['<script type="application/ld+json">{"name":"Example"}</script>', 0],
    ["<SCRIPT TYPE='application/ld+json'>{}</SCRIPT>", 0],
    ['<script type=application/ld+json>{}</script>', 0],
    ['<script data-src="/example.js"></script>', 1],
    ['<script data-note=" src=example.js "></script>', 1],
    ['<!-- <script>alert(1)</script> -->', 0],
    ['<script type="application/ld+json">{"text":"<script>"}</script>', 0],
  ])('finds %s', (html, count) => {
    expect(inlineScripts(html)).toHaveLength(count);
  });
});

describe('built HTML CSP (ADR-004)', () => {
  const dist = resolve(process.env.DIST_DIR ?? 'dist');
  if (!existsSync(dist)) {
    console.warn('dist/ is missing; run npm run build first.');
    it.skip('dist/ is missing; run npm run build first', () => {});
    return;
  }

  const pages = globSync('**/*.html', { cwd: dist }).sort();
  it('contains built HTML pages', () => {
    expect(pages.length).toBeGreaterThan(0);
  });

  for (const page of pages) {
    it(`${page} has no inline scripts except JSON-LD`, () => {
      const html = readFileSync(join(dist, page), 'utf8');
      expect(inlineScripts(html), `Inline scripts in ${page}`).toEqual([]);
    });
    it(`${page} fits compressed script and stylesheet budgets`, () => {
      const html = readFileSync(join(dist, page), 'utf8');
      const scripts = [
        ...new Set(
          [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(
            (match) => match[1]!,
          ),
        ),
      ];
      const styles = [
        ...new Set(
          [
            ...html.matchAll(
              /<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g,
            ),
          ].map((match) => match[1]!),
        ),
      ];
      const size = (path: string) =>
        gzipSync(readFileSync(join(dist, path))).byteLength;
      expect(
        scripts.reduce((total, path) => total + size(path), 0),
      ).toBeLessThanOrEqual(35000);
      expect(
        styles.reduce((total, path) => total + size(path), 0),
      ).toBeLessThanOrEqual(40000);
      for (const script of scripts.filter((path) =>
        /MotionScript|motion\./.test(path),
      ))
        expect(size(script), script).toBeLessThanOrEqual(5000);
    });
  }
});
