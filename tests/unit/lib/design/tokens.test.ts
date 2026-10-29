import { describe, expect, it } from 'vitest';
import tokens from '../../../../docs/design/tokens.json';
import {
  tokenMedia,
  tokenProperties,
  tokenValue,
} from '../../../../src/lib/design/tokens';

function resolved(path: string, visited = new Set<string>()): unknown {
  if (visited.has(path)) throw new Error(`Circular token alias: ${path}`);
  visited.add(path);
  const node = path.split('.').reduce<unknown>((group, key) => {
    return (group as Record<string, unknown>)?.[key];
  }, tokens) as { $value?: unknown } | undefined;
  if (!node || !('$value' in node)) throw new Error(`Missing token: ${path}`);
  const value = node.$value;
  return typeof value === 'string' && value.startsWith('{')
    ? resolved(value.slice(1, -1), visited)
    : value;
}

describe('DTCG token generation', () => {
  it('emits every token, preserving aliases, dimensions and composite values', () => {
    const css = tokenProperties(tokens).join('\n');
    expect(css).toContain(
      '--color-light-action-hover: var(--color-dark-action-hover);',
    );
    expect(css).toContain('--font-size-hero-wide: 6.5rem;');
    expect(css).toContain(
      '--font-family-body: "Public Sans", "Arial", sans-serif;',
    );
    expect(css).toContain(
      '--elevation-flat: 0px 0px 0px 0px var(--palette-canvas);',
    );
    expect(css).toContain('--motion-ease-out: cubic-bezier(0, 0, 0.2, 1);');
    expect(css).not.toContain('$');
    expect(tokenValue('normal')).toBe('normal');
    expect(() => tokenValue(null)).toThrow('Unsupported design token');

    // Every generated alias must resolve; missing legacy paths would silently break CSS.
    for (const alias of css.matchAll(/var\(--([\w-]+)\)/g)) {
      expect(css).toContain(`--${alias[1]}:`);
    }
    for (const role of Object.keys(tokens.color.dark)) {
      expect(resolved(`color.light.${role}`)).toEqual(
        resolved(`color.dark.${role}`),
      );
      expect(resolved(`color.inverse.${role}`)).toEqual(
        resolved(`color.dark.${role}`),
      );
    }
    for (const [legacy, canonical] of Object.entries({
      paper: 'canvas',
      paperDeep: 'panel',
      ink: 'text',
      inkSoft: 'muted',
      brass: 'ice',
      navy: 'iceHover',
      brassLight: 'ice',
    })) {
      expect(resolved(`palette.${legacy}`)).toEqual(
        resolved(`palette.${canonical}`),
      );
    }
  });

  it('substitutes media thresholds and rejects missing tokens', () => {
    expect(
      tokenMedia('@media (min-width: token(breakpoint.desktop)) {}', tokens),
    ).toBe('@media (min-width: 64rem) {}');
    expect(() => tokenMedia('token(breakpoint.missing)', tokens)).toThrow(
      'Unknown token',
    );
  });

  it('keeps every approved opaque color pairing above AA text and UI thresholds', () => {
    const luminance = (hex: string) => {
      const channels = hex
        .slice(1)
        .match(/../g)!
        .map((byte) => {
          const c = parseInt(byte, 16) / 255;
          return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
      return (
        channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722
      );
    };
    const pairs = tokens.$extensions['org.design.audit'].contrast;
    const color = (path: string) =>
      resolved(path) as { hex: string; alpha: number };
    for (const surface of ['canvas', 'panel']) {
      for (const foreground of [
        'text',
        'muted',
        'ice',
        'iceHover',
        'line',
        'error',
      ]) {
        expect(
          pairs.some(
            (p) =>
              p.foreground === `palette.${foreground}` &&
              p.background === `palette.${surface}`,
          ),
        ).toBe(true);
      }
    }
    for (const pair of pairs) {
      expect(color(pair.foreground).alpha).toBe(1);
      expect(color(pair.background).alpha).toBe(1);
      const a = luminance(color(pair.foreground).hex);
      const b = luminance(color(pair.background).hex);
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      expect(ratio).toBeGreaterThanOrEqual(Math.max(4.5, pair.textMinimum));
      expect(ratio).toBeGreaterThanOrEqual(Math.max(3, pair.uiMinimum));
      expect(Number(ratio.toFixed(2))).toBe(pair.ratio);
    }
    // Button labels/icons use the dark canvas; ring sits outside on the dark surface.
    for (const role of ['action', 'actionHover', 'actionActive']) {
      const a = luminance(color(`color.dark.${role}`).hex);
      const b = luminance(color('color.dark.onAction').hex);
      expect(
        (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});
