import type { SiteConfig } from '../../../site.config';
import { publicDetails } from '../config/public-details';

/** Organization JSON-LD (NFR S-5). Unset details are left out, never published as placeholders. */
export function organizationJsonLd(config: SiteConfig, origin: string) {
  const { email, phone, socials } = publicDetails(config);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.brand,
    slogan: config.tagline,
    url: new URL('/', origin).href,
    ...(email ? { email } : {}),
    ...(phone ? { telephone: phone } : {}),
    ...(socials.length > 0 ? { sameAs: socials.map(({ href }) => href) } : {}),
  };
}

/** Escapes `<` so a value can never close the surrounding script element. */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
