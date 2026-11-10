/**
 * The four services: copy deck v3 `services.shared`, §2 and §3, verbatim. The overview and the one
 * service page template (src/pages/services/) read only this module. Editorial placeholders in the
 * deck (Q18, Q19, Q20, Q21) are deliberately not rendered: the deck says to omit them until confirmed.
 */
import { siteConfig } from '../../site.config';
import { bookingDestination, type CtaLink } from '../lib/config/booking';
import type { ExampleId } from './examples';

// Spelled out, not inferred from the data below, because examples.ts types its entries with these.
export type ServiceKey = 'expert' | 'automation' | 'website' | 'solutions';
export type ServiceSlug =
  'expert-support' | 'ai-automation' | 'website-creation' | 'solutions';

interface ServiceEntry {
  key: ServiceKey;
  slug: ServiceSlug;
  label: string;
  linkLabel: string;
  summary: string;
  audience: string;
  ctaLabel: string;
  /** `services.<slug>.summary` on the overview. */
  overview: { what: string; how: string };
  /** The tabs show all three; the overview shows the first two. */
  thumbs: [ExampleId, ExampleId, ExampleId];
  seo: { title: string; description: string };
  intro: { heading: string; lede: string };
  what: { heading: string; body: string; bullets: string[] };
  process: { heading: string; steps: string[] };
  audienceBlock: { heading: string; body: string; note?: string };
  example: {
    heading: string;
    caption: string;
    screens: ExampleId[];
    /** Shows the scripted AI demo under this section's heading. */
    demo?: boolean;
    proof?: string;
  };
  closing: { heading: string; body: string };
}

const WHAT_YOU_GET = 'What you get';
const HOW_IT_WORKS = 'How it works';
const WHO_IT_IS_FOR = 'Who it is for';
const BOOK_A_CALL = siteConfig.primaryCta.label;

