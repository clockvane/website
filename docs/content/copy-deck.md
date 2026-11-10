# Copy deck v3

Status: draft for review · Owner: content-writer · Ticket: #124
Sources: [PRD v3](../product/PRD.md), [sitemap](../design/sitemap.md), [owner change request 3](../product/BRIEF.md), [voice and tone](voice-and-tone.md).

## How to use this deck
- This file holds all page decks requested by #124. Block keys are content slots; `h1`, `h2` and `h3` specify the rendered hierarchy, not this document's headings.
- Home follows PRD §5.1. The old wireframes describe a dropped direction; use these semantic slots when the new wireframes are prepared.
- `{brand}` reads the name from `site.config.ts`. `{email}`, `{booking_url}`, `{github_url}` and `{medium_url}` also read from config. Never publish unresolved tokens or links with no destination.
- Titles omit the brand suffix to stay within 60 characters after any rename. Descriptions are at most 155 characters. OG title/description use the same text; canonical origins come from config.
- Site-wide primary CTA: **Book a call**. Expert support's in-page CTA and service card: **Book an expert**. Both go to `/contact/` until a configured booking link is available (Q4). Carry the chosen service where possible; allow manual selection without JavaScript.
- `[[PLACEHOLDER: …]]` is editorial, never public copy. Resolve or remove it before launch. Conditional sections disappear entirely when their approved content is absent.
- Examples show possible work, not sold packages, client work or measured results. Prices, durations, expertise and contractual terms remain subject to §13.
- This deck supplies the new contact labels and page states. Existing `microcopy.md` validation mechanics still apply; align its older positioning and brand-token spelling when engineering wires in v3. No application code changes in #124.

## 0. Shared blocks
### `site.tagline`, navigation and footer
- Tagline: Built by experts. Powered by AI.
- Header: Services · How we work · About · Book a call. Services disclosure: All services, followed by the four names below.
- Footer line: Expert support, AI automation, websites and technical solutions, in one place.
- Footer groups: Services · Company. Company links: How we work · About · Contact. Legal link: Privacy notice.
- Location: India · working with clients worldwide.
- Copyright: © {year} {brand}. Logo link accessible name: {brand} home.
- Social labels: GitHub · Medium; use configured links only. Contact fallback: Email us at {email}; omit without a configured address.

### `closing-cta`
- h2: What would you like to get done?
- body: Tell us where you are stuck or what you want to build. We will help you work out the next step.
- cta: Book a call.
- Use once at the end of Home, Services, How we work and About. Service pages use their closing blocks below. Contact, Thanks, Error, Privacy and 404 omit this band.

### Service names and summaries (`services.shared`)
Use this order and wording on Home, the overview, navigation and footer. Each service name links to its detail page.

| Slug | Name | Summary | For | CTA |
|------|------|---------|-----|-----|
| `expert-support` | Expert support | Get advice, troubleshooting and hands-on help from an expert individual. | Individuals and companies who need help with technical work. | Book an expert |
| `ai-automation` | AI automation | Put AI agents and automations into your workflows to reduce repetitive work. | Companies that want to spend less time sorting, copying and checking information. | Book a call |
| `website-creation` | Website creation | Give people a clear way to understand your work and use your website or web app. | Any client who needs a website or web app designed and built. | Book a call |
| `solutions` | Solutions for companies | Get software or a technical solution built around the problem you need to solve. | Companies whose work does not fit an existing tool or the other services. | Book a call |

## 1. Home `/`
- `seo_title`: Expert support, AI automation and websites
- `meta_description`: Get expert help, AI automation, websites and technical solutions in one place. Tell us what you need and book a call.

