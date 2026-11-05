/** Copy deck `home.ai-demo`: a DRAFT, fictional script. Never live status, run times or results. */
export const aiDemo = {
  tag: 'DRAFT · Scripted example',
  heading: 'From a request to a draft you can check',
  intro:
    'See how an AI step could sort an incoming request and prepare a reply for review.',
  explanation:
    'This example uses fictional input. It does not run a live service or send a message.',
  inputLabel: 'Example incoming request',
  input:
    '“I need help updating the pages on my website. What information should I send?”',
  promptLabel: 'Prompt',
  prompt:
    '“Identify the service this request is about. Draft a reply asking for the details needed to discuss the work. Leave it for a person to review.”',
  steps: [
    'Read the example request',
    'Identify the service',
    'Draft a reply',
    'Wait for review',
  ],
  resultLabel: 'Draft reply · Needs review',
  result:
    '“Thanks for getting in touch about your website. Which pages would you like to update, and what should change? Please share your website address if you have one.”',
  resultFacts: [
    { label: 'Service', value: 'Website creation' },
    { label: 'Status', value: 'Not sent' },
  ],
  closing: 'You decide what goes out. The example stops at a draft for review.',
  textAlternative:
    'A fictional website request becomes a draft reply asking which pages need updates. The reply waits for review and is not sent.',
  finished: 'Example finished. The draft waits for review and is not sent.',
  controlName: 'AI reply example',
};

export type AiDemoCopy = typeof aiDemo;
