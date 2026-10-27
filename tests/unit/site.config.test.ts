import { describe, expect, it } from 'vitest';
import { isPlaceholder, siteConfig, siteConfigSchema } from '../../site.config';

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
});
