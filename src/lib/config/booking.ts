import { isPlaceholder, type SiteConfig } from '../../../site.config';

/** A call-to-action link; `newTab` is set when it leaves the site for the booking page. */
export interface CtaLink {
  label: string;
  href: string;
  newTab?: boolean;
}

/** Where a "Book a call" CTA goes: the booking page when configured, else the in-site fallback. */
export function bookingDestination(config: SiteConfig): {
  href: string;
  newTab: boolean;
} {
  return isPlaceholder(config.booking)
    ? { href: config.primaryCta.href, newTab: false }
    : { href: config.booking, newTab: true };
}

/** Attributes for a link that opens in a new tab without giving the new page access to this one. */
export function newTabAttrs(link: Pick<CtaLink, 'newTab'>) {
  return link.newTab
    ? ({ target: '_blank', rel: 'noopener noreferrer' } as const)
    : {};
}
