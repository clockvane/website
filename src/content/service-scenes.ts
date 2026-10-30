import type { ServiceVariant } from './services';

/** Approved copy deck §§0, 1 and 3.7; diagrams describe examples only. */
export const serviceScenes = {
  'process-automation': {
    category: 'Automation',
    audience: 'Small-business owners and operations managers',
    labels: ['Shop', 'Spreadsheet', 'Invoice tool'],
    caption:
      'One order moves from the shop to the invoice tool without retyping.',
    description:
      'An example. An order leaves the shop and appears in the invoice tool by itself, so nobody copies it by hand. It explains what connecting two tools does.',
  },
  'ai-automation': {
    category: 'AI',
    audience: 'Operations and IT managers, and owners with paperwork piling up',
    labels: ['Invoice', 'Fields', 'Human check'],
    caption:
      'An invoice becomes fields. Anything unclear goes to a person to check.',
    description:
      'An example. An invoice goes in. The AI step reads it. Clear details become fields in the sheet. Unclear ones are set aside for a person to check. It explains that a person stays in charge.',
  },
  'ai-cost-optimization': {
    category: 'AI spend',
    audience: 'Founders, CTOs and IT managers whose AI bill keeps growing',
    labels: ["Today's spend", 'Test route'],
    caption:
      'An example of comparing AI spend with a test route. It shows the method, not a saving.',
    description:
      "An example of method only. One tall bar shows today's spend and a shorter bar shows a test route. The bars have no numbers and are not a result. It explains that we compare spend before we recommend a change.",
  },
  'cloud-devops': {
    category: 'Cloud',
    audience: 'Founders, CTOs and IT managers',
    labels: ['Code', 'Tests', 'Human approval'],
    caption:
      'Code passes its tests, then waits for a person to approve the release.',
    description:
      'An example pipeline. Code is built, then tested, and the tests pass. A pause marked with two bars shows the release waiting for a person to approve it. It explains that a release has automatic checks and a human decision.',
  },
  'websites-and-apps': {
    category: 'Web',
    audience: 'Small-business owners and founders',
    labels: ['Content', 'Enquiry'],
    caption: 'A page is built up from content into a clear path to an enquiry.',
    description:
      'An example. Page sections appear one after another: a heading, text, a button and a contact box. It explains that every page leads a visitor to one clear enquiry.',
  },
  'custom-software': {
    category: 'Software',
    audience: 'Founders and operations managers',
    labels: ['Tool A', 'Adapter', 'Tool B'],
    caption:
      'A small custom connector joins two tools that did not fit together.',
    description:
      'An example. Tool A and Tool B sit apart. A small block labelled Adapter appears between them and joins them. It explains what a custom piece of software does.',
  },
} satisfies Record<
  ServiceVariant,
  {
    category: string;
    audience: string;
    labels: string[];
    caption: string;
    description: string;
  }
>;

export const sceneCopy = {
  replay: 'Replay example',
  audience: 'For: ',
  note: 'These diagrams show examples, not client results.',
};
