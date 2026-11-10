import { describe, expect, it } from 'vitest';
import { siteConfig } from '../../../../site.config';
import {
  bookingDestination,
  newTabAttrs,
} from '../../../../src/lib/config/booking';
import { primaryCta } from '../../../../src/content/navigation';
import { services } from '../../../../src/content/services';
import { serviceTabs } from '../../../../src/content/service-tabs';

describe('booking destination', () => {
  it('sends CTAs to the configured booking page in a new tab', () => {
    expect(bookingDestination(siteConfig)).toEqual({
      href: 'https://meetings-na2.hubspot.com/clockvane',
      newTab: true,
    });
  });

  it('falls back to the contact page while the booking URL is a placeholder', () => {
    expect(
      bookingDestination({
        ...siteConfig,
        booking: '[[PLACEHOLDER: booking URL, PRD Q4]]',
      }),
    ).toEqual({ href: '/contact/', newTab: false });
  });

  it('gives every primary and service CTA the same destination', () => {
    const { href, newTab } = bookingDestination(siteConfig);
    expect(primaryCta).toEqual({ label: 'Book a call', href, newTab });
    for (const { cta } of [...services, ...serviceTabs])
      expect({ href: cta.href, newTab: cta.newTab }).toEqual({ href, newTab });
  });

  it('adds new-tab attributes only to links that leave for the booking page', () => {
    expect(newTabAttrs({ newTab: true })).toEqual({
      target: '_blank',
      rel: 'noopener noreferrer',
    });
    expect(newTabAttrs({ newTab: false })).toEqual({});
    expect(newTabAttrs({})).toEqual({});
  });
});
