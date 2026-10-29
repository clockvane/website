import { siteConfig } from '../../site.config';

/** Copy deck §9; unresolved analytics facts remain placeholders per #62. */
export const privacyCopy = {
  title: `Privacy notice | ${siteConfig.brand}`,
  description: `What ${siteConfig.brand} collects when you contact us or visit this site, why, who sees it and how to ask us to delete it.`,
  heading: 'Privacy notice',
  updated: 'Last updated: [[PLACEHOLDER: date of publication]]',
  status:
    'Structure and plain-English draft only, not legal advice. The owner must review it before launch. [[PLACEHOLDER: Q9 legal review]]',
  sections: [
    {
      heading: 'What we collect',
      body: 'If you send a message, we collect your name, how to reach you, your message and, if you give it, your company name. [[PLACEHOLDER: Q10 analytics visit counts, pages viewed, country and browser type]]',
    },
    {
      heading: 'Why we collect it',
      body: 'To reply to you and to understand which pages are useful. [[PLACEHOLDER: Q9 legal basis wording for the jurisdiction]]',
    },
    {
      heading: 'Who receives it',
      body: 'Your message is sent to us through [[PLACEHOLDER: Q4 notification channel and backup store, for example a messaging app and a spreadsheet; confirm names with the owner before publishing]]. [[PLACEHOLDER: Q10 analytics provider]]',
    },
    {
      heading: 'How long we keep it',
      body: '[[PLACEHOLDER: Q9 retention period for enquiries]]',
    },
    {
      heading: 'Your rights and how to use them',
      body: `You can ask what we hold about you and ask us to correct or delete it. Contact us at ${siteConfig.email}. [[PLACEHOLDER: Q9 rights wording for India (Telangana)]]`,
    },
    {
      heading: 'Cookies and analytics',
      body: '[[PLACEHOLDER: Q10 analytics tool and cookie information]]. If that changes, we will update this page first.',
    },
    {
      heading: 'Who we are',
      body: `${siteConfig.brand}, India (Telangana). Registration is in progress. [[PLACEHOLDER: Q9 registered name and address, once registered]]`,
    },
  ],
};
