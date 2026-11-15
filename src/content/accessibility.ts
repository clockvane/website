import { siteConfig } from '../../site.config';

/**
 * The date of the last accessibility check the statement describes. Change it whenever the
 * checks or the statement change (copy deck §14).
 */
export const ACCESSIBILITY_REVIEWED = '15 November 2026';

type Part = string | { label: string; href: `/${string}` | `mailto:${string}` };

/** Each paragraph is a list of parts, so a paragraph can hold links without splitting. */
export const accessibilityCopy: {
  title: string;
  description: string;
  heading: string;
  intro: string;
  reviewed: string;
  sections: readonly {
    heading: string;
    paragraphs: readonly (readonly Part[])[];
  }[];
} = {
  title: 'Accessibility statement: standard and how to report issues',
  description:
    'The standard this website is built to, how we check it, what is still limited and how to tell us about an access problem.',
  heading: 'Accessibility statement',
  intro:
    'We want everyone who uses this website to read it, move around it and contact us. This statement says which standard we build to, how we check our work and where it still falls short.',
  reviewed: `Last reviewed: ${ACCESSIBILITY_REVIEWED}.`,
  sections: [
    {
      heading: 'Our standard',
      paragraphs: [
        [
          `${siteConfig.brand} builds this website to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA. Level AA covers colour contrast, keyboard use, visible focus, text that scales, clear page structure and motion that a visitor can reduce.`,
        ],
      ],
    },
    {
      heading: 'How we check',
      paragraphs: [
        [
          'Every page is tested with an automated accessibility checker (axe) before a change is merged. We also check colour contrast, keyboard navigation and the layout at phone, tablet and desktop widths.',
        ],
        [
          'The site follows the reduced-motion and forced-colours settings in your browser. Where a short animation plays, the same words are available as plain text.',
        ],
      ],
    },
    {
      heading: 'What automated checks miss',
      paragraphs: [
        [
          'Automated checks find only part of the problems that people meet. We have not had this website independently audited, and we do not hold an accessibility certificate. We would rather tell you that than imply otherwise.',
        ],
      ],
    },
    {
      heading: 'Known limits',
      paragraphs: [
        [
          'The booking page is run by HubSpot Meetings, so its accessibility is set by HubSpot. Pages we link to outside this website are also outside our control.',
        ],
        [
          'We keep this statement up to date as the site changes. If a part of the site does not work for you, we want to know, even if it is not listed here.',
        ],
      ],
    },
    {
      heading: 'Report a problem',
      paragraphs: [
        [
          'Tell us which page you were on, what you were trying to do and what happened. Send it through our ',
          { label: 'contact form', href: '/contact/' },
          ', or email us at ',
          { label: siteConfig.email, href: `mailto:${siteConfig.email}` },
          '. We reply to accessibility reports within 1 business day.',
        ],
      ],
    },
  ],
};
