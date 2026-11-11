import { describe, expect, it } from 'vitest';
import { privacyCopy } from '../../../src/content/privacy';

const sectionText = (body: (typeof privacyCopy.sections)[number]['body']) =>
  body.map((part) => (typeof part === 'string' ? part : part.label)).join('');

describe('privacy copy (#198)', () => {
  it.each(privacyCopy.sections.map((s) => [s.heading, s.body] as const))(
    '"%s" joins its parts into well-spaced sentences',
    (_heading, body) => {
      const text = sectionText(body);
      // A sentence end directly followed by a capital means a part lost its trailing space.
      expect(text).not.toMatch(/[.!?][A-Z]/);
      expect(text).not.toMatch(/ {2}/);
      expect(text).toBe(text.trim());
    },
  );

  it('has no placeholder markers', () => {
    const all = privacyCopy.sections.map((s) => sectionText(s.body)).join(' ');
    expect(all).not.toContain('PLACEHOLDER');
  });
});