### `home.hero`
- h1: Get expert support, AI automation and websites built around your needs.
- lede: Stuck on technical work or ready to build something? Expert individuals help individuals and companies, from advice to hands-on delivery.
- tagline: Built by experts. Powered by AI.
- primary: Book a call. Secondary: Explore our services → `/services/`.
- Inline token slots: after “expert support”, “AI automation” and “websites”. Tokens illustrate those topics; the sentence remains complete when they are hidden. No portraits or words supplied only by images.
- Example screen captions and alt text: §3.5. Each original screen in the hero columns keeps its visible example label.

### `home.tools` (conditional)
- label: Tools we work with
- content: [[PLACEHOLDER: Q24 confirmed tool names and permission to show logos]]. Default: omit the entire strip.
- Editorial: confirmed text names are sufficient. Do not imply certification, partnership, endorsement or a client relationship.

### `home.problem-solution`
- h2: Move past the work that holds you up
- body: A technical issue can leave you unsure what to try next. Repeated data entry can take time away from other work. A confusing website can make it hard for people to find what they need.
- solution: Get help with the problem in front of you. We bring expert support, AI automation, website creation and technical solutions together, with a clear scope before work begins.
- link: See how we work → `/how-we-work/`.

### `home.services`
- h2: One place for the technical work you need
- intro: Ask for expert help, automate a repeated task, build a website or discuss a solution for your company.
- Four h3s, summaries, audience lines, destinations and CTAs: `services.shared`. Detail link labels: Explore expert support · Explore AI automation · Explore website creation · Explore solutions for companies.
- Each service uses the matching original example screen in §3.5. These are service previews, never a client portfolio.

### `home.ai-demo` — DRAFT script
- h2: From a request to a draft you can check
- intro: See how an AI step could sort an incoming request and prepare a reply for review.
- Persistent label: DRAFT · Scripted example
- Persistent explanation: This example uses fictional input. It does not run a live service or send a message.
- Input label: Example incoming request
- Input: “I need help updating the pages on my website. What information should I send?”
- Prompt: “Identify the service this request is about. Draft a reply asking for the details needed to discuss the work. Leave it for a person to review.”
- Steps, in order: Read the example request → Identify the service → Draft a reply → Wait for review.
- Result label: Draft reply · Needs review
- Result: “Thanks for getting in touch about your website. Which pages would you like to update, and what should change? Please share your website address if you have one.”
- Result service: Website creation. Result status: Not sent.
- Closing line: You decide what goes out. The example stops at a draft for review.
- Controls: Play example · Pause example · Replay example. Accessible names include “AI reply example”. Keep the full script readable without playback; reduced motion shows the finished draft.
- Text alternative: A fictional website request becomes a draft reply asking which pages need updates. The reply waits for review and is not sent.
- No invented run times, savings, accuracy scores, client identities, live status or success counters.

### `home.stories` (conditional; draft placeholders only)
- h2: Stories from the work
- story h3: [[PLACEHOLDER: Q22 approved story title]]. Body: [[PLACEHOLDER: Q22 real problem, work done and evidenced result, with permission to publish]].
- Attribution and media: [[PLACEHOLDER: Q22 approved client attribution, quote and image rights, if supplied]].
- Omit this whole section until approved real content exists. No sample testimonial, empty card or “coming soon” message. No case-study route is added at launch.

### `home.closing`
Use `closing-cta`, followed by the rich footer in §0. Home section order is hero → tools (if confirmed) → problem and solution → four services → AI demo → stories (if supplied) → closing CTA → footer.

## 2. Services overview `/services/`
- `seo_title`: Explore our four technical services
- `meta_description`: Compare expert support, AI automation, website creation and solutions for companies. See what each offers and how to start.
- `services.intro` h1: The right help for the work ahead
- lede: You may need an expert's advice, a workflow that handles repeat tasks or a website built from the ground up. Start with the service that fits your problem.
- `services.one-place`: use four h2 service names, summaries, audience lines, links and CTAs from `services.shared`, with the matching example screens from §3.5.

