import { isPlaceholder, type SiteConfig } from '../../../site.config';

/**
 * A public phone number: `number` as configured (for structured data), `label` with
 * non-breaking spaces so it never wraps mid-number (html-validate `tel-non-breaking`),
 * and its `tel:` link with spaces removed.
 */
export interface PublicPhone {
  number: string;
  label: string;
  href: string;
}

export function publicDetails(config: SiteConfig) {
  const visible = (value: string) =>
    value.trim() !== '' && !isPlaceholder(value);
  return {
    email: visible(config.email) ? config.email : undefined,
    phones: config.phones.filter(visible).map((number): PublicPhone => ({
      number,
      label: number.replace(/ /g, ' '),
      href: `tel:${number.replace(/\s+/g, '')}`,
    })),
    socials: Object.entries(config.socials)
      .filter(([, value]) => visible(value) && /^https?:\/\//.test(value))
      .map(([label, href]) => ({ label, href })),
  };
}
