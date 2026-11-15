import { describe, expect, it } from 'vitest';
import { accessibilityCopy } from '../../../src/content/accessibility';

const flatten = (parts: readonly unknown[]): string =>
  parts
    .map((p) => (typeof p === 'string' ? p : (p as { label: string }).label))
    .join('');

describe('accessibility statement copy', () => {
  it('keeps SEO title and description within the length budget', () => {
    expect(accessibilityCopy.title.length).toBeLessThanOrEqual(60);
    expect(accessibilityCopy.description.length).toBeLessThanOrEqual(155);
  });

  it('has no placeholders and makes no certification or audit claim', () => {
    const text = [
      accessibilityCopy.title,
      accessibilityCopy.description,
      accessibilityCopy.intro,
      ...accessibilityCopy.sections.flatMap((s) => s.paragraphs.map(flatten)),
    ].join(' ');
    expect(text).not.toMatch(/PLACEHOLDER/);
    expect(text).not.toMatch(/certified|certificate of|ISO \d/i);
  });

  it('states the target standard and a reporting route', () => {
    const text = accessibilityCopy.sections
      .flatMap((s) => s.paragraphs.map(flatten))
      .join(' ');
    expect(text).toContain('WCAG) 2.2 at level AA');
    const hrefs = accessibilityCopy.sections.flatMap((s) =>
      s.paragraphs
        .flat()
        .flatMap((p) => (typeof p === 'string' ? [] : [p.href])),
    );
    expect(hrefs).toContain('/contact/');
  });
});
