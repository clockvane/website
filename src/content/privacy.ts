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
        'Your enquiry is passed through our Cloudflare-hosted form handler to HubSpot, which stores it as a contact in our CRM and notifies us. HubSpot acts as our processor and stores the data in its US data centre. [[PLACEHOLDER: recipient access and the international-transfer safeguard (SCCs/DPA); confirm before publishing]].',
        'If you book a call, you use a booking page run by HubSpot Meetings, which receives the details you enter there to schedule the call.',
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
        'This site uses Cloudflare Web Analytics, privacy-friendly analytics without cookies or local storage. We see totals such as page views, page load speed, referring sites, country, device type and browser, not who you are. Web addresses are recorded without their query part. If your browser sends a Global Privacy Control signal, analytics does not load. We set no cookies of our own.',
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
