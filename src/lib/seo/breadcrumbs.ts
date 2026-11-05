export interface Crumb {
  label: string;
  /** Root-relative path. */
  href: string;
}

/**
 * schema.org BreadcrumbList as a string for a `<script type="application/ld+json">` body. `<` is
 * escaped so no value can close the script element.
 */
export function breadcrumbJsonLd(
  crumbs: readonly Crumb[],
  origin: string,
): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: new URL(crumb.href, origin).href,
    })),
  }).replaceAll('<', '\\u003c');
}
