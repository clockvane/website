# Voice and tone

Status: draft for Gate 2 · Owner: content-writer · Ticket: #13
Inputs: `docs/product/PRD.md`, `personas.md`, `competitor-scan.md`, owner answers in `BRIEF.md` (Q12 tone).

Brand, domain and email appear in copy only as tokens: `{{brand.name}}`, `{{brand.domain}}`, `{{brand.email}}`. This guide writes the brand as **Clockvane** only to explain the rule.

## 1. Who we sound like
A calm, capable engineer explaining the job to a busy business owner over a call. We say what we will do, what it takes and what it costs. We do not perform.

Voice in one line: **"We automate the boring stuff."** Plain, confident, specific.

## 2. Voice pillars
| Pillar | What it means | What it is not |
|--------|---------------|----------------|
| **Plain** | Short sentences, everyday words, one idea each. Explain a technical term the first time, or skip it. | Dumbed down. The IT manager still gets exact scope. |
| **Confident** | State what we do and recommend a next step. | Boastful. No superlatives, no "the best". |
| **Specific** | Name the chore (re-keying orders, chasing invoice approvals, weekly reports) and the time it takes, as ranges or examples. | Vague category words ("solutions", "end-to-end"). |
| **Honest** | Say what we do not know yet, what is not included, what a thing costs. Placeholders are fine in drafts; invented facts never are. | Humble-bragging or fake modesty. |
| **Human** | "We" and "you". Real people are behind the firm. | Corporate third person ("the Company"). |

## 3. Tone by context
Voice stays the same. Tone shifts with the moment.

| Context | Tone | Note |
|---------|------|------|
| Home and service pages | Direct, warm, benefit-led | Problem first, then how, then proof, then CTA. |
| How we work, pricing | Candid, matter-of-fact | Say what drives cost. Use "from" prices only once the owner confirms the numbers. |
| About | Personal, modest | Only owner-supplied facts. No years in business or team size beyond what is confirmed. |
| Forms and success messages | Helpful, brief | Tell people what happens next and when (reply within 1 business day, per owner answer Q4). |
| Errors | Calm, blame-free, fixable | Say what went wrong and how to fix it. Never "Invalid input". |
| 404, empty states | Light, one gentle touch at most | Always give a way back. No jokes at the visitor's expense. |
| Legal and privacy | Plain English, precise | Short sentences. Say what is collected and why. |

## 4. Reading level and style rules
- Aim for a reading age of about 12–14 (Flesch-Kincaid grade 8 or lower). Technical service pages may reach grade 10 where a term needs it.
- Sentences: average under 18 words, never more than 30.
- Paragraphs: 1–3 sentences. Prefer a bullet list for three or more parallel items.
- Active voice. "We connect your shop to your accounting tool", not "Integration is provided".
- Lead with the customer: "You" appears more than "we" in the first paragraph of every section.
- Numbers as digits (3 days). Ranges with an en dash (1–2 weeks). Dates in words (23 October 2026).
- Sentence case for headings and buttons. No Title Case Everywhere, no ALL CAPS, no exclamation marks except in rare success moments (none planned).
- Spelling: use **British spelling** (organisation, automate) consistently until the owner says otherwise. [[PLACEHOLDER: owner to confirm British vs US spelling]]
- Use the serial comma only when a list is ambiguous without it.
- Avoid emoji and decorative symbols in copy.
- Link text says where it goes ("Read how we work"), never "click here".
- Alt text describes the content or purpose of the image in under 125 characters. Decorative images get empty alt.

## 5. Words we use and words we avoid
| Prefer | Instead of |
|--------|-----------|
| boring tasks, repetitive work, chores | pain points, inefficiencies |
| automate, set up, build, connect | leverage, utilise, deploy synergies |
| fixed price, "from" price (once confirmed) | competitive pricing, flexible commercial models |
| we | the Company, our team of experts |
| start, begin | embark on a journey |
| works, runs | seamless, frictionless |
| made for how you work | tailored, bespoke, end-to-end |
| small business, startup | SMB, enterprise-grade |
| tools you already use | tech stack ecosystem |

**Banned words and phrases** (owner Q12 plus competitor scan): synergy, cutting-edge, world-class, revolutionary, game-changing, best-in-class, next-generation, state-of-the-art, holistic, turnkey, seamless, robust, scalable (unless the exact limit is stated), end-to-end, tailored, empower, unlock, supercharge, "digital transformation", "we are passionate about", "trusted partner", "one-stop shop", "leading provider".

**Be careful with:** "AI" (say what the AI step does: "reads incoming invoices and fills in the spreadsheet"), "free" (only when it is truly free, such as the audit call), "guarantee" (never without a written policy), "secure" (say what we do: access rules, backups, handover).

