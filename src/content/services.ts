/** Shared names, order and summaries from copy-deck.md §§0 and 2. */
export const services = [
  {
    slug: 'process-automation',
    label: 'Business process automation',
    linkLabel: 'Read about business process automation',
    summary: 'We take over the copy-paste work your team repeats every week.',
    problem: 'Your team copies the same data between tools every day.',
    work: [
      'Connect your shop, spreadsheet and accounting tool',
      'Automate approvals and reminders',
      'Build reports that send themselves',
      'Start with a Workflow Automation Audit (2–3 days)',
    ],
  },
  {
    slug: 'ai-automation',
    label: 'AI automation',
    linkLabel: 'Read about AI automation',
    summary:
      'We add an AI step where it helps, with a person checking anything unclear.',
    problem: 'Some chores need reading or judging, not just copying.',
    work: [
      'Read incoming invoices and fill in the sheet',
      'Sort and draft replies to common emails',
      'Flag anything unclear for a person to check',
      'Keep a log of what the AI did',
    ],
  },
  {
    slug: 'cloud-devops',
    label: 'Cloud and DevOps',
    linkLabel: 'Read about cloud and DevOps',
    summary:
      'We set up your cloud and your release pipeline so launches stop being scary.',
    problem:
      'Releases are manual, risky or slow, and the cloud bill is a mystery.',
    work: [
      'Automated build, test and release pipelines',
      'Cloud setup with clear access rules and backups',
      'Cost review',
      'Documentation and handover',
    ],
  },
  {
    slug: 'websites-and-apps',
    label: 'Websites and apps',
    linkLabel: 'Read about websites and apps',
    summary:
      'A fast, clear business website in 1–2 weeks, built to be found and to get enquiries.',
    problem: 'Your website is slow, dated or does not bring enquiries.',
    work: [
      'A clear business website in 1–2 weeks',
      'Fast pages that work on a phone',
      'Basic search setup',
      'A simple way for customers to contact you',
    ],
  },
  {
    slug: 'custom-software',
    label: 'Custom software',
    linkLabel: 'Read about custom software',
    summary: 'When off-the-shelf tools do not fit, we build the missing piece.',
    problem: 'No off-the-shelf tool fits how you work.',
    work: [
      'Internal tools and dashboards',
      'Integrations between your systems',
      'APIs and back-office apps',
    ],
  },
].map((service) => ({
  ...service,
  href: `/services/${service.slug}/`,
}));