| Service block | What you get | How it works |
|---------------|--------------|--------------|
| `services.expert-support.summary` | Advice, troubleshooting, hands-on help and guidance from an expert individual. | Tell us what you need help with. We discuss the request and arrange the support with you. |
| `services.ai-automation.summary` | AI agents and automations designed and built into your company's workflows. | Choose a repeated task, agree what needs human review, then build and test the workflow. |
| `services.website-creation.summary` | A website or web app designed around what your visitors need to do. | Agree the pages or features, review the design, then build, test and prepare for launch. |
| `services.solutions.summary` | Tailored software and technical solutions for your company's problem. | Describe the gap, agree what the solution must do, then build and review it in stages. |

- `services.help-choose` h2: Not sure which service fits?
- body: Tell us what you are trying to do. You do not need to choose a tool or write a technical brief first.
- cta: Book a call.

## 3. Service detail pages
Shared structure: Home → Services → current service breadcrumb; `intro` h1/lede; `what` h2; `process` h2; `for` h2; `example` h2; `closing` h2/CTA. All keys below take the prefix `services.<slug>`. What/process lists are body bullets or ordered steps under their h2. Each page uses the example label, caption and alt in §3.5. Confirm scope and price before treating examples as deliverables.

### 3.1 Expert support `/services/expert-support/`
- `seo_title`: Expert support for individuals and companies
- `meta_description`: Get advice, troubleshooting and hands-on help from an expert individual. Tell us about your technical problem and book an expert.
- `intro` h1: Get expert help with your technical work
- lede: You do not have to work through a technical problem alone. Our expert individuals help individuals and companies with advice, troubleshooting and hands-on guidance.
- `what` h2: What you get
- body: Help focused on the issue you bring, whether you need to understand your options, investigate a fault or work through a task.
- bullets: Advice on a technical decision · Help investigating what is going wrong · Hands-on help and guidance on technical work.
- Editorial: [[PLACEHOLDER: Q18 confirm support areas; candidate areas are software development, cloud, DevOps and AI automation]]. Omit the list of areas until confirmed; do not assign credentials to unnamed experts.
- `process` h2: How to arrange support
- steps: 1. Tell us what you are trying to do and where you are stuck. 2. We discuss your request and whether we can help. 3. We arrange the support and agree the details with you.
- Editorial: [[PLACEHOLDER: Q19 session format, duration, channel, expert identity and availability; Q20 support pricing model]]. Do not promise immediate access, a fixed session length or a guaranteed fix.
- `for` h2: Who it is for
- body: Individuals who need help with technical work, and companies that need advice or hands-on support from an expert individual.
- `example` h2: An example of preparing for support
- `closing` h2: Tell us where you are stuck
- body: Describe the problem and what you have tried. We will discuss how an expert can help.
- cta: Book an expert.

### 3.2 AI automation `/services/ai-automation/`
- `seo_title`: AI automation for company workflows
- `meta_description`: Reduce repetitive work with AI agents and automations built into your workflows. Explore the approach and book a call.
- `intro` h1: Spend less time moving information by hand
- lede: Sorting requests, copying details and drafting the same replies take attention away from other work. We build AI agents and automations into your company's workflows.
- `what` h2: What you get
- body: An automation built around an agreed task, the tools involved and the points where a person needs to check the work.
- bullets: A defined workflow and its inputs · AI steps and connections to the agreed tools · Review points for unclear or sensitive output · Testing with agreed examples before use.
- `process` h2: How it works
- steps: 1. Walk through the task as it happens today. 2. Agree the inputs, access and review points. 3. Build and test the workflow, including unclear inputs. 4. Review the result with you and agree how it will be used.
- `for` h2: Who it is for
- body: Companies that repeat tasks such as sorting enquiries, extracting document details or preparing replies. We discuss where automation can help and where a person should stay involved.
- Time-saving example: If you copy request details into a sheet each day, automating that step could remove the retyping. The time saved depends on the workflow and the checks it still needs.
- `example` h2: See a request become a draft reply
- body: Use the DRAFT script in `home.ai-demo`, including its fictional-input label and “Not sent” result. It illustrates a possible workflow, not an outcome promised to clients.
- `closing` h2: Which task do you repeat?
- body: Show us one workflow you want to improve. We will discuss what could be automated.
- cta: Book a call.

