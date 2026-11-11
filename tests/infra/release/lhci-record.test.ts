import { describe, expect, it } from 'vitest';
import {
  buildEntry,
  failures,
  pagesFromManifest,
} from '../../../infra/release/lhci-record';

const summary = (p: number, a = 1, b = 1, s = 1) => ({
  performance: p,
  accessibility: a,
  'best-practices': b,
  seo: s,
});

describe('lhci-record', () => {
  const pages = pagesFromManifest([
    {
      url: 'https://x.test/',
      isRepresentativeRun: true,
      summary: summary(0.99),
    },
    { url: 'https://x.test/', summary: summary(0.5) },
    {
      url: 'https://x.test/about/',
      isRepresentativeRun: true,
      summary: summary(1, 0.94),
    },
  ]);

  it('keeps one rounded score set per page from representative runs', () => {
    expect(Object.keys(pages)).toEqual(['/', '/about/']);
    expect(pages['/']?.performance).toBe(99);
  });

  it('records the minimum score and lists scores under 95', () => {
    const entry = buildEntry(pages, {
      date: '2026-11-11',
      sha: 'abc',
      url: 'https://x.test',
    });
    expect(entry.min).toBe(94);
    expect(failures(entry)).toEqual(['- `/about/` accessibility: 94']);
  });
});
