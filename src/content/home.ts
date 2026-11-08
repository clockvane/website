/** Copy deck §1, home page. Service names, summaries and tabs come from service-tabs.ts. */
import type { ExampleId } from './examples';
import type { ServiceKey } from './services';

export const hero = {
  // Later lines start with a space: below 64rem the set-line breaks are hidden and words must not join.
  lines: [
    ['Get expert ', { text: 'support,', service: 'expert' }],
    [
      ' ',
      { text: 'AI automation', service: 'automation' },
      ' and ',
      { text: 'websites', service: 'website' },
    ],
    [' built around your needs.'],
  ] as (string | { text: string; service: ServiceKey })[][],
  lede: 'Stuck on technical work or ready to build something? Expert individuals help individuals and companies, from advice to hands-on delivery.',
  secondary: { label: 'Explore our services', href: '/services/' },
};

export const problemSolution = {
  heading: 'Move past the work that holds you up',
  body: 'A technical issue can leave you unsure what to try next. Repeated data entry can take time away from other work. A confusing website can make it hard for people to find what they need.',
  solution:
    'Get help with the problem in front of you. We bring expert support, AI automation, website creation and technical solutions together, with a clear scope before work begins.',
  link: { label: 'See how we work', href: '/how-we-work/' },
};

export const onePlace = {
  heading: 'One place for the technical work you need',
  intro:
    'Ask for expert help, automate a repeated task, build a website or discuss a solution for your company.',
  tabsLabel: 'Services',
};

/**
 * Omitted until approved real content exists (copy deck `home.stories`, FR-5, PRD Q22).
 * Never seed this list with sample or placeholder stories.
 */
export const stories = {
  heading: 'Stories from the work',
  items: [] as { title: string; body: string }[],
};

/** Copy deck §3.5 and §11. Every example source is shown here, so none ships unoptimised. */
export const heroScreens = {
  label: 'Example screens in columns',
  tracks: [
    ['web-bakery', 'exp-session', 'ai-assistant'],
    ['ai-inbox', 'web-shop', 'exp-notes'],
    ['exp-request', 'ai-run', 'sol-plan'],
    ['web-booking', 'ai-draft', 'sol-portal'],
    ['sol-tool', 'exp-start', 'ai-approve'],
  ] as ExampleId[][],
};

export const wideScreens = {
  label: 'Example screens in a row',
  tracks: [
    ['wide-studio', 'wide-flows', 'wide-board', 'wide-orders'],
  ] as ExampleId[][],
};
