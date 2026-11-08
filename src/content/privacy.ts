import { siteConfig } from '../../site.config';

type Part = string | { label: string; href: `/${string}` };

/** Approved copy-deck.md §9; unresolved facts remain placeholders. */
export const privacyCopy: {
  title: string;
  description: string;
  heading: string;
  updated: string;
  sections: readonly { heading: string; body: readonly Part[] }[];
} = {
  title: 'Privacy notice: enquiries and site visits',
  description:
    'Read what information this site collects through enquiries and visits, why it is used and how to contact us about your data.',
  heading: 'Privacy notice',
  updated: 'Last updated: [[PLACEHOLDER: publication date]].',
  sections: [
    {
      heading: 'Who we are',
      body: [
        `${siteConfig.brand}, India (Telangana). Contact us about this notice through our `,
        { label: 'contact form', href: '/contact/' },
        '. [[PLACEHOLDER: Q9 confirmed operator identity and address; no registration number until registered]].',
      ],
    },
    {
      heading: 'What we collect',
      body: [
        'When you enquire, we collect your name, reply contact, selected service and message. [[PLACEHOLDER: confirm technical logs and spam-prevention data against the implemented contact flow]].',
      ],
    },
    {
      heading: 'Why we use it',
      body: [
        'We use enquiry details to respond to your request. [[PLACEHOLDER: Q9 applicable legal basis and any further purposes, including enquiry reporting]].',
      ],
    },
    {
      heading: 'Who receives it',
      body: [
        '[[PLACEHOLDER: Q4 final notification channel and backup store, recipient access and any transfers; match actual delivery setup before publishing]].',
      ],
    },
    {
      heading: 'How long we keep it',
      body: [
        '[[PLACEHOLDER: Q9 enquiry and technical-log retention periods]].',
      ],
    },
    {
      heading: 'Analytics and cookies',
      body: [
        '[[PLACEHOLDER: verify the configured Cloudflare Web Analytics data collection and cookie wording against the deployed site]].',
      ],
    },
    {
      heading: 'Questions about your information',
      body: [
        'Contact us through the ',
        { label: 'form', href: '/contact/' },
        ' if you have a question about information you have shared. [[PLACEHOLDER: Q9 applicable access, correction and deletion rights and request process]].',
      ],
    },
  ],
};