const entries: ServiceEntry[] = [
  {
    key: 'expert',
    slug: 'expert-support',
    label: 'Expert support',
    linkLabel: 'Explore expert support',
    summary:
      'Get advice, troubleshooting and hands-on help from an expert individual.',
    audience: 'Individuals and companies who need help with technical work.',
    ctaLabel: 'Book an expert',
    overview: {
      what: 'Advice, troubleshooting, hands-on help and guidance from an expert individual.',
      how: 'Tell us what you need help with. We discuss the request and arrange the support with you.',
    },
    thumbs: ['exp-request', 'exp-session', 'exp-notes'],
    seo: {
      title: 'Expert support for individuals and companies',
      description:
        'Get advice, troubleshooting and hands-on help from an expert individual. Tell us about your technical problem and book an expert.',
    },
    intro: {
      heading: 'Get expert help with your technical work',
      lede: 'You do not have to work through a technical problem alone. Our expert individuals help individuals and companies with advice, troubleshooting and hands-on guidance.',
    },
    what: {
      heading: WHAT_YOU_GET,
      body: 'Help focused on the issue you bring, whether you need to understand your options, investigate a fault or work through a task.',
      bullets: [
        'Advice on a technical decision',
        'Help investigating what is going wrong',
        'Hands-on help and guidance on technical work',
      ],
    },
    process: {
      heading: 'How to arrange support',
      steps: [
        'Tell us what you are trying to do and where you are stuck.',
        'We discuss your request and whether we can help.',
        'We arrange the support and agree the details with you.',
      ],
    },
    audienceBlock: {
      heading: WHO_IT_IS_FOR,
      body: 'Individuals who need help with technical work, and companies that need advice or hands-on support from an expert individual.',
    },
    example: {
      heading: 'An example of preparing for support',
      caption:
        'Prepare the problem and questions you want to discuss with an expert.',
      screens: ['exp-request', 'exp-start', 'exp-session', 'exp-notes'],
    },
    closing: {
      heading: 'Tell us where you are stuck',
      body: 'Describe the problem and what you have tried. We will discuss how an expert can help.',
    },
  },
  {
    key: 'automation',
    slug: 'ai-automation',
    label: 'AI automation',
    linkLabel: 'Explore AI automation',
    summary:
      'Put AI agents and automations into your workflows to reduce repetitive work.',
    audience:
      'Companies that want to spend less time sorting, copying and checking information.',
    ctaLabel: BOOK_A_CALL,
    overview: {
      what: "AI agents and automations designed and built into your company's workflows.",
      how: 'Choose a repeated task, agree what needs human review, then build and test the workflow.',
    },
    thumbs: ['ai-draft', 'ai-run', 'ai-inbox'],
    seo: {
      title: 'AI automation for company workflows',
      description:
        'Reduce repetitive work with AI agents and automations built into your workflows. Explore the approach and book a call.',
    },
    intro: {
      heading: 'Spend less time moving information by hand',
      lede: "Sorting requests, copying details and drafting the same replies take attention away from other work. We build AI agents and automations into your company's workflows.",
    },
    what: {
      heading: WHAT_YOU_GET,
      body: 'An automation built around an agreed task, the tools involved and the points where a person needs to check the work.',
      bullets: [
        'A defined workflow and its inputs',
        'AI steps and connections to the agreed tools',
        'Review points for unclear or sensitive output',
        'Testing with agreed examples before use',
      ],
    },
    process: {
      heading: HOW_IT_WORKS,
      steps: [
        'Walk through the task as it happens today.',
        'Agree the inputs, access and review points.',
        'Build and test the workflow, including unclear inputs.',
        'Review the result with you and agree how it will be used.',
      ],
    },
    audienceBlock: {
      heading: WHO_IT_IS_FOR,
      body: 'Companies that repeat tasks such as sorting enquiries, extracting document details or preparing replies. We discuss where automation can help and where a person should stay involved.',
      note: 'If you copy request details into a sheet each day, automating that step could remove the retyping. The time saved depends on the workflow and the checks it still needs.',
    },
    example: {
      heading: 'See a request become a draft reply',
      caption: 'A request becomes a draft reply for a person to review.',
      screens: ['ai-draft', 'ai-assistant', 'ai-run', 'ai-inbox', 'ai-approve'],
      demo: true,
    },
    closing: {
      heading: 'Which task do you repeat?',
      body: 'Show us one workflow you want to improve. We will discuss what could be automated.',
    },
  },
  {
    key: 'website',
    slug: 'website-creation',
    label: 'Website creation',
    linkLabel: 'Explore website creation',
    summary:
      'Give people a clear way to understand your work and use your website or web app.',
    audience: 'Any client who needs a website or web app designed and built.',
    ctaLabel: BOOK_A_CALL,
    overview: {
      what: 'A website or web app designed around what your visitors need to do.',
      how: 'Agree the pages or features, review the design, then build, test and prepare for launch.',
    },
    thumbs: ['web-clear', 'web-bakery', 'web-booking'],
    seo: {
      title: 'Website and web app design and development',
      description:
        'Build a website or web app around what your visitors need to do. Explore design, development and the path to launch. Book a call.',
    },
    intro: {
      heading: 'Give your visitors a clear next step',
      lede: 'People need to understand what you offer and find what they came for. We design and build websites and web apps around that purpose.',
    },
    what: {
      heading: WHAT_YOU_GET,
      body: 'A website or web app with agreed pages, content and features, designed and built for the people who will use it.',
      bullets: [
        'Page and content planning',
        'Design for phones and larger screens',
        'Development and checks for accessibility and performance',
        'An agreed plan for launch and handover',
      ],
    },
    process: {
      heading: HOW_IT_WORKS,
      steps: [
        'Agree what visitors need to do and what the site must include.',
        'Review the page structure and design.',
        'Build and test the agreed pages or features.',
        'Review the site together and prepare for launch.',
      ],
    },
    audienceBlock: {
      heading: WHO_IT_IS_FOR,
      body: 'Any client who needs a website or web app, whether you have an existing site to improve or an idea to build.',
    },
    example: {
      heading: 'An example of a clear enquiry path',
      caption: 'A page that leads from an offer to an enquiry.',
      screens: ['web-clear', 'web-bakery', 'web-booking', 'web-shop'],
      proof: 'This website is one example of our work.',
    },
    closing: {
      heading: 'What should your website help people do?',
      body: 'Tell us about your visitors and the pages or features you need.',
    },
  },
  {
    key: 'solutions',
    slug: 'solutions',
    label: 'Solutions for companies',
    linkLabel: 'Explore solutions for companies',
    summary:
      'Get software or a technical solution built around the problem you need to solve.',
    audience:
      'Companies whose work does not fit an existing tool or the other services.',
    ctaLabel: BOOK_A_CALL,
    overview: {
      what: "Tailored software and technical solutions for your company's problem.",
      how: 'Describe the gap, agree what the solution must do, then build and review it in stages.',
    },
    thumbs: ['sol-tool', 'sol-plan', 'sol-portal'],
    seo: {
      title: 'Software and technical solutions for companies',
      description:
        'Discuss a company problem that needs tailored software or a technical solution. See how we define the work, build and review it.',
    },
    intro: {
      heading: 'Solve the gap in how your company works',
      lede: 'Sometimes the tools you have do not fit the work you need to do. We offer tailored software and technical solutions for that gap.',
    },
    what: {
      heading: WHAT_YOU_GET,
      body: "A solution scoped around your company's problem, the systems it needs to work with and the people who will use it.",
      bullets: [
        'A clear description of the problem and proposed work',
        'Agreed requirements and review steps',
        'Software or technical work built to that scope',
      ],
    },
    process: {
      heading: HOW_IT_WORKS,
      steps: [
        'Show us the problem and how the work happens today.',
        'Discuss options and agree the scope and price.',
        'Build and test in stages you can review.',
        'Agree the handover and any ongoing work.',
      ],
    },
    audienceBlock: {
      heading: WHO_IT_IS_FOR,
      body: 'Companies with a specific technical problem that does not fit an existing product or the other services. Share the problem even if you do not yet know what the solution should be.',
    },
    example: {
      heading: 'An example of work in one view',
      caption:
        'An example of bringing request details and review status into one view.',
      screens: ['sol-tool', 'sol-plan', 'sol-portal'],
    },
    closing: {
      heading: 'Tell us what your tools cannot do',
      body: 'Describe the gap and who it affects. We will discuss the options with you.',
    },
  },
];

export const services = entries.map((service) => ({
  ...service,
  href: `/services/${service.slug}/`,
  cta: {
    label: service.ctaLabel,
    ...bookingDestination(siteConfig),
  } satisfies CtaLink,
}));

export type Service = (typeof services)[number];

/** Copy deck §2. */
export const servicesOverview = {
  href: '/services/',
  title: 'Explore our four technical services',
  description:
    'Compare expert support, AI automation, website creation and solutions for companies. See what each offers and how to start.',
  heading: 'The right help for the work ahead',
  lede: "You may need an expert's advice, a workflow that handles repeat tasks or a website built from the ground up. Start with the service that fits your problem.",
  jumpLabel: 'Jump to a service',
  marqueeLabel: 'Scrolling row of example screens',
  labels: {
    what: WHAT_YOU_GET,
    how: HOW_IT_WORKS,
    who: WHO_IT_IS_FOR,
  },
};
