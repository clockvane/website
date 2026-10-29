import { describe, expect, it } from 'vitest';
import { isPlaceholder, siteConfig, siteConfigSchema } from '../../site.config';
import { primaryCta } from '../../src/content/navigation';

describe('site config', () => {
  it('matches its schema and names the brand', () => {
    expect(siteConfigSchema.parse(siteConfig).brand).toBe('Clockvane');
  });

  it('rejects an invalid config', () => {
    expect(
      siteConfigSchema.safeParse({ ...siteConfig, brand: '' }).success,
    ).toBe(false);
    expect(siteConfigSchema.safeParse({}).success).toBe(false);
  });

  it('flags placeholder values', () => {
    expect(isPlaceholder(siteConfig.email)).toBe(true);
    expect(isPlaceholder(siteConfig.brand)).toBe(false);
  });

  it('shares the configured CTA with navigation and rejects an empty label', () => {
    expect(primaryCta).toBe(siteConfig.primaryCta);
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
});
