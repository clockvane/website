import { siteConfig } from '../../site.config';

/** Approved copy-deck.md §10. */
export const notFoundCopy = {
  title: `Page not found | ${siteConfig.brand}`,
  description: 'This page could not be found.',
  heading: 'We could not find that page',
  body: 'The link may be old, or the page may have moved. Try one of these instead.',
  actions: [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services/' },
    { label: 'Contact', href: '/contact/' },
  ],
} as const;
