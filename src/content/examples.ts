/**
 * Original example screens (copy deck §3.5). Sources are PNGs in src/assets/examples/, optimised at
 * build time (NFR §1.1). Every label stays visible as HTML; none shows a real client. A source no page
 * renders would ship as a PNG, which tests/unit/build/budgets.test.ts rejects: delete unused sources.
 */
import type { ImageMetadata } from 'astro';
import type { ServiceKey } from './services';

export interface ExampleMeta {
  service: ServiceKey;
  label: string;
  alt: string;
}

const meta = {
  'web-bakery': {
    service: 'website',
    label: 'Example website',
    alt: 'Example website page with a large offer headline, an order button and simple arch shapes on a red background.',
  },
  'web-shop': {
    service: 'website',
    label: 'Example website',
    alt: 'Example online shop page with four product tiles in soft colours.',
  },
  'web-booking': {
    service: 'website',
    label: 'Example website',
    alt: 'Example booking page with a month calendar, morning and afternoon choices and a confirm button.',
  },
  'web-clear': {
    service: 'website',
    label: 'Example website',
    alt: 'Example website page with an offer, a process section and a contact action.',
  },
  'ai-assistant': {
    service: 'automation',
    label: 'Example AI assistant',
    alt: 'Example AI assistant summarising a contract and flagging the renewal notice for a person to check.',
  },
  'ai-inbox': {
    service: 'automation',
    label: 'Example automation',
    alt: 'Example shared inbox where an assistant has sorted requests by type and marked what needs a person.',
  },
  'ai-run': {
    service: 'automation',
    label: 'Example automation',
    alt: 'Example automation run on a new invoice, with finished steps ticked and the approval step in progress.',
  },
  'ai-draft': {
    service: 'automation',
    label: 'DRAFT · Scripted example',
    alt: 'Example website request with a draft reply marked Needs review and Not sent.',
  },
  'ai-approve': {
    service: 'automation',
    label: 'Example automation',
    alt: 'Example approval step: an assistant has read a document and a person chooses to approve it or ask a question.',
  },
  'exp-request': {
    service: 'expert',
    label: 'Example support request',
    alt: 'Example support request with a problem description, attempted fixes and questions for an expert.',
  },
  'exp-session': {
    service: 'expert',
    label: 'Example support session',
    alt: 'Example support session with a terminal check and an expert explaining that a certificate had expired.',
  },
  'exp-notes': {
    service: 'expert',
    label: 'Example session notes',
    alt: 'Example session notes listing what was found, what was changed and the next step.',
  },
  'exp-start': {
    service: 'expert',
    label: 'Example support request',
    alt: 'Example form asking what the visitor needs help with, with a message box and a Book an expert button.',
  },
  'sol-tool': {
    service: 'solutions',
    label: 'Example internal tool',
    alt: 'Example internal tool showing request details alongside a Review needed status.',
  },
  'sol-plan': {
    service: 'solutions',
    label: 'Example project plan',
    alt: 'Example project plan with stages from understanding the work to handover, one marked in progress.',
  },
  'sol-portal': {
    service: 'solutions',
    label: 'Example client portal',
    alt: 'Example client portal with open requests, documents and project status in one place.',
  },
  'wide-studio': {
    service: 'website',
    label: 'Example website',
    alt: 'Example studio website with a large headline, a call to action and four colourful shapes.',
  },
  'wide-flows': {
    service: 'automation',
    label: 'Example automation',
    alt: 'Example automations list showing what starts each workflow and whether it is on or needs review.',
  },
  'wide-board': {
    service: 'solutions',
    label: 'Example team board',
    alt: 'Example team board with work grouped under To do, Doing and Done.',
  },
  'wide-orders': {
    service: 'solutions',
    label: 'Example internal tool',
    alt: 'Example internal orders tool with a side menu and a table of order statuses.',
  },
} as const satisfies Record<string, ExampleMeta>;

export type ExampleId = keyof typeof meta;

const files = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/examples/*.png',
  { eager: true },
);

/** Look up one screen's image and copy; a missing source file is a build error. */
export function example(id: ExampleId): ExampleMeta & { src: ImageMetadata } {
  const file = files[`../assets/examples/${id}.png`];
  if (!file) throw new Error(`Missing example screen source: ${id}`);
  return { ...meta[id], src: file.default };
}

export const exampleIds = Object.keys(meta) as ExampleId[];

/** Shared marquee copy (copy deck §3.5, docs/design/components.md). */
export const marqueeCopy = {
  note: 'All screens are examples we designed, not client work.',
  pause: 'Pause examples',
  resume: 'Resume examples',
};
