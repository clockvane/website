import { siteConfig } from '../../site.config';
import { allServices } from './navigation';

/** Verbatim copy deck v3 §5. Editorial notes in the deck are not page copy. */
export const aboutCopy = {
  title: 'About our founders and approach',
  description:
    'Meet the founders behind our expert support, AI automation, websites and technical solutions. Based in India, working with clients worldwide.',
  heading: 'People behind the technical work',
  lede: 'You need to know who you are working with. We are founder-led, based in India and working with individuals and companies worldwide.',
  who: {
    heading: 'Meet the founders',
    body: `${siteConfig.brand} was started by Mohammed Farhan, Adnan Sameer and Syed Zoheb Ali.`,
  },
  expertise: {
    heading: 'How we can help',
    body: 'Expert individuals provide advice and hands-on help. We also build AI automations, websites and technical solutions for companies.',
    link: { label: 'Explore our services', href: allServices.href },
  },
  proof: {
    heading: 'See how we work',
    body: 'This website is built through written requirements, reviews and tests. Its repository records the process.',
  },
};
