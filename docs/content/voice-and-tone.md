# Voice and tone v3

Status: draft for review · Owner: content-writer · Ticket: #124
Sources: [PRD v3](../product/PRD.md), [owner change request 3](../product/BRIEF.md), [copy deck](copy-deck.md).

## 1. Who we sound like
A capable specialist explaining the work clearly to someone who needs help. Professional, confident and approachable. We say what we can help with, how to start and what needs to be agreed.

Positioning: expert support, AI automation, website creation and solutions for companies, in one place. Expert individuals help individuals and companies. The voice must welcome either without assuming technical knowledge.

## 2. Voice pillars
| Pillar | Write this way |
|--------|----------------|
| Professional | Respect the reader's problem. Avoid jokes about their skills or tools. |
| Confident | Name the work and a useful next step. Avoid superlatives and unsupported certainty. |
| Plain | Short sentences, familiar words, one idea at a time. Explain technical terms when needed. |
| Specific | Name the task: sorting requests, copying document details, preparing a reply or updating a page. |
| Honest | Separate confirmed services, illustrative examples and facts still awaiting owner input. |

## 3. Tone by context
| Context | Tone and purpose |
|---------|------------------|
| Home and services | Direct and useful: problem, outcome, approach, evidence, next step. An early CTA is fine. |
| Expert support | Welcoming and practical. A person can ask for help without a company or a prepared brief. |
| Process and pricing | Matter-of-fact. State the pricing approach; agree scope before quoting timing or cost. |
| About and proof | Factual and personal. Use owner-supplied names and approved public work. |
| Forms and success | Brief and helpful. Say what to provide and when to expect a reply. |
| Errors and 404 | Calm and blame-free. Explain what happened and how to continue. |
| Privacy | Precise, plain language tied to the actual data flow. Unconfirmed details stay editorial. |

## 4. Reading level and style
- Aim for a reading age of 12–14. Use familiar verbs and explain necessary technical terms.
- Aim for sentences under 18 words; keep them below 30 where practical. Paragraphs contain one to three sentences.
- Lead with the customer's need and outcome. Use “you” and “we”, active voice and sentence case.
- Keep British spelling consistent: enquiry, organisation, labelled. This is an editorial default, not a pending owner decision.
- Use digits for actual quantities, an en dash for ranges and words for dates. A range still needs a factual source or explicit hypothetical context.
- Headings name the content. Links say where they go. Avoid decorative emoji, shouting capitals and exclamation marks.
- Never describe clients by size, headcount, funding or stage. Describe the work they need help with.

## 5. Words we use and avoid
| Prefer | Avoid |
|--------|-------|
| help, advice, troubleshoot, build, connect | empower, unlock, supercharge, leverage |
| repeated task, workflow, request, page | pain points, ecosystem, digital transformation |
| individuals and companies | audience labels based on company size or stage |
| agreed scope, fixed price, monthly option | competitive pricing, flexible commercial models |
| expert individuals, with confirmed areas of support | anonymous credentials, rankings or experience claims |
| what the AI reads, drafts or checks | AI hype without a task or review point |

Avoid: synergy, cutting-edge, world-class, revolutionary, game-changing, best-in-class, next-generation, state-of-the-art, holistic, turnkey, seamless, end-to-end, trusted partner, leading provider and “we are passionate about”.

“Tailored software and technical solutions” is the confirmed offer; follow it with a concrete problem or scope discussion. “Free” needs Q23 confirmation. “Secure”, “guaranteed” and quantified performance need evidence and an approved scope; they are not filler adjectives.

## 6. Name-independent identity
- In copy, the brand is only `{brand}`, mapped to `site.config.ts`. Email, domain, booking and social links also come from config; use tokens, never literal company contact values.
- No name story, pun or name-based metaphor anywhere, including About, alt text, demo labels and metadata. Copy must still work after a one-line config rename.
- The chosen tagline is **Built by experts. Powered by AI.** Use it exactly. It does not mean that every task is autonomous or every service is an AI product.
- There is no alternate tagline to choose. The four-service positioning replaces the former automation-only pitch.

