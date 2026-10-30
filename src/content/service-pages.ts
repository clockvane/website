import { siteConfig } from '../../site.config';
import type { ServiceVariant } from './services';

export const overviewWork: Partial<Record<ServiceVariant, readonly string[]>> =
  {
    'process-automation': [
      'Connect your shop, spreadsheet and accounting tool',
      'Automate approvals and reminders',
      'Build reports that send themselves',
    ],
    'ai-cost-optimization': [
      '[[PLACEHOLDER: Q13 owner confirms scope, for example reviewing model usage and spend, choosing cheaper models, caching, cloud cost review]]',
    ],
  };

/** Verbatim copy-deck.md §§2–3; unresolved scope stays visible until Gate 3. */
export const servicesIntro = {
  title: `Services: automation, AI, cloud, websites | ${siteConfig.brand}`,
  description:
    'Business process and AI automation, AI cost optimization, cloud and DevOps, websites and custom software. Book a free audit call.',
  heading: 'Services',
  lede: "We start with the work that wastes your team's time. Automation comes first, and cloud, websites and custom software support it. Pick the row that sounds like your problem, or book a call and we will help you choose.",
};

export const servicePageLabels = {
  home: 'Home',
  what: 'What we do',
  audience: 'Who it is for',
  deliverables: 'Typical deliverables',
  process: 'How an engagement runs',
  needs: 'What we need from you',
  related: 'Related services',
};

