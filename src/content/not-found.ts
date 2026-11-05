/** Approved copy-deck.md §10. */
export const notFoundCopy = {
  title: 'Page not found: find your next step',
  description:
    'This page could not be found. Return home, explore our services or contact us for help with technical work.',
  heading: 'We could not find that page',
  body: 'The link may be old, or the page may have moved. Try one of these instead.',
  actions: [
    { label: 'Back to home', href: '/' },
    { label: 'Explore our services', href: '/services/' },
    { label: 'Contact us', href: '/contact/' },
  ],
} as const;
