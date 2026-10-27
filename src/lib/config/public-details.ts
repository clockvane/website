import { isPlaceholder, type SiteConfig } from '../../../site.config';

export function publicDetails(config: SiteConfig) {
  const visible = (value: string) =>
    value.trim() !== '' && !isPlaceholder(value);
  return {
    email: visible(config.email) ? config.email : undefined,
    phone: visible(config.phone) ? config.phone : undefined,
    socials: Object.entries(config.socials)
      .filter(([, value]) => visible(value) && /^https?:\/\//.test(value))
      .map(([label, href]) => ({ label, href })),
  };
}
