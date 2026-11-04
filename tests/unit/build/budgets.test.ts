/** NFR §1.1 `dist/` scan: P-4, P-5, P-7, P-8 over the built site. DIST_DIR points at another build. */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

const dist = resolve(process.env.DIST_DIR ?? 'dist');
const KB = 1000;
const gz = (path: string) => gzipSync(readFileSync(path), { level: 9 }).length;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

describe.skipIf(!existsSync(dist))('dist budgets', () => {
  const files = existsSync(dist) ? walk(dist) : [];
  const pages = files.filter((file) => file.endsWith('.html'));
  const assets = (html: string, pattern: RegExp) =>
    [...html.matchAll(pattern)].map((m) => join(dist, m[1] ?? ''));

  it('ships no PNG, JPEG or GIF from the pipeline, and each image ≤ 100 kB', () => {
    const generated = files.filter((file) => file.includes('/_astro/'));
    expect(generated.filter((f) => /\.(png|jpe?g|gif)$/.test(f))).toEqual([]);
    for (const file of generated.filter((f) => /\.(avif|webp)$/.test(f))) {
      expect(statSync(file).size, file).toBeLessThanOrEqual(100 * KB);
    }
  });

  it.each(pages)('%s stays within its budgets', (page) => {
    const html = readFileSync(page, 'utf8');
    const scripts = assets(html, /<script[^>]+src="(\/[^"]+)"/g);
    const styles = assets(html, /<link[^>]+href="(\/[^"]+\.css)"/g);
    const sum = (list: string[]) => list.reduce((n, f) => n + gz(f), 0);
    expect(sum(scripts), 'P-4 script').toBeLessThanOrEqual(50 * KB);
    for (const script of scripts.filter((f) => /motion/.test(f))) {
      expect(gz(script), 'P-4 motion controller').toBeLessThanOrEqual(5 * KB);
    }
    expect(sum(styles), 'P-5 CSS').toBeLessThanOrEqual(40 * KB);

    let eagerBytes = 0;
    let pictureBytes = 0;
    for (const [picture] of html.matchAll(/<picture>.*?<\/picture>/gs)) {
      const avif =
        /<source[^>]+srcset="([^"]+)"[^>]*type="image\/avif"|<source[^>]+type="image\/avif"[^>]+srcset="([^"]+)"/.exec(
          picture,
        );
      const set = (avif?.[1] ?? avif?.[2] ?? '').split(',');
      const largest = set.at(-1)?.trim().split(' ')[0] ?? '';
      const bytes = largest ? statSync(join(dist, largest)).size : 0;
      pictureBytes += bytes;
      if (!picture.includes('loading="lazy"')) eagerBytes += bytes;
    }
    expect(eagerBytes, 'P-7 above the fold').toBeLessThanOrEqual(200 * KB);
    for (const [img] of html.matchAll(/<img\b[^>]*>/g)) {
      if (/\.svg/.test(img)) continue;
      for (const attr of ['alt=', 'width=', 'height=', 'srcset=', 'sizes=']) {
        expect(img, `P-7 ${page}`).toContain(attr);
      }
    }
    const fonts = files.filter((f) => f.endsWith('.woff2'));
    const total =
      gzipSync(html).length +
      sum(scripts) +
      sum(styles) +
      fonts.reduce((n, f) => n + statSync(f).size, 0) +
      pictureBytes;
    expect(total, 'P-8 page weight').toBeLessThanOrEqual(1500 * KB);
  });
});