### 3.3 Website creation `/services/website-creation/`
- `seo_title`: Website and web app design and development
- `meta_description`: Build a website or web app around what your visitors need to do. Explore design, development and the path to launch. Book a call.
- `intro` h1: Give your visitors a clear next step
- lede: People need to understand what you offer and find what they came for. We design and build websites and web apps around that purpose.
- `what` h2: What you get
- body: A website or web app with agreed pages, content and features, designed and built for the people who will use it.
- bullets: Page and content planning · Design for phones and larger screens · Development and checks for accessibility and performance · An agreed plan for launch and handover.
- `process` h2: How it works
- steps: 1. Agree what visitors need to do and what the site must include. 2. Review the page structure and design. 3. Build and test the agreed pages or features. 4. Review the site together and prepare for launch.
- `for` h2: Who it is for
- body: Any client who needs a website or web app, whether you have an existing site to improve or an idea to build.
- `example` h2: An example of a clear enquiry path
- proof: This website is one example of our work. See `about.proof` for approved links to its process; no speed scores or conversion claims without evidence.
- `closing` h2: What should your website help people do?
- body: Tell us about your visitors and the pages or features you need.
- cta: Book a call.

### 3.4 Solutions for companies `/services/solutions/`
- `seo_title`: Software and technical solutions for companies
- `meta_description`: Discuss a company problem that needs tailored software or a technical solution. See how we define the work, build and review it.
- `intro` h1: Solve the gap in how your company works
- lede: Sometimes the tools you have do not fit the work you need to do. We offer tailored software and technical solutions for that gap.
- `what` h2: What you get
- body: A solution scoped around your company's problem, the systems it needs to work with and the people who will use it.
- bullets: A clear description of the problem and proposed work · Agreed requirements and review steps · Software or technical work built to that scope.
- Editorial: [[PLACEHOLDER: Q21 confirmed solution scope and exclusions; candidate examples include connecting software systems, cloud setup and DevOps work]]. Keep these as examples for discussion until confirmed, not separate services or package promises.
- `process` h2: How it works
- steps: 1. Show us the problem and how the work happens today. 2. Discuss options and agree the scope and price. 3. Build and test in stages you can review. 4. Agree the handover and any ongoing work.
- `for` h2: Who it is for
- body: Companies with a specific technical problem that does not fit an existing product or the other services. Share the problem even if you do not yet know what the solution should be.
- `example` h2: An example of work in one view
- `closing` h2: Tell us what your tools cannot do
- body: Describe the gap and who it affects. We will discuss the options with you.
- cta: Book a call.

### 3.5 Original example screens: shared captions and alt text
These are briefs for original artwork, not claims that screenshots already exist. Keep the visible label on every screen, including thumbnails and marquee copies. No real or invented client names, portraits, logos, ratings or metrics. Adapt alt text if the approved artwork changes; repeated decorative copies use empty alt, with the caption available once in reading order.

| Service | Visible label | Screen content | Caption | Alt text |
|---------|---------------|----------------|---------|----------|
| Expert support | Example support request | What I need help with · What I have tried · Questions to discuss. No calendar availability or named expert. | Prepare the problem and questions you want to discuss with an expert. | Example support request with a problem description, attempted fixes and questions for an expert. |
| AI automation | DRAFT · Scripted example | Use the input, draft reply and review status in `home.ai-demo`. | A request becomes a draft reply for a person to review. | Example website request with a draft reply marked Needs review and Not sent. |
| Website creation | Example website | What we do · How it works · Contact. Original page with a readable enquiry path and no client identity. | A page that leads from an offer to an enquiry. | Example website page with an offer, a process section and a contact action. |
| Solutions for companies | Example internal tool | Requests · Details · Review needed. A fictional request detail, no counts or performance claims. | An example of bringing request details and review status into one view. | Example internal tool showing request details alongside a Review needed status. |

