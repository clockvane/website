import { describe, expect, it } from 'vitest';
import {
  isPlaceholder,
  siteConfig,
  siteConfigSchema,
  siteOrigin,
} from '../../site.config';
import { primaryCta } from '../../src/content/navigation';

describe('site config', () => {
  it('matches its schema and holds a name-independent tagline', () => {
    const parsed = siteConfigSchema.parse(siteConfig);
    expect(parsed.brand).not.toBe('');
    expect(parsed.tagline).toBe('Built by experts. Powered by AI.');
    expect(parsed.tagline).not.toContain(parsed.brand);
  });

  it('rejects an invalid config', () => {
    expect(
      siteConfigSchema.safeParse({ ...siteConfig, brand: '' }).success,
    ).toBe(false);
    expect(
      siteConfigSchema.safeParse({ ...siteConfig, tagline: '' }).success,
    ).toBe(false);
    expect(siteConfigSchema.safeParse({}).success).toBe(false);
  });

  it('flags placeholder values', () => {
    expect(isPlaceholder(siteConfig.email)).toBe(true);
    expect(isPlaceholder(siteConfig.brand)).toBe(false);
  });

  it('derives the site origin from the configured domain', () => {
    expect(isPlaceholder(siteConfig.domain)).toBe(false);
    expect(siteConfig.domain).toBe('clockvane-website.pages.dev');
    expect(siteOrigin).toBe(`https://${siteConfig.domain}`);
  });

  it('shares the configured CTA with navigation and rejects an empty label', () => {
    expect(primaryCta).toBe(siteConfig.primaryCta);
    expect(primaryCta.label).toBe('Book a call');
    expect(
      siteConfigSchema.safeParse({
        ...siteConfig,
        primaryCta: { ...primaryCta, label: '' },
      }).success,
    ).toBe(false);
    expect(
      siteConfigSchema.safeParse({
        ...siteConfig,
        primaryCta: { ...primaryCta, href: 'javascript:alert(1)' },
      }).success,
    ).toBe(false);
  });

  it.each(['//evil.example', '/\\evil.example', 'javascript:alert(1)'])(
    'rejects a CTA destination outside the site: %s',
    (href) => {
      expect(
        siteConfigSchema.safeParse({
          ...siteConfig,
          primaryCta: { ...primaryCta, href },
        }).success,
      ).toBe(false);
    },
  );
});
