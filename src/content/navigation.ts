/** Service labels/order from services.ts (change request 3); routes from sitemap.md. */
import { services as serviceContent } from './services';
import { siteConfig } from '../../site.config';
import { bookingDestination, type CtaLink } from '../lib/config/booking';
export const services = serviceContent.map(({ href, label }) => ({
  href,
  label,
}));
export const company = [
  { href: '/how-we-work/', label: 'How we work' },
  { href: '/about/', label: 'About' },
] as const;
export const allServices = { href: '/services/', label: 'All services' };
/** Site-wide "Book a call": the booking page when configured, else `/contact/` (copy deck, #177). */
export const primaryCta: CtaLink = {
  label: siteConfig.primaryCta.label,
  ...bookingDestination(siteConfig),
};
/** microcopy.md §2 external link hint. */
export const newTabHint = 'Opens in a new tab';
