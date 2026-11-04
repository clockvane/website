/** Copy deck `services.shared`: the four services as the "one place" tabs present them. */
import type { ExampleId } from './examples';
import type { ServiceKey } from './services';
import { services } from './services';

export interface ServiceTab {
  key: ServiceKey;
  name: string;
  summary: string;
  audience: string;
  cta: { label: string; href: string };
  link: { label: string; href: string };
  thumbs: [ExampleId, ExampleId, ExampleId];
}

const contact = '/contact/';
const hrefOf = (key: ServiceKey) =>
  services.find((service) => service.key === key)?.href ?? '/services/';

export const serviceTabs: ServiceTab[] = [
  {
    key: 'expert',
    name: 'Expert support',
    summary:
      'Get advice, troubleshooting and hands-on help from an expert individual.',
    audience: 'Individuals and companies who need help with technical work.',
    cta: { label: 'Book an expert', href: contact },
    link: { label: 'Explore expert support', href: hrefOf('expert') },
    thumbs: ['exp-request', 'exp-session', 'exp-notes'],
  },
  {
    key: 'automation',
    name: 'AI automation',
    summary:
      'Put AI agents and automations into your workflows to reduce repetitive work.',
    audience:
      'Companies that want to spend less time sorting, copying and checking information.',
    cta: { label: 'Book a call', href: contact },
    link: { label: 'Explore AI automation', href: hrefOf('automation') },
    thumbs: ['ai-draft', 'ai-run', 'ai-inbox'],
  },
  {
    key: 'website',
    name: 'Website creation',
    summary:
      'Give people a clear way to understand your work and use your website or web app.',
    audience: 'Any client who needs a website or web app designed and built.',
    cta: { label: 'Book a call', href: contact },
    link: { label: 'Explore website creation', href: hrefOf('website') },
    thumbs: ['web-clear', 'web-bakery', 'web-booking'],
  },
  {
    key: 'solutions',
    name: 'Solutions for companies',
    summary:
      'Get software or a technical solution built around the problem you need to solve.',
    audience:
      'Companies whose work does not fit an existing tool or the other services.',
    cta: { label: 'Book a call', href: contact },
    link: {
      label: 'Explore solutions for companies',
      href: hrefOf('solutions'),
    },
    thumbs: ['sol-tool', 'sol-plan', 'sol-portal'],
  },
];
