import { siteConfig } from '../../site.config';

type Part = string | { label: string; href: `/${string}` | `mailto:${string}` };

/**
 * The one date shown as "Last updated". Change it whenever this notice changes
 * (set to the copy date, #198; the release PR moves it if the text changes again).
 */
export const PRIVACY_UPDATED = '11 November 2026';

const email: Part = {
  label: siteConfig.email,
  href: `mailto:${siteConfig.email}`,
};

/**
 * Copy deck §9. Recommended defaults from #198, pending owner approval at Gate 3
 * (docs/releases/v1.0.0.md, "Defaults the owner approves at Gate 3").
 */
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
  updated: `Last updated: ${PRIVACY_UPDATED}.`,
  sections: [
    {
      heading: 'Who we are',
      body: [
        `${siteConfig.brand} runs this website and is based in Telangana, India. For questions about this notice or your information, email us at `,
        email,
        ' or use our ',
        { label: 'contact form', href: '/contact/' },
        '.',
      ],
    },
    {
      heading: 'What we collect',
      body: [
        'When you enquire, we collect your name, how to reply to you (an email address or phone number), the service you choose and your message. ',
        'To block spam, the form has a hidden field that people leave empty and checks that it was not sent too quickly. We do not store the results of these checks. ',
        'Our form handler also limits how many messages can come from one IP address each minute. It uses your IP address only for that check, and logging is switched off for the handler, so we keep no record of your request. ',
        'Cloudflare, which hosts this site and runs the form handler, keeps its own technical logs of requests, such as IP addresses, to deliver pages and protect its network.',
      ],
    },
    {
      heading: 'Why we use it',
      body: [
        'We use the details you send only to answer your enquiry and to arrange the work you ask about. We do not use them for marketing or newsletters. We never sell them or share them for advertising.',
      ],
    },
    {
      heading: 'Who receives it',
      body: [
        'Your enquiry passes through our form handler, run by Cloudflare, to HubSpot, the customer relationship management (CRM) service we use. HubSpot stores it as a contact, notes that it came from our contact page and lets us know it has arrived. HubSpot keeps this data in its US data centre. ',
        'If you book a call, you use a booking page run by HubSpot Meetings, which receives the details you enter there to schedule the call. ',
        'HubSpot and Cloudflare process this data for us. Each publishes data processing terms for its customers, which use standard contractual clauses for transfers between countries.',
      ],
    },
    {
      heading: 'How long we keep it',
      body: [
        'We keep enquiries for up to 24 months after our last contact with you, then delete them. If you ask, we delete them sooner.',
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
        'To see, correct or delete the details you have sent us, email us at ',
        email,
        '. We reply within 30 days.',
      ],
    },
  ],
};
