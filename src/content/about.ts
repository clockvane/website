import { siteConfig } from '../../site.config';
import { services } from './services';

/**
 * Copy-deck.md §5, with change request 3 DRAFT edits (no client-size wording,
 * no name story) until copy deck v3; owner-dependent facts stay placeholders.
 */
export const aboutCopy = {
  title: `About us | ${siteConfig.brand}`,
  description: `Meet the founders behind ${siteConfig.brand}, an India-based team of experts who help individuals and companies worldwide.`,
  heading: `About ${siteConfig.brand}`,
  lede: 'We are a founder-led team of experts in India. We help individuals and companies, wherever they are.',
  who: {
    heading: `Who is behind ${siteConfig.brand}`,
    body: `${siteConfig.brand} was started by three founders: Mohammed Farhan, Adnan Sameer and Syed Zoheb Ali. [[PLACEHOLDER: Q6 role line for each founder, for example "cloud and DevOps engineer" for Mohammed Farhan (from the brief), and bios]]`,
  },
  expertise: {
    heading: 'What we are good at',
    items: services.map(({ label }) => label),
    caveat:
      "[[PLACEHOLDER: Q6 owner confirms each founder's areas; this list is the services list only]]",
    note: '[[PLACEHOLDER: Q6 any certifications or years of experience the owner wants stated]]',
  },
  proof: {
    heading: 'How you can check our work',
    body: 'We build this site in the open, with written requirements, reviews and tests. [[PLACEHOLDER: Q5 public GitHub and Medium URLs; shown only once the owner approves]] Case studies will come as we complete client work.',
  },
};
