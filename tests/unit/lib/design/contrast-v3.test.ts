import { describe, expect, it } from 'vitest';
import tokens from '../../../../docs/design/tokens.json';
import pairs from '../../../../docs/design/contrast-pairs.json';

type Node = { $value: { hex: string; alpha: number } };

function color(path: string): Node['$value'] {
  const node = path.split('.').reduce<unknown>((group, key) => {
    return (group as Record<string, unknown>)?.[key];
  }, tokens) as Node | undefined;
  if (!node) throw new Error(`Missing token: ${path}`);
  return node.$value;
}

function luminance(hex: string): number {
  const [r, g, b] = hex
    .slice(1, 7)
    .match(/../g)!
    .map((byte) => {
      const c = parseInt(byte, 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

describe('design system v3 contrast', () => {
  it.each(pairs as [string, string, number, string][])(
    '%s on %s meets %d:1 (%s)',
    (foreground, background, needed) => {
      const fg = color(foreground);
      const bg = color(background);
      expect(fg.alpha).toBe(1);
      expect(bg.alpha).toBe(1);
      const [a, b] = [luminance(fg.hex), luminance(bg.hex)];
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      expect(ratio).toBeGreaterThanOrEqual(needed);
    },
  );
});
