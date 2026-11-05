import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import tokens from '../../../../docs/design/tokens.json';
import {
  tokenMedia,
  tokenName,
  tokenProperties,
  tokenValue,
} from '../../../../src/lib/design/tokens';

const css = tokenProperties(tokens).join('\n');
const sharedCss = readFileSync('src/styles/responsive.template.css', 'utf8');

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}
const sources = files('src')
  .filter((path) => /\.(astro|css)$/.test(path))
  .filter((path) => !path.endsWith('tokens.css'))
  .map((path) => ({ path, text: readFileSync(path, 'utf8') }));

describe('DTCG token generation', () => {
  it('emits v3 tokens with dimensions, aliases and composite values', () => {
    expect(css).toContain('--color-light-canvas: #FFFFFF;');
    expect(css).toContain('--font-size-hero-wide: 4.25rem;');
    expect(css).toContain(
      '--font-family-sans: "Public Sans", "Arial", sans-serif;',
    );
    expect(css).toContain(
      '--motion-ease-standard: cubic-bezier(0.2, 0, 0, 1);',
    );
    expect(css).toContain('--shadow-card: 0px 8px 24px 0px #0000000A;');
    expect(css).not.toContain('$');
    expect(tokenName('color.light.textMuted')).toBe('color-light-text-muted');
    expect(tokenValue('normal')).toBe('normal');
    expect(() => tokenValue(null)).toThrow('Unsupported design token');
  });

  it('replaces breakpoint placeholders and rejects unknown tokens', () => {
    expect(tokenMedia('(min-width: token(breakpoint.md))', tokens)).toBe(
      '(min-width: 48rem)',
    );
    expect(() => tokenMedia('token(breakpoint.nope)', tokens)).toThrow(
      'Unknown token',
    );
  });

  it('every var() in src resolves to a token or a local custom property', () => {
    for (const { path, text } of sources) {
      for (const [, name] of text.matchAll(/var\(--([\w-]+)/g)) {
        const known = [css, sharedCss, text].some((t) =>
          t.includes(`--${name}:`),
        );
        expect(known, `${path} uses unknown --${name}`).toBe(true);
      }
    }
  });

  it('component media queries use only breakpoint tokens', () => {
    // 23rem is the one documented exception: where the headline's no-wrap runs fit at 320 px.
    const allowed = new Set([
      ...Object.values(tokens.breakpoint)
        .filter((t) => typeof t === 'object' && '$value' in t)
        .map((t) => tokenValue((t as { $value: unknown }).$value)),
      '23rem',
    ]);
    for (const { path, text } of sources) {
      for (const [, width] of text.matchAll(/min-width: ([\d.]+rem)\)/g)) {
        expect(allowed.has(width ?? ''), `${path}: ${width}`).toBe(true);
      }
    }
  });
});
