/** Labels/order from copy-deck.md shared blocks; routes from sitemap.md. */
import { services as serviceContent } from './services';
export const services = serviceContent.map(({ href, label }) => ({
  href,
  label,
}));
export const company = [
  { href: '/how-we-work/', label: 'How we work' },
  { href: '/about/', label: 'About' },
] as const;
export const primaryCta = {
  href: '/contact/',
  label: 'Book a free audit call',
};
