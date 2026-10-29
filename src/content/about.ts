import { siteConfig } from '../../site.config';

/** Approved copy-deck.md §5; owner-dependent facts remain explicit placeholders. */
export const aboutCopy = {
  title: `About us | ${siteConfig.brand}`,
  description: `Meet the founders behind ${siteConfig.brand}, an India-based team that automates boring work for small businesses worldwide.`,
  heading: `About ${siteConfig.brand}`,
  lede: 'We are a small, founder-led team in India. We automate boring work for small businesses and startups, wherever they are.',
  who: {
    heading: `Who is behind ${siteConfig.brand}`,
    body: `${siteConfig.brand} was started by three founders: Mohammed Farhan, Adnan Sameer and Syed Zoheb Ali. [[PLACEHOLDER: Q6 role line for each founder, for example "cloud and DevOps engineer" for Mohammed Farhan (from the brief), and bios]]`,
  },
  expertise: {
    heading: 'What we are good at',
    items: [
      'Cloud and DevOps',
      'Software development',
      'AI automation',
      'Websites and apps for businesses',
    ],
    caveat:
      "[[PLACEHOLDER: Q6 owner confirms each founder's areas; this list is the services list only]]",
    note: '[[PLACEHOLDER: Q6 any certifications or years of experience the owner wants stated]]',
  },
  proof: {
    heading: 'How you can check our work',
    body: 'We build this site in the open, with written requirements, reviews and tests. [[PLACEHOLDER: Q5 public GitHub and Medium URLs; shown only once the owner approves]] Case studies will come as we complete client work.',
  },
  name: {
    heading: 'The name',
    body: '[[PLACEHOLDER: owner confirms the name story. Draft: "A clock keeps time by itself. A vane turns with the wind and shows the way."]]',
  },
};
