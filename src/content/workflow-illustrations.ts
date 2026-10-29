// Text alternatives from copy-deck.md §§1, 3.1, 3.2 and 3.5; labels name their steps.
export const workflowIllustrations = {
  'before-after': {
    description:
      'Before: three people copy data between a shop, a spreadsheet and an invoice tool. After: the same data moves between them on its own.',
    panels: [
      { label: 'Before: manual copying between tools', manual: true },
      { label: 'After: automatic data movement', manual: false },
    ],
    tools: ['Shop', 'Spreadsheet', 'Invoice tool'],
  },
  branching: {
    description:
      'A document goes into an AI step. Clear results go straight to the spreadsheet. Unclear ones go to a person to check.',
    steps: ['Document', 'AI step'],
    outcomes: [
      { path: 'Clear', label: 'Spreadsheet' },
      { path: 'Unclear', label: 'Person to check' },
    ],
  },
  'connected-tools': {
    description:
      'Three separate tools connect through one small custom service that moves data between them.',
    steps: ['Custom service'],
    outcomes: [{ label: 'Tool 1' }, { label: 'Tool 2' }, { label: 'Tool 3' }],
  },
} as const;

export const processAutomationDescription =
  'Before and after. Before, a person copies data between three tools. After, the tools pass the data to each other.';
