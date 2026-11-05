/** Service labels/order from services.ts (change request 3); routes from sitemap.md. */
import { services as serviceContent } from './services';
import { siteConfig } from '../../site.config';
export const services = serviceContent.map(({ href, label }) => ({
  href,
  label,
}));
export const company = [
  { href: '/how-we-work/', label: 'How we work' },
  { href: '/about/', label: 'About' },
] as const;
export const allServices = { href: '/services/', label: 'All services' };
export const primaryCta = siteConfig.primaryCta;