## 7. Calls to action
- Header and general content: **Book a call**.
- Expert support page and its service card: **Book an expert**. The header keeps **Book a call**.
- Contact form: **Send message**. Both booking labels start the configured contact path; they do not promise payment, an appointment or immediate availability.
- Until the booking URL exists, link to `/contact/`. Pass service context where possible and allow manual selection without JavaScript.
- Do not call the first conversation free, an audit or a fixed-length session. Those details are not confirmed for the new services.
- Repeat one relevant CTA at the end of content pages. Contact, result pages, Privacy and 404 use their own actions, without a closing sales band.

## 8. Microcopy conventions
- Labels remain visible; placeholders never replace them. Mark optional fields “(optional)”. The company field must be optional for individuals.
- Ask for the problem in plain words: “What would you like help with?” Let the service choice include “Not sure”.
- Use “Sending…” during submission. Show confirmation only after successful delivery.
- Errors state the problem and the next step: “Enter an email address like name@example.com.” Avoid blame, codes and stack traces.
- Say “Your text is still here” only when it is preserved on the enhanced form. The separate no-JS error page says it has not kept the text.
- Success: “Thanks. We have your message and will reply within 1 business day.” This response time is owner-approved Q4, not a resolution deadline.
- Hide unavailable email, booking and social links completely. Never ask a visitor to resolve a configuration issue.
- Detailed validation mechanics remain in `microcopy.md`; the v3 deck supplies the new positioning, contact labels and page states for implementation.

## 9. SEO and accessible content
- Each page has a unique `seo_title` of at most 60 characters and `meta_description` of at most 155. The deck uses descriptive titles without a brand suffix, so a rename does not break the limit.
- Use one H1 per page and logical H2/H3 sections. Include utility-page metadata even when the page is `noindex`.
- Use service names naturally. Do not add keyword lists or claims about being the best.
- Alt text describes the actual content or purpose, preferably under 125 characters. Decorative images and repeated marquee copies use empty alt.
- Inline visual tokens never replace headline words. Example captions remain visible; a screen reader must get the same explanation without motion.

## 10. Proof, examples and unknown facts
- Approved facts come from the owner and PRD. Never invent testimonials, clients, logos, people, credentials, years, prices, results or statistics.
- Use this website and its documented process as proof. Publish repository and article links only when approved and configured. Real stories require Q22 content and permission; otherwise render no stories section.
- Label original screen mockups as examples. The AI demo stays **DRAFT · Scripted example**, with fictional input, a draft result and no message sent. Never imply a live integration or measured outcome.
- Describe time saved through the task removed: “could remove the retyping”. Do not turn illustrative ranges into “typical” savings or recycle old package durations.
- Confirmed founder names may appear; roles need Q6. Expert areas need Q18. Support format needs Q19. Prices need Q20; solution scope needs Q21. Tools and logo use need Q24.
- Unknowns become `[[PLACEHOLDER: question and needed fact]]` in drafts, listed in the PR description for the PRD open questions. Resolve or remove them before launch.

## 11. Examples
| Avoid | Use |
|-------|-----|
| Our world-class experts unlock your potential. | Get advice, troubleshooting and hands-on help from an expert individual. |
| AI handles everything for you. | The AI drafts a reply. A person reviews it before sending. |
| Guaranteed savings from day one. | Automating the copying step could remove the retyping. We discuss the checks it still needs. |
| Book your instant expert session. | Tell us what you need help with. We discuss the request and arrange support with you. |
| Trusted by hundreds of clients. | Show only approved real proof; omit the claim when none exists. |
| Submit your requirements. | Tell us what you want to do and where you are stuck. |
| Error 422: Invalid input. | Enter an email address like name@example.com. |

## 12. Self-check before a copy PR
1. Does each page explain the customer's problem, intended outcome, approach and next step?
2. Are all four services present, with expert individuals explicitly helping individuals and companies?
3. Is there one H1 per page, logical heading order and unique metadata within 60/155 characters?
4. Are brand/contact values tokens and all copy independent of the name?
5. Are clients described by their needs, never by size or stage?
6. Is every factual claim supported, every example labelled and every unknown listed in the PR?
7. Are CTA labels correct for the context, without old offers or unconfirmed promises?
8. Does every meaningful image have an alternative, and does each demo make sense without motion?
9. Read aloud: would these words help someone understand what to do next?

## 13. Open questions
The deck's §13 maps all remaining questions to PRD §12 and identifies carried-forward privacy and handover details. No new tagline, service-list or spelling decision is needed.
