import { z } from 'zod';

/**
 * The ONLY place for brand name, domain, email, phone, socials and analytics IDs
 * (CLAUDE.md rule 5, ADR-001). Values are placeholders until the owner supplies them.
 */
export const siteConfigSchema = z.object({
  brand: z.string().min(1),
  domain: z.string().min(1),
  email: z.string().min(1),
  phone: z.string().min(1),
  socials: z.object({
    linkedin: z.string().min(1),
    github: z.string().min(1),
  }),
  analyticsId: z.string().min(1),
});

export type SiteConfig = z.infer<typeof siteConfigSchema>;

export const siteConfig: SiteConfig = siteConfigSchema.parse({
  brand: 'Clockvane',
  domain: '[[PLACEHOLDER: production domain, planned clockvane.com]]',
  email: '[[PLACEHOLDER: public contact email]]',
  phone: '[[PLACEHOLDER: public phone number, optional]]',
  socials: {
    linkedin: '[[PLACEHOLDER: LinkedIn URL]]',
    github: '[[PLACEHOLDER: GitHub organisation URL]]',
  },
  analyticsId: '[[PLACEHOLDER: analytics ID, PRD Q10]]',
});

/** True while a config value still holds a `[[PLACEHOLDER: ...]]` marker. */
export function isPlaceholder(value: string): boolean {
  return value.startsWith('[[PLACEHOLDER:') && value.endsWith(']]');
}

/** Reserved, non-live origin until the owner supplies the production domain. */
export const siteOrigin = isPlaceholder(siteConfig.domain)
  ? 'https://example.invalid'
  : new URL(
      siteConfig.domain.includes('://')
        ? siteConfig.domain
        : `https://${siteConfig.domain}`,
    ).origin;