Shared motion controls: Pause examples · Resume examples. All captions and useful content remain readable with motion stopped and without JavaScript.

## 4. How we work `/how-we-work/`
- `seo_title`: How we work: expert help and project delivery
- `meta_description`: See how we arrange expert support and take projects from a first conversation to handover, with scope and pricing agreed before work begins.
- `how.intro` h1: Know what happens next
- lede: You should understand the work, the price and the next step before you commit.
- `how.steps` h2: From first conversation to delivery
- h3s and body: **Talk about the need.** Tell us what you want to achieve and what is getting in the way. **Agree the work.** We set out the scope, price and review steps before work starts. **Build and review.** You see progress and check it against the agreed requirements. **Prepare the handover.** We agree what you need to use and maintain the result.
- `how.support` h2: If you need an expert
- body: Tell us about the technical work you need help with. We discuss the request and arrange support with you. Session details and pricing are agreed before it starts. [[PLACEHOLDER: Q19 session arrangements; Q20 support pricing]].
- `how.models` h2: Choose how to work together
- bullets: Fixed price for defined project work · A monthly option for ongoing work. [[PLACEHOLDER: Q20 confirmed scope of monthly support and pricing]].
- `how.pricing` h2: How pricing works
- body: Defined project work has a fixed price. Starting prices show where that work begins; your quote reflects the agreed scope. Ongoing work can use a monthly arrangement.
- Editorial: [[PLACEHOLDER: Q20 approved “from” amounts and inclusions for the four services, plus support-session pricing model]]. Until supplied, publish the stance above without price cards, amounts or old package timelines.
- `how.handover` h2: Agree the details before work begins
- body: Discuss the accounts, access, documentation and ongoing help the work will need. Ownership and handover terms belong in the agreed scope.
- Editorial: [[PLACEHOLDER: confirm ownership, licensing, access removal, handover and support commitments; carry into PRD open questions via this PR]]. No promise of full code ownership or indefinite support.
- `how.faq` h2: Common questions
- h3: Do I need a technical brief? Body: No. Start with what you want to do and what is getting in the way.
- h3: Can an individual ask for help? Body: Yes. Expert individuals help individuals and companies with technical work.
- h3: How long will the work take? Body: We discuss timing once the scope is clear. A support request and a project need different plans.
- h3: How much does it cost? Body: Project work is priced against an agreed scope. Ask us about the work you need and we will discuss pricing with you.
- h3: Who owns the result? Body: We agree ownership and licensing terms before work starts.
- h3: How soon will I hear back? Body: We reply to enquiries within 1 business day.
- Closing: `closing-cta`. FAQ stays here; `/faq/` remains a later page, with no separate launch deck or route.

## 5. About `/about/`
- `seo_title`: About our founders and approach
- `meta_description`: Meet the founders behind our expert support, AI automation, websites and technical solutions. Based in India, working with clients worldwide.
- `about.intro` h1: People behind the technical work
- lede: You need to know who you are working with. We are founder-led, based in India and working with individuals and companies worldwide.
- `about.who` h2: Meet the founders
- body: {brand} was started by Mohammed Farhan, Adnan Sameer and Syed Zoheb Ali.
- Editorial: [[PLACEHOLDER: Q6 approved role beside each founder name]]. Default: names only. No invented bios, portraits, team size or credentials.
- `about.expertise` h2: How we can help
- body: Expert individuals provide advice and hands-on help. We also build AI automations, websites and technical solutions for companies. Explore our services → `/services/`.
- Editorial: use Q18's confirmed expertise only; do not turn the service list into claims about a founder's credentials.
- `about.proof` h2: See how we work
- body: This website is built through written requirements, reviews and tests. Its repository records the process.
- links: Explore our public repositories → `{github_url}` · Read our articles → `{medium_url}`. [[PLACEHOLDER: Q8 approved public URLs]]. Hide absent links. Real stories follow Q22; do not promise their arrival.
- Closing: `closing-cta`. No name story.

