import { describe, expect, it } from 'vitest';
import {
  analyticsToken,
  bookingUrl,
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
    expect(isPlaceholder(siteConfig.phone)).toBe(true);
    expect(isPlaceholder(siteConfig.brand)).toBe(false);
  });

  it('holds the owner-approved public contact email', () => {
    expect(siteConfig.email).toBe('clockvane.support@gmail.com');
    expect(isPlaceholder(siteConfig.email)).toBe(false);
  });

  it('derives the site origin from the configured domain', () => {
    expect(isPlaceholder(siteConfig.domain)).toBe(false);
    expect(siteConfig.domain).toBe('clockvane-website.pages.dev');
    expect(siteOrigin).toBe(`https://${siteConfig.domain}`);
  });

  it('shares the configured CTA with navigation and rejects an empty label', () => {
    expect(primaryCta.label).toBe(siteConfig.primaryCta.label);
    expect(primaryCta.label).toBe('Book a call');
    expect(
      siteConfigSchema.safeParse({
        ...siteConfig,
        primaryCta: { ...siteConfig.primaryCta, label: '' },
      }).success,
    ).toBe(false);
    expect(
      siteConfigSchema.safeParse({
        ...siteConfig,
        primaryCta: { ...siteConfig.primaryCta, href: 'javascript:alert(1)' },
      }).success,
    ).toBe(false);
  });

  it.each(['//evil.example', '/\\evil.example', 'javascript:alert(1)'])(
    'rejects a CTA destination outside the site: %s',
    (href) => {
      expect(
        siteConfigSchema.safeParse({
          ...siteConfig,
          primaryCta: { ...siteConfig.primaryCta, href },
        }).success,
      ).toBe(false);
    },
  );

  it('holds the owner-approved HubSpot Meetings booking URL', () => {
    expect(siteConfig.booking).toBe(
      'https://meetings-na2.hubspot.com/clockvane',
    );
    expect(bookingUrl).toBe(siteConfig.booking);
  });

  it.each([
    'https://meetings.example.test/team',
    '[[PLACEHOLDER: booking URL, PRD Q4]]',
  ])('accepts an https booking URL or a placeholder: %s', (booking) => {
    expect(siteConfigSchema.safeParse({ ...siteConfig, booking }).success).toBe(
      true,
    );
  });

  it.each([
    '',
    'meetings.example.test/team',
    'http://meetings.example.test/team',
    'javascript:alert(1)',
    '/contact/',
    'https://user:pass@meetings.example.test/',
  ])('rejects a booking URL that is not plain https: %j', (booking) => {
    expect(siteConfigSchema.safeParse({ ...siteConfig, booking }).success).toBe(
      false,
    );
  });

  it('enables analytics with the configured Cloudflare token', () => {
    expect(isPlaceholder(siteConfig.analyticsId)).toBe(false);
    expect(analyticsToken).toBe(siteConfig.analyticsId);
  });

  it('accepts a 32-hex analytics token or a placeholder', () => {
    for (const analyticsId of [
      '0123456789abcdef0123456789abcdef',
      '[[PLACEHOLDER: analytics ID, PRD Q10]]',
    ]) {
      expect(
        siteConfigSchema.safeParse({ ...siteConfig, analyticsId }).success,
      ).toBe(true);
    }
  });

  it.each([
    '',
    'abc',
    '0123456789ABCDEF0123456789ABCDEF',
    '0123456789abcdef0123456789abcdef0',
    '0123456789abcdef0123456789abcde"',
    'UA-12345-1',
  ])('rejects a malformed analytics token: %j', (analyticsId) => {
    expect(
      siteConfigSchema.safeParse({ ...siteConfig, analyticsId }).success,
    ).toBe(false);
  });
});
