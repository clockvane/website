import { z } from 'zod';

/**
 * The ONLY place for brand name, domain, email, phone, socials and analytics IDs
 * (CLAUDE.md rule 5, ADR-001). Values are placeholders until the owner supplies them.
 */
const ANALYTICS_TOKEN = /^[0-9a-f]{32}$/;

export const siteConfigSchema = z.object({
  brand: z.string().min(1),
  tagline: z.string().min(1),
  domain: z.string().min(1),
  email: z.string().min(1),
  phone: z.string().min(1),
  socials: z.object({
    linkedin: z.string().min(1),
    github: z.string().min(1),
  }),
  /** Cloudflare Web Analytics site token (public, 32 hex chars) or a placeholder, which disables analytics. */
  analyticsId: z
    .string()
    .refine((value) => isPlaceholder(value) || ANALYTICS_TOKEN.test(value)),
  primaryCta: z.object({
    label: z.string().min(1),
    href: z.string().regex(/^\/(?![\/\\])/),
  }),
  contact: z.object({
    endpoint: z.url().refine((value) => value.startsWith('https://')),
  }),
});

export type SiteConfig = z.infer<typeof siteConfigSchema>;

export const siteConfig: SiteConfig = siteConfigSchema.parse({
  brand: 'Clockvane',
  tagline: 'Built by experts. Powered by AI.',
  // Free Cloudflare Pages host until a domain is bought (ADR-002 domain plan step 1).
  domain: 'clockvane-website.pages.dev',
  email: 'clockvane.support@gmail.com',
  phone: '[[PLACEHOLDER: public phone number, optional]]',
  socials: {
    linkedin: '[[PLACEHOLDER: LinkedIn URL]]',
    github: '[[PLACEHOLDER: GitHub organisation URL]]',
  },
  // Cloudflare Web Analytics, approved in PRD Q10; public token from Owner checklist #164.
  analyticsId: 'd47b9f640c8147eea23e26e989fe5d4a',
  primaryCta: { label: 'Book a call', href: '/contact/' },
  contact: { endpoint: 'https://example.invalid/enquiry' },
});

/** True while a config value still holds a `[[PLACEHOLDER: ...]]` marker. */
export function isPlaceholder(value: string): boolean {
  return value.startsWith('[[PLACEHOLDER:') && value.endsWith(']]');
}

/** Analytics token to load, or `undefined` while analytics is not configured. */
export const analyticsToken = isPlaceholder(siteConfig.analyticsId)
  ? undefined
  : siteConfig.analyticsId;

/** Absolute origin for canonical, sitemap, OG and robots.txt; a reserved, non-live origin while `domain` is a placeholder. */
export const siteOrigin = isPlaceholder(siteConfig.domain)
  ? 'https://example.invalid'
  : new URL(
      siteConfig.domain.includes('://')
        ? siteConfig.domain
        : `https://${siteConfig.domain}`,
    ).origin;
