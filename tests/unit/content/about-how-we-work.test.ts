import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { siteConfig } from '../../../site.config';
import { aboutCopy } from '../../../src/content/about';
import { howWeWork } from '../../../src/content/how-we-work';

const deck = readFileSync(
  new URL('../../../docs/content/copy-deck.md', import.meta.url),
  'utf8',
);

function deckSection(start: string, end: string): string {
  const from = deck.indexOf(start);
  const to = deck.indexOf(end, from);
  expect(from).toBeGreaterThanOrEqual(0);
  expect(to).toBeGreaterThan(from);
  return deck.slice(from, to);
}

/** Every piece of visible copy in a module; hrefs are destinations, not copy. */
function copyStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(copyStrings);
  if (typeof value === 'object' && value !== null)
    return Object.entries(value).flatMap(([key, entry]) =>
      key === 'href' ? [] : copyStrings(entry),
    );
  return [];
}

const pages = [
  {
    name: 'About',
    copy: aboutCopy,
    section: deckSection('## 5. About', '## 6. Contact'),
  },
  {
    name: 'How we work',
    copy: howWeWork,
    section: deckSection('## 4. How we work', '## 5. About'),
  },
];

describe.each(pages)('$name copy (copy deck v3)', ({ copy, section }) => {
  it('uses verbatim strings from its deck section', () => {
    const resolved = section.replaceAll('{brand}', siteConfig.brand);
    for (const text of copyStrings(copy)) expect(resolved).toContain(text);
  });

  it('keeps SEO text within the deck limits and without the brand', () => {
    expect(copy.title.length).toBeLessThanOrEqual(60);
    expect(copy.description.length).toBeLessThanOrEqual(155);
    expect(`${copy.title} ${copy.description}`).not.toContain(siteConfig.brand);
  });
});

describe('About and How we work', () => {
  it('have distinct titles and descriptions', () => {
    expect(aboutCopy.title).not.toBe(howWeWork.title);
    expect(aboutCopy.description).not.toBe(howWeWork.description);
  });

  it('read the brand from config and name only the approved founders', () => {
    expect(aboutCopy.who.body).toBe(
      `${siteConfig.brand} was started by Mohammed Farhan, Adnan Sameer and Syed Zoheb Ali.`,
    );
  });

  it('show no public links and no placeholders for answered Q5, Q8 and Q20', () => {
    const text = [aboutCopy, howWeWork].flatMap(copyStrings).join(' ');
    expect(text).not.toMatch(/PLACEHOLDER: (Q5|Q8|Q20)\b/);
    expect(text).not.toMatch(/github|medium|public repositories|articles/i);
    expect(aboutCopy.proof).not.toHaveProperty('links');
  });

  it('state quote-per-project pricing after a free first call', () => {
    expect(howWeWork.pricing.body).toContain(
      'Every project is quoted after a free first call.',
    );
  });

  it('keep the deck placeholder for unanswered Q19', () => {
    expect(howWeWork.support.body).toContain('[[PLACEHOLDER: Q19');
  });

  it('show no price amounts or old package timelines', () => {
    const text = copyStrings(howWeWork).join(' ');
    expect(text).not.toMatch(/[₹$€£]\s?\d|\d+\s?[–-]\s?\d+\s(days|weeks)/);
  });
});