## 6. Contact `/contact/`
- `seo_title`: Contact us about expert help or a project
- `meta_description`: Tell us about the technical help or project you need. Choose a service or ask for guidance. We reply within 1 business day.
- `contact.intro` h1: Tell us what you need
- lede: Describe the problem or the work you have in mind. We reply within 1 business day.
- Optional booking link: Book a call → `{booking_url}` (config `booking`, opens in a new tab; HubSpot Meetings, Q4 answered in #177). Hide while the config holds a placeholder; do not link back to this page as if a booking exists.
- `contact.form` h2: Send a message

| Field | Label | Helper / options |
|-------|-------|------------------|
| Name | Your name | Tell us how to address you. |
| Reply contact | Email or phone | Where should we reply? |
| Service | What do you need help with? | Expert support · AI automation · Website creation · Solutions for companies · Not sure. Helper: Choose Not sure if you would like help deciding. |
| Message | What would you like help with? | A sentence or two is enough. Tell us what you want to do and where you are stuck. |
| Company | Company (optional) | Leave this blank if you are enquiring as an individual. |

- Submit: Send message. Loading: Sending… . Empty-message validation: Tell us a little about the help or work you need. Invalid-service validation: Choose a service or select Not sure.
- Other validation and JS failures: `microcopy.md` §1; retain entered text on the enhanced form. Never claim text is kept on the no-JS error page.
- `contact.next-steps` h2: What happens next
- steps: 1. We read your message. 2. We reply within 1 business day using the contact details you supplied. 3. We discuss the request and arrange the next step with you.
- `contact.privacy-note`: We use your details to respond to your enquiry. Read our privacy notice. Link “privacy notice” → `/privacy/`.
- `contact.fallback`: You can also email us at {email}. Omit without a configured address.
- “Book an expert” starts this enquiry path, not payment or a confirmed appointment. Do not describe the first call as free (Q23).

## 7. Enquiry sent `/contact/thanks/`
- `seo_title`: Enquiry sent: what happens next
- `meta_description`: Your message has been sent. We will reply within 1 business day to discuss your request and the next step.
- `contact.thanks` h1: Message sent
- body: Thanks. We have your message and will reply within 1 business day.
- h2: What happens next
- body: We will review what you need and reply using the contact details you supplied. Then we can arrange the next step together.
- Links: Read how we work → `/how-we-work/` · Back to home → `/`. Use the same confirmation inline after successful delivery. `noindex`; exclude from sitemap.xml.

## 8. Enquiry failed `/contact/error/`
- `seo_title`: Message not sent: try the contact form again
- `meta_description`: Your message was not sent, and this page has not kept your text. Return to the contact form to try again.
- `contact.error` h1: We could not send your message
- body: Your message was not sent, and this page has not kept your text. Please return to the form and try again.
- Optional fallback: You can also email us at {email}. Omit without a configured address.
- cta: Back to the form → `/contact/`. `noindex`; exclude from sitemap.xml.

## 9. Privacy notice `/privacy/`
- `seo_title`: Privacy notice: enquiries and site visits
- `meta_description`: Read what information this site collects through enquiries and visits, why it is used and how to contact us about your data.
- `legal.privacy` h1: Privacy notice
- Editorial status: draft content structure; reconcile with the implemented data flow and owner review before launch. Existing privacy questions are carried forward, not answered here.
- Last updated: [[PLACEHOLDER: publication date]].
- h2: Who we are. Body: {brand}, India (Telangana). Contact us about this notice through our contact form → `/contact/`. [[PLACEHOLDER: Q9 confirmed operator identity and address; no registration number until registered]].
- h2: What we collect. Body: When you enquire, we collect your name, reply contact, selected service and message, plus your company name if you provide it. [[PLACEHOLDER: confirm technical logs and spam-prevention data against the implemented contact flow]].
- h2: Why we use it. Body: We use enquiry details to respond to your request. [[PLACEHOLDER: Q9 applicable legal basis and any further purposes, including enquiry reporting]].
- h2: Who receives it. Body: If you book a call, you use a booking page run by HubSpot Meetings, which receives the details you enter there to schedule the call. [[PLACEHOLDER: Q4 final notification channel and backup store, recipient access and any transfers; match actual delivery setup before publishing]].
- h2: How long we keep it. Body: [[PLACEHOLDER: Q9 enquiry and technical-log retention periods]].
- h2: Analytics and cookies. Body: This site uses Cloudflare Web Analytics, privacy-friendly analytics without cookies or local storage. We see totals such as page views, page load speed, referring sites, country, device type and browser, not who you are. Web addresses are recorded without their query part. If your browser sends a Global Privacy Control signal, analytics does not load. We set no cookies of our own. (Checked against Cloudflare's documentation in #169.) Owner Q10 chooses cookieless analytics; do not add a consent banner without an actual requirement.
- h2: Questions about your information. Body: Contact us through the form if you have a question about information you have shared. [[PLACEHOLDER: Q9 applicable access, correction and deletion rights and request process]].
- No required email address or unconfirmed legal promises. Resolve every privacy placeholder against the real service before launch.

## 10. 404 `404.html`
- `seo_title`: Page not found: find your next step
- `meta_description`: This page could not be found. Return home, explore our services or contact us for help with technical work.
- `errors.404` h1: We could not find that page
- body: The link may be old, or the page may have moved. Try one of these instead.
- links: Back to home → `/` · Explore our services → `/services/` · Contact us → `/contact/`. `noindex`; exclude from sitemap.xml. No closing CTA band.

## 11. Shared image and accessibility copy
- Logo: {brand} home, when the logo is the home link's only label.
- OG image alt: Built by experts. Powered by AI. Expert support, AI automation, websites and technical solutions.
- Example screens: §3.5. AI demo: full script in §1, readable as text without motion.
- Decorative inline tokens and duplicate marquee screens: empty alt; they add no words to the headline or reading order.
- Skip link: Skip to main content. Menu controls: Menu · Close menu. Service disclosure: Show services · Hide services. Breadcrumb label: Breadcrumb.

## 12. Editorial verification
Thirteen launch/utility pages have unique SEO titles and descriptions above, each within 60/155 characters. Each has one H1 with logical H2/H3 sections. FAQ is a How we work section; future blog, case studies, portal and apps have no launch copy or reserved routes.

## 13. Open questions for the PRD and PR description
Use PRD §12's working defaults; none block this draft. Carry these into the PR description so the product owner can update the PRD without expanding this ticket into product decisions.
- Q18: supported expertise. Q19: support format, duration, channel, named experts and availability. Defaults: general expert help; arrange details after enquiry.
- Q20: support pricing model, “from” amounts, inclusions and monthly scope. Default: pricing stance without figures or durations.
- Q21: solution scope and exclusions. Default: tailored software and technical solutions; candidate examples remain editorial.
- Q22: genuine stories, attribution, outcomes and media permissions. Q24: confirmed tools and logo permissions. Default: omit stories/tools sections.
- Q23: first-call price. Default: no “free” claim; no placeholder promise shown to visitors.
- Q4: booking link and final notification/backup setup. Q8: approved public-work links; fallback email only if configured. Q6: founder roles; names only until answered.
- Carried-forward items to reopen/extend under Q9: privacy review, operator identity/address, actual data and purposes, recipients/transfers, retention, rights, analytics wording and publication date.
- Carry-forward ownership/handover question: agreed ownership, licensing, documentation, access removal and ongoing support terms. Recommend recording alongside Q20/Q21; no contractual promises invented here.
