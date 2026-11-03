/**
 * The four services from change request 3 (docs/product/BRIEF.md), in the
 * brief's order. DRAFT wording taken from the brief until copy deck v3
 * replaces it; owner-dependent details stay explicit placeholders (rule 9).
 */
const entries = [
  {
    slug: 'expert-support',
    label: 'Expert support',
    linkLabel: 'Read about expert support',
    summary:
      'Experienced specialists help with advice, troubleshooting, hands-on help and guidance on technical work.',
    work: [
      'Advice on technical decisions',
      'Troubleshooting',
      'Hands-on help with technical work',
      '[[PLACEHOLDER: areas of expertise and how a session works]]',
    ],
  },
  {
    slug: 'ai-automation',
    label: 'AI automation',
    linkLabel: 'Read about AI automation',
    summary: 'AI agents and automations built into your workflows.',
    work: [
      'AI agents that take on steps of your work',
      'Automations built into the tools you already use',
    ],
  },
  {
    slug: 'website-creation',
    label: 'Website creation',
    linkLabel: 'Read about website creation',
    summary: 'Websites and web apps, designed and built.',
    work: ['Website design and build', 'Web apps'],
  },
  {
    slug: 'solutions-for-companies',
    label: 'Solutions for companies',
    linkLabel: 'Read about solutions for companies',
    summary: 'Tailored software and technical solutions.',
    work: [
      'Tailored software',
      '[[PLACEHOLDER: scope of the solutions we offer]]',
    ],
  },
] as const;

export type ServiceSlug = (typeof entries)[number]['slug'];
export const services = entries.map((service) => ({
  ...service,
  href: `/services/${service.slug}/`,
}));
