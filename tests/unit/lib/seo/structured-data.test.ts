import { describe, expect, it } from 'vitest';
import { siteConfig, type SiteConfig } from '../../../../site.config';
import {
  organizationJsonLd,
  serializeJsonLd,
} from '../../../../src/lib/seo/structured-data';

const origin = 'https://example.test';

describe('organizationJsonLd', () => {
  it('reads the name and tagline from the site config', () => {
    expect(organizationJsonLd(siteConfig, origin)).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: siteConfig.brand,
      slogan: siteConfig.tagline,
      url: 'https://example.test/',
    });
  });

  it('follows a rename', () => {
    const renamed: SiteConfig = { ...siteConfig, brand: 'Renamed' };
    expect(organizationJsonLd(renamed, origin).name).toBe('Renamed');
  });

  it('leaves out details that are still placeholders', () => {
    const placeholders: SiteConfig = {
      ...siteConfig,
      email: '[[PLACEHOLDER: email]]',
      phones: [],
      socials: {
        linkedin: '[[PLACEHOLDER: LinkedIn]]',
        github: '[[PLACEHOLDER: GitHub]]',
      },
    };
    const data = organizationJsonLd(placeholders, origin);
    expect(data).not.toHaveProperty('email');
    expect(data).not.toHaveProperty('telephone');
    expect(data).not.toHaveProperty('sameAs');
    expect(JSON.stringify(data)).not.toContain('PLACEHOLDER');
  });

  it('includes details once they are configured', () => {
    const configured: SiteConfig = {
      ...siteConfig,
      email: 'hello@example.test',
      phones: ['+1 555 0100'],
      socials: {
        linkedin: 'https://example.test/linkedin',
        github: '[[PLACEHOLDER: GitHub]]',
      },
    };
    expect(organizationJsonLd(configured, origin)).toMatchObject({
      email: 'hello@example.test',
      telephone: '+1 555 0100',
      sameAs: ['https://example.test/linkedin'],
    });
  });
});

describe('organizationJsonLd telephone', () => {
  it('lists every configured number', () => {
    expect(
      organizationJsonLd(
        { ...siteConfig, phones: ['+91 90633 99157', '+91 94911 25109'] },
        'https://example.test',
      ).telephone,
    ).toEqual(['+91 90633 99157', '+91 94911 25109']);
  });
});

describe('serializeJsonLd', () => {
  it('cannot close the surrounding script element', () => {
    const json = serializeJsonLd({
      name: '</script><script>alert(1)</script>',
    });
    expect(json).not.toContain('<');
    expect(JSON.parse(json)).toEqual({
      name: '</script><script>alert(1)</script>',
    });
  });
});
