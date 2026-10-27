import { describe, expect, it } from 'vitest';
import tokens from '../../../../docs/design/tokens.json';
import {
  tokenMedia,
  tokenProperties,
  tokenValue,
} from '../../../../src/lib/design/tokens';

describe('DTCG token generation', () => {
  it('emits every token, preserving aliases, dimensions and composite values', () => {
    const css = tokenProperties(tokens).join('\n');
    expect(css).toContain('--color-light-action-hover: var(--palette-navy);');
    expect(css).toContain('--font-size-h1-desktop: 3.5rem;');
    expect(css).toContain(
      '--font-family-body: "Public Sans", "Arial", sans-serif;',
    );
    expect(css).toContain(
      '--elevation-flat: 0px 0px 0px 0px var(--palette-ink);',
    );
    expect(css).toContain('--motion-ease-out: cubic-bezier(0, 0, 0.2, 1);');
    expect(css).not.toContain('$');
    expect(tokenValue('normal')).toBe('normal');
    expect(() => tokenValue(null)).toThrow('Unsupported design token');
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
    for (const pair of tokens.$extensions['org.design.audit'].contrast) {
      const color = (path: string) =>
        tokens.palette[
          path.split('.')[1] as Exclude<keyof typeof tokens.palette, '$type'>
        ];
      const a = luminance(color(pair.foreground).$value.hex);
      const b = luminance(color(pair.background).$value.hex);
      expect(
        (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
      ).toBeGreaterThanOrEqual(pair.textMinimum);
    }
  });
});
