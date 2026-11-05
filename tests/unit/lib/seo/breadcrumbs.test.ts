import { describe, expect, it } from 'vitest';
import { breadcrumbJsonLd } from '../../../../src/lib/seo/breadcrumbs';

const origin = 'https://example.test';

describe('breadcrumbJsonLd', () => {
  it('builds an ordered BreadcrumbList with absolute URLs', () => {
    expect(
      JSON.parse(
        breadcrumbJsonLd(
          [
            { label: 'Home', href: '/' },
            { label: 'Services', href: '/services/' },
          ],
          origin,
        ),
      ),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://example.test/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Services',
          item: 'https://example.test/services/',
        },
      ],
    });
  });

  it('cannot close its script element, and still parses to the same value', () => {
    const label = '</script><b>';
    const json = breadcrumbJsonLd([{ label, href: '/' }], origin);
    expect(json).not.toContain('<');
    expect(JSON.parse(json).itemListElement[0].name).toBe(label);
  });
});
