export interface Crumb {
  label: string;
  /** Root-relative path. */
  href: string;
}

/** schema.org BreadcrumbList JSON-LD. BaseLayout escapes it with `serializeJsonLd`. */
export function breadcrumbJsonLd(crumbs: readonly Crumb[], origin: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: new URL(crumb.href, origin).href,
    })),
  };
}
