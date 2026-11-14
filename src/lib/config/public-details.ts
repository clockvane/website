import { isPlaceholder, type SiteConfig } from '../../../site.config';

/** A public phone number and its `tel:` link (spaces removed). */
export interface PublicPhone {
  label: string;
  href: string;
}

export function publicDetails(config: SiteConfig) {
  const visible = (value: string) =>
    value.trim() !== '' && !isPlaceholder(value);
  return {
    email: visible(config.email) ? config.email : undefined,
    phones: config.phones.filter(visible).map((label): PublicPhone => ({
      label,
      href: `tel:${label.replace(/\s+/g, '')}`,
    })),
    socials: Object.entries(config.socials)
      .filter(([, value]) => visible(value) && /^https?:\/\//.test(value))
      .map(([label, href]) => ({ label, href })),
  };
}