export const servicePages = {
  'process-automation': {
    seo: 'Business process automation',
    description:
      'Stop re-typing data and chasing approvals. We automate the repeat work between your tools. Start with a 2–3 day audit. Book a free audit call.',
    intro:
      'Every week someone on your team copies data from one tool to another, builds the same report or chases the same approval. That work is slow, dull and easy to get wrong. We make it run by itself.',
    summary:
      'Your team copies the same data between tools every day. We connect the tools so it moves on its own.',
    workflow:
      'A free audit call, then a 2–3 day audit of one process, then a fixed-price build, typically 1–3 weeks.',
    what: 'We look at how the work really happens, pick the chores that cost the most time, and connect your existing tools so the data moves on its own. We use the tools you already pay for where we can, and write small custom pieces only where we must. [[PLACEHOLDER: Q1 confirm tools and platforms the owner is happy to name]]',
    audience:
      'Small-business owners and operations managers who lose hours each week to copy-paste work.',
    deliverables: [
      'A Workflow Automation Audit (2–3 days): a ranked list of what to automate, with rough effort for each',
      'An Automation Build (1–3 weeks): the working automation, tested on your real cases',
      'Alerts when something fails, so nothing breaks silently',
      'A short guide so your team knows how it works',
      'Optional monthly retainer for ongoing changes',
      '[[PLACEHOLDER: Q1 confirm deliverables per package]]',
    ],
    process: [
      'Free audit call.',
      'Audit of one process, 2–3 days.',
      'Fixed-price build, typically 1–3 weeks.',
      'Handover and a check-in after launch. [[PLACEHOLDER: Q1/Q2 check-in period]]',
    ],
    needs: [
      'Someone who knows how the work is done today',
      'Access to the tools involved, shared safely',
      'A person to test the result with us',
      'A few real examples, such as sample orders or invoices',
    ],
    note: '',
    related: ['ai-automation', 'custom-software'],
  },
  'ai-automation': {
    seo: 'AI automation for small businesses',
    description:
      'We add an AI step where it helps, like reading invoices or sorting emails, with a person checking the unclear cases. Book a free audit call.',
    intro:
      'Some chores need reading or judging, not just copying: invoices, emails, forms, notes. AI can do the first pass. We build that step into your workflow and keep a person in charge.',
    summary:
      'Some chores need reading or judging, not just copying. We add an AI step and keep a person in charge.',
    workflow:
      'We test the idea on your real documents first, build it into the workflow, then run it alongside your people before handover.',
    what: 'We add an AI step only where it saves real time. For example, it reads an incoming invoice and fills in the spreadsheet. If it is unsure, it flags the item for a person. We keep a log of what it did, so you can check.',
    audience:
      'Operations and IT managers, and owners whose paperwork needs reading, not only copying.',
    deliverables: [
      'A working AI step inside your workflow',
      'Rules for what gets checked by a person',
      'A log of every decision',
      'A short note on what data leaves your systems and where it goes',
      'Handover guide. [[PLACEHOLDER: Q1 confirm AI tools and data-handling stance]]',
    ],
    process: [
      'Free audit call.',
      'Test the idea on 20–50 of your real documents (example size, to be agreed).',
      'Build it into the workflow.',
      'Run it alongside your people for a short period, then hand over.',
    ],
    needs: [
      'Real examples to test with',
      'A person to decide what counts as "unclear"',
      'Agreement on what data may be sent to an AI provider',
    ],
    note: 'We tell you where AI is a poor fit. If a simple rule does the job, we use the rule.',
    related: ['process-automation', 'ai-cost-optimization'],
  },
  'ai-cost-optimization': {
    seo: 'AI cost optimization',
    description:
      'Find out where your AI spend goes and test less costly ways to get the same work done. No savings promised up front. Book a free audit call.',
    intro:
      'AI features are easy to switch on and hard to keep track of. If your AI bill keeps growing and nobody can say why, we help you see where the money goes and what could change.',
    summary:
      'AI bills grow and nobody can say why. We find where the spend goes and test less costly ways to do the same work.',
    workflow:
      'We look at how your AI is used today, find where the spend goes, test options on your own cases and report what we found. We make no savings promise before we have looked.',
    what: 'We look at how your AI is used today and where the spend sits. Then we test other ways to do the same work on your own cases, and show you what we found, including the cases where nothing better exists. We do not promise a saving before we have looked. [[PLACEHOLDER: Q13 owner confirms the method and what is in and out of scope, for example model choice, caching, prompt length, cloud cost review]]',
    audience:
      'Founders, CTOs and IT managers whose AI bill keeps growing and who want to understand it.',
    deliverables: [
      'A plain-language picture of where AI spend goes',
      'Options we tested on your own cases, with what each one changes',
      'A short written report with our recommendation',
      'Handover of anything we set up. [[PLACEHOLDER: Q13 confirm deliverables]]',
    ],
    process: [
      'Free audit call.',
      'Look at how and where you use AI.',
      'Test options on your real cases, next to what you do today.',
      'Report and recommendation. [[PLACEHOLDER: Q13 timeline and price model]]',
    ],
    needs: [
      'Read-only access to usage and billing information, granted safely',
      'Examples of the work the AI does for you',
      'A person who can say what quality is good enough',
      'Agreement on what data we may see',
    ],
    note: 'Cheaper only counts if the work stays as good. We check that first.',
    related: ['ai-automation', 'cloud-devops'],
  },
  'cloud-devops': {
    seo: 'Cloud and DevOps setup',
    description:
      'Automated releases, a tidy cloud setup and clear handover for growing teams. Fewer manual steps, fewer surprises. Book a free audit call.',
    intro:
      'If releasing your software means a long checklist and crossed fingers, or the cloud bill surprises you each month, your setup needs work. We build pipelines and cloud setups that are simple to run and well documented.',
    summary:
      'Releases are manual, risky or slow, and the cloud bill is a mystery. We build a pipeline and a setup that are simple to run.',
    workflow:
      'We review what you have, agree a plan and a price, build and test, then hand over with a runbook.',
    what: "We automate how your code is built, tested and released. We set up your cloud accounts with sensible access rules, backups and cost limits, and hand over everything so you are not locked to us. [[PLACEHOLDER: Q6 confirm the founders' cloud and DevOps experience, plus any certifications or platforms to name]]",
    audience:
      'Founders, CTOs and IT managers whose releases are manual, risky or slow.',
    deliverables: [
      'Automated build, test and release pipeline',
      'Cloud account setup with access rules and backups',
      'Monitoring and alerts for the basics',
      'Cost review with options',
      'Runbook and handover session. [[PLACEHOLDER: Q1 confirm; owner says this is for larger clients]]',
    ],
    process: [
      'Free audit call.',
      'Review of what you have today.',
      'Agreed plan and fixed price.',
      'Build and test.',
      'Handover, with an option of a monthly retainer.',
    ],
    needs: [
      'Admin access to your cloud and code accounts, granted safely',
      'A person who can approve changes',
      'Notes on anything that must not go down, and when',
    ],
    note: '',
    related: ['custom-software', 'ai-cost-optimization'],
  },
  'websites-and-apps': {
    seo: 'Business websites and apps',
    description:
      'A fast, clear business website in 1–2 weeks, built to be found and to bring enquiries. See what is included. Book a free audit call.',
    intro:
      'Your website is often the first thing a customer sees. If it is slow, confusing or out of date, they leave. We build a clear business website in 1–2 weeks, and web apps when you need more.',
    summary:
      'Your website is slow, dated or does not bring enquiries. We build a clear one in 1–2 weeks, and web apps when you need more.',
    workflow:
      'We plan the pages with you, build, review with you, then launch and hand over.',
    what: 'We plan the pages, write or tidy the copy with you, build a fast site that works on a phone, and set it up so search engines can read it. We also connect the contact form to the tools you use, so enquiries do not get lost.',
    audience:
      'Small-business owners and founders whose site is slow, dated or quiet.',
    deliverables: [
      'A multi-page business website',
      'Mobile-friendly and accessible pages',
      'Search basics (titles, descriptions, sitemap)',
      'A contact form wired to your inbox or chat',
      'Simple analytics that need no cookie banner',
      'Handover so you can edit content. [[PLACEHOLDER: Q1 confirm package contents; Q2 "from" price]]',
    ],
    process: [
      'Free audit call.',
      'Plan the pages and content.',
      'Build and review with you.',
      'Launch and hand over.',
    ],
    needs: [
      'Your logo and any text or photos you already have',
      'Someone to approve the pages',
      'Access to your domain settings, if you have a domain',
    ],
    note: 'Typical total: 1–2 weeks.',
    related: ['process-automation', 'custom-software'],
  },
  'custom-software': {
    seo: 'Custom software development',
    description:
      'When no off-the-shelf tool fits, we build the missing piece: internal tools, integrations and back-office apps. Book a free audit call.',
    intro:
      'Sometimes the tool you need does not exist, or the ones you have do not talk to each other. We build the missing piece, small and focused, so it fits how you work.',
    summary:
      'No off-the-shelf tool fits how you work. We check for an existing tool first, then build the missing piece.',
    workflow:
      'A short written scope with a price, then small build steps with demos, then handover. [[PLACEHOLDER: Q1 timelines and code-ownership terms]]',
    what: 'We start by checking whether an existing tool can do the job, because that is cheaper. If not, we build a small, well-tested application or integration and document it so someone else could maintain it.',
    audience:
      'Founders and operations managers for whom no existing tool fits.',
    deliverables: [
      'Working software, tested',
      'Source code [[PLACEHOLDER: Q1 confirm code-ownership terms]]',
      'Documentation',
      'Deployment set up and handed over',
      'Optional support retainer',
    ],
    process: [
      'Free audit call.',
      'Short written scope with a fixed price.',
      'Build in small steps with demos.',
      'Handover. [[PLACEHOLDER: Q1 timelines; the brief gives none for custom software]]',
    ],
    needs: [
      'A clear owner for decisions',
      'Examples of how the work is done today',
      'Access to systems the software must connect to',
    ],
    note: '',
    related: ['process-automation', 'cloud-devops'],
  },
};