## 6. Brand name and tagline
- The name is **Clockvane**: one word, capital C only. Never "Clockvane Labs", "Clockvane Tech", "ClockVane" or "CLOCKVANE". In copy, write the token `{{brand.name}}`.
- The name may still change (owner Q9). So no copy may rely on a pun that only works with the name, and the name story ("a clock keeps time by itself; a vane turns to point the business in the right direction") lives on About only.
- Tagline options (all draft; final choice is the owner's):
  1. Automation that runs like clockwork. (working tagline from the brief; recommended)
  2. We automate the boring stuff.
  3. Boring work, handled.
  4. Your repetitive work, running by itself.
- Use one tagline in the header/hero. Do not mix several across pages.

## 7. The call to action
- One primary CTA label is used site-wide: **Book a free audit call** (owner answer Q4).
- Secondary action on Contact: **Send a message** (short form). The form submit button reads **Send message**.
- Never use "Submit", "Click here", "Learn more" or "Get started" as stand-alone labels.
- Supporting line near the CTA: "Free, about 30 minutes, no obligation." Only use if the owner confirms the length. [[PLACEHOLDER: audit call length]]
- Repeat the CTA at the end of every page. Do not add competing CTAs (newsletter, download, chat).
- Say what happens next: "We reply within 1 business day."

## 8. Microcopy conventions (details live in `microcopy.md`)
### Buttons and links
- Start with a verb. 2–4 words. Sentence case. Say the result: "Send message", "Book a free audit call", "Back to home".
- Loading state keeps the verb: "Sending…". Disabled buttons need a visible reason nearby.

### Form labels and helper text
- Labels are always visible text above the field, never placeholder-only.
- Mark optional fields with "(optional)". Do not mark required fields with only a red asterisk.
- Helper text explains why we ask: "We use this only to reply to you."
- Ask for the minimum: name, a way to reply, a short description of the chore or project.

### Errors
Formula: **what happened + how to fix it**. Say it near the field and in the error summary.
- Good: "Enter an email address like name@example.com."
- Bad: "Invalid input."
- No blame ("You entered…"), no capital letters shouting, no technical codes or stack traces.
- Server failures: say the message was not sent, keep the visitor's text, offer another way to reach us.

### Success
Say it worked and what happens next: "Thanks, {name}. We have your message and will reply within 1 business day."

## 9. SEO titles and descriptions
Write for people first. Each page has a unique title and description.

| Field | Rule |
|-------|------|
| `seo_title` | ≤ 60 characters including brand. Pattern: `<Page or service benefit> | {{brand.name}}`. Put the main phrase first. |
| `meta_description` | ≤ 155 characters. One sentence on the outcome, one on the next step. Active voice. No quote marks, no keyword lists. |
| H1 | One per page. Says what the page is about in plain words; may differ from the title tag. |
| H2/H3 | Logical order, no skipped levels, each one describes the section beneath it. |
| Keywords | Use the words customers use ("automate invoicing", "small business website", "cloud setup") once naturally in title, H1 and first paragraph. No stuffing. |

Examples (illustrative patterns, not final copy; prices are not stated):
- Good title: `Automate repetitive work | {{brand.name}}`
- Good description: "We take over copy-paste chores, report building and approval chasing, so your team can do real work. Book a free audit call."
- Bad title: `Best World-Class Automation Solutions Company | Home`
- Bad description: "Cutting-edge end-to-end tailored solutions for all your digital transformation needs."

Titles in the sitemap must be unique, checked by CI.

## 10. Proof and honesty rules
Owner answers (Q5): no testimonials or client logos at launch. Honest proof that we may use: this website and its documented build process, public GitHub repositories, founders' Medium articles. Case studies come later.

- Never write fake testimonials, client names, logos, case studies, years in business, team size, awards or statistics.
- Time savings are examples or ranges framed as typical, never as a measured result of a named client. Example: "A weekly report that takes someone 2–3 hours by hand can often run by itself." Do not write "saves 80%".
- Do not describe certifications, or the founders' credentials, until the owner supplies the wording. [[PLACEHOLDER: founders' certifications and bios (owner Q6)]]
- Prices: use "from" prices only after the owner supplies the numbers. [[PLACEHOLDER: "from" prices for the four packages (owner Q2)]]
- Packages and timelines in the brief (Workflow Automation Audit 2–3 days, Business Website 1–2 weeks, Automation Build 1–3 weeks, Cloud & DevOps setup for larger clients) may be quoted as typical timelines.
- Lead offer: automation and cloud/DevOps are the headline; websites are the easy first sale. Do not present all services as equal.
- Anything unknown becomes `[[PLACEHOLDER: what is needed]]` and goes into the PR's open-questions list.

## 11. Do and don't examples
| Don't | Do |
|-------|----|
| We deliver cutting-edge, end-to-end solutions that empower your digital transformation. | We take over the copy-paste work your team does every day and make it run by itself. |
| Our world-class experts leverage AI to unlock efficiencies. | We add an AI step where it helps, for example reading an incoming invoice and filling in the spreadsheet. A person checks anything unclear. |
| Contact us to learn more! | Book a free audit call. We will look at one slow process and tell you what we would automate. |
| Pricing is tailored to your unique requirements. | Packages have a fixed price. Ongoing automation work can run on a monthly retainer. |
| Trusted by hundreds of businesses worldwide. | [[PLACEHOLDER: only real, supplied proof]] (otherwise say nothing). |
| Error 422: Invalid input in field "email". | Enter an email address like name@example.com. |
| Oops! Something went wrong! | Your message was not sent. Your text is still here. Try again, or use the other contact option on this page. |
| We are passionate about helping SMBs thrive. | Small teams lose hours to repeat work. We help you get them back. |

## 12. Checklist before a copy PR
1. Problem and outcome first, then how, then proof, then CTA.
2. One H1; H2/H3 in order; `seo_title` ≤ 60, `meta_description` ≤ 155.
3. No banned words (search the section 5 list).
4. Every number is a range or example, and is not presented as a measured result.
5. No invented facts; each gap is a `[[PLACEHOLDER: …]]` listed in the PR.
6. Brand, domain, email appear only as tokens.
7. The single primary CTA label is used exactly as written.
8. Read aloud: would you say this to a business owner on a call?

## 13. Open questions (for the PR description)
- British or US spelling?
- Audit call length for the supporting CTA line.
- "From" prices for the four packages (Q2).
- Founders' bios and certification wording (Q6).
- Final tagline choice.
