# Copy deck (MVP pages, redesign concept C)

Status: updated for Gate 2b concept C · Owner: content-writer · Tickets: #23, #87
Inputs: `voice-and-tone.md`, `docs/design/sitemap.md`, `docs/design/wireframes.md`, `docs/product/BRIEF.md` (owner answers), `docs/product/PRD.md`.
Form, error and empty-state copy lives in `microcopy.md`.

## How to read this deck
- Blocks are named to match the wireframe copy slots (`home.hero`, `services.<slug>.intro`, …).
- `{{brand.name}}`, `{{brand.domain}}`, `{{brand.email}}` are config tokens. Engineering maps them to `site.config.ts`. Never hard-code them.
- `seo_title` is checked at ≤ 60 characters with `{{brand.name}}` counted as 9 characters. `meta_description` is ≤ 155.
- `[[PLACEHOLDER: …]]` marks a gap that the owner must fill. All are listed in section 13.
- Primary CTA label: **Book a free audit call** (owner answer Q4). See the open decision in section 13: the sitemap and wireframes still say "Start a conversation".
- Spelling is British until the owner confirms.
- Typical timelines come from the owner's answer Q1. Time-saving statements are examples, not results.
- Redesign (ticket #87): home follows concept C (`docs/design/redesign/concept-c/`): an oversized centred promise, the dispatch field, six service rows, a closing band. Six services per PRD section 4. Audiences (PRD section 3) get their answer in the lede, the `for` line on each service row and the service detail pages. No savings figures anywhere. Diagram and animation copy describes examples, never client results.
- Any line marked "DRAFT" in the concept C prototype is replaced by the copy here.

---

## 0. Shared blocks

### `site.tagline`
Automation that runs like clockwork.

### `site.footer-line`
{{brand.name}} automates boring business work, adds AI where it helps, and builds the cloud setups, websites and software that run it. India · working with clients worldwide.

### `closing-cta` (used on every content page; Contact, Thanks, Error, Privacy and 404 omit it)
- h2: Tell us about one slow process
- body: Book a free audit call. We will look at one slow process and tell you what we would automate. We reply within 1 business day.
- cta: Book a free audit call
- supporting line: [[PLACEHOLDER: audit call length, for example "about 30 minutes"]] No obligation.

### Navigation labels
Services · How we work · About · Book a free audit call (button). Footer groups: Services, Company. Footer links: Privacy notice.

### Service names (single source)
| Slug | Name | One line (used on Home and Services) |
|------|------|--------------------------------------|
| `process-automation` | Business process automation | We take over the copy-paste work your team repeats every week. |
| `ai-automation` | AI automation | We add an AI step where it helps, with a person checking anything unclear. |
| `ai-cost-optimization` | AI cost optimization | We find where your AI spend goes, then test less costly ways to get the same work done. |
| `cloud-devops` | Cloud and DevOps | We set up your cloud and your release pipeline so launches stop being scary. |
| `websites-and-apps` | Websites and apps | A fast, clear business website in 1–2 weeks, built to be found and to get enquiries. |
| `custom-software` | Custom software | When off-the-shelf tools do not fit, we build the missing piece. |

Order matters: the two automation services lead, AI cost optimization follows AI automation, then cloud, then websites and custom software. The order matches the concept C rows (01–06).

**Audience tag (`for` line)** used on each Home row and Services block:
| Slug | For |
|------|-----|
| `process-automation` | Small-business owners and operations managers |
| `ai-automation` | Operations and IT managers, and owners with paperwork piling up |
| `ai-cost-optimization` | Founders, CTOs and IT managers whose AI bill keeps growing |
| `cloud-devops` | Founders, CTOs and IT managers |
| `websites-and-apps` | Small-business owners and founders |
| `custom-software` | Founders and operations managers |

[[PLACEHOLDER: Q14 owner confirms the list of six is final]] [[PLACEHOLDER: Q1 confirm custom software is offered at launch; the owner's four packages do not list it]] [[PLACEHOLDER: Q3 owner confirms audience priority; the `for` tags follow the PRD table, not a ranking]]

---

## 1. Home `/` (concept C, dispatch field)

Section order: header → `home.hero` → `home.field` → `home.services` (six rows) → `home.process` (optional band) → `home.about` (omitted until Q6) → `closing-cta`.

- `seo_title`: Automate repetitive business work | {{brand.name}}  (47)
- `meta_description`: We automate repetitive work, add AI where it helps, and build the cloud, websites and software behind it. Book a free audit call.  (131)

### `home.hero` (the oversized, centred promise)
- h1: We automate the boring work in your business
- lede: Your team re-types orders, chases approvals and builds the same report every Monday. {{brand.name}} makes that work run by itself, so people can spend their time on customers.
- cta primary: Book a free audit call
- cta secondary link: See what we do
- supporting line: For small businesses, startups and IT teams. We reply within 1 business day.
- eyebrow: none. The prototype eyebrow ("C / Dispatch field · Design exploration") is design-review text and does not ship.

### `home.field` (the dispatch field, shop → spreadsheet → invoice tool)
- tag left: Order to invoice
- tag right: Example workflow
- step labels (in order, inside the diagram): **Shop** · **Spreadsheet** · **Invoice tool**
- figcaption: One order moves from the shop to the spreadsheet to the invoice tool. Nobody retypes it.
- replay button: Replay workflow
- replay accessible name: Replay the example workflow
- text alternative (for the figure): An example, not a client result. An order arrives in a shop, is recorded in a spreadsheet and ends up in the invoice tool, without anyone retyping it.
- rule: the figure is an illustration. It never shows a number, a client name or a result.

### `home.services`
- eyebrow: 01 / Services
- h2: What we do
- intro: Most clients start with an audit or a website, then automate from there.
- row structure: number + group label · h3 · one line · `for` line · animation caption · replay button · link
- rows (order and text; one line and `for` come from the service table in section 0):

| Row label | h3 | Animation caption | Link text |
|-----------|----|-------------------|-----------|
| 01 / Automation | Business process automation | One order moves from the shop to the invoice tool without retyping. | Read about business process automation |
| 02 / AI | AI automation | An invoice becomes fields. Anything unclear goes to a person to check. | Read about AI automation |
| 03 / AI spend | AI cost optimization | An example of comparing AI spend with a test route. It shows the method, not a saving. | Read about AI cost optimization |
| 04 / Cloud | Cloud and DevOps | Code passes its tests, then waits for a person to approve the release. | Read about cloud and DevOps |
| 05 / Web | Websites and apps | A page is built up from content into a clear path to an enquiry. | Read about websites and apps |
| 06 / Software | Custom software | A small custom connector joins two tools that did not fit together. | Read about custom software |

- `for` line format: "For: " + the audience text from section 0.
- replay button (every row): Replay example. Accessible name: "Replay example: {service name}".
- note under the list: These diagrams show examples, not client results.
- [[PLACEHOLDER: Q14 confirm the six services; Q13 confirm what AI cost optimization includes]]

### `home.process` (optional band; design decides whether it ships on Home)
- h2: How an engagement runs
- steps:
  1. **Talk.** A free audit call about one slow process.
  2. **Scope.** We write down what we will build, for how much and by when.
  3. **Build.** We build it in small steps and show you as we go.
  4. **Hand over.** You get the working system, the accounts and the documents.
- link: Read how we work

### `home.about`
- h2: Who is behind {{brand.name}}
- body: {{brand.name}} is run by three founders: Mohammed Farhan, Adnan Sameer and Syed Zoheb Ali. [[PLACEHOLDER: Q6 one-line roles for each founder, and consent to name them on the home page]]
- link: Meet the founders
- rule: omit the whole section until roles are supplied.

### `home.proof`
Renders nothing at launch (owner Q5). Honest proof lives elsewhere: this site's open build process and public repositories. [[PLACEHOLDER: Q5 public GitHub and Medium URLs, via site config]] [[PLACEHOLDER: Q16 may the site say it is built by our own AI engineering team through a public, reviewed repository? No such claim is made until answered]]

---

## 2. Services overview `/services/`

- `seo_title`: Services: automation, AI, cloud, websites | {{brand.name}}  (53)
- `meta_description`: Business process and AI automation, AI cost optimization, cloud and DevOps, websites and custom software. Book a free audit call.  (130)

### `services.intro`
- h1: Services
- lede: We start with the work that wastes your team's time. Automation comes first, and cloud, websites and custom software support it. Pick the row that sounds like your problem, or book a call and we will help you choose.

### `services.<slug>.summary` (one block per service; h2 = service name; fields: summary, for, how the work runs, typical work, CTA)

**Business process automation**
- summary: Your team copies the same data between tools every day. We connect the tools so it moves on its own.
- for: Small-business owners and operations managers.
- how the work runs: A free audit call, then a 2–3 day audit of one process, then a fixed-price build, typically 1–3 weeks.
- typical work: Connect your shop, spreadsheet and accounting tool · Automate approvals and reminders · Build reports that send themselves
- cta: Read about business process automation

**AI automation**
- summary: Some chores need reading or judging, not just copying. We add an AI step and keep a person in charge.
- for: Operations and IT managers, and owners with paperwork piling up.
- how the work runs: We test the idea on your real documents first, build it into the workflow, then run it alongside your people before handover.
- typical work: Read incoming invoices and fill in the sheet · Sort and draft replies to common emails · Flag anything unclear for a person to check · Keep a log of what the AI did
- cta: Read about AI automation

**AI cost optimization**
- summary: AI bills grow and nobody can say why. We find where the spend goes and test less costly ways to do the same work.
- for: Founders, CTOs and IT managers whose AI bill keeps growing.
- how the work runs: We look at how your AI is used today, find where the spend goes, test options on your own cases and report what we found. We make no savings promise before we have looked.
- typical work: [[PLACEHOLDER: Q13 owner confirms scope, for example reviewing model usage and spend, choosing cheaper models, caching, cloud cost review]]
- cta: Read about AI cost optimization

**Cloud and DevOps**
- summary: Releases are manual, risky or slow, and the cloud bill is a mystery. We build a pipeline and a setup that are simple to run.
- for: Founders, CTOs and IT managers.
- how the work runs: We review what you have, agree a plan and a price, build and test, then hand over with a runbook.
- typical work: Automated build, test and release pipelines · Cloud setup with clear access rules and backups · Cost review · Documentation and handover
- cta: Read about cloud and DevOps

**Websites and apps**
- summary: Your website is slow, dated or does not bring enquiries. We build a clear one in 1–2 weeks, and web apps when you need more.
- for: Small-business owners and founders.
- how the work runs: We plan the pages with you, build, review with you, then launch and hand over.
- typical work: A clear business website in 1–2 weeks · Fast pages that work on a phone · Basic search setup · A simple way for customers to contact you
- cta: Read about websites and apps

**Custom software**
- summary: No off-the-shelf tool fits how you work. We check for an existing tool first, then build the missing piece.
- for: Founders and operations managers.
- how the work runs: A short written scope with a price, then small build steps with demos, then handover. [[PLACEHOLDER: Q1 timelines and code-ownership terms]]
- typical work: Internal tools and dashboards · Integrations between your systems · APIs and back-office apps
- cta: Read about custom software

### `services.help-choose`
- h2: Not sure which one you need?
- body: Most people are not. Book a free audit call. We will look at one slow process and tell you what we would automate.
- cta: Book a free audit call
- (This block is the closing band on this page. Do not add a second.)

---

## 3. Service detail pages `/services/<slug>/`

Shared structure (FR-6): `intro`, `for`, `animation`, `what`, `deliverables`, `process`, `needs`, plus `related`. H1 = service name. H2s fixed: What we do · Who it is for · Typical deliverables · How an engagement runs · What we need from you · Related services. Primary CTA in the hero and the closing band. Structured data: Service, BreadcrumbList.

Template blocks added for the redesign:
- `for` (h2 Who it is for): the audience text from section 0, then one sentence on the situation. Every service has one, written below as `for`.
- `animation`: the service's animation with its caption and text alternative from section 3.7. Placed after `intro`. The page must read in full without it.
- Page order: h1 → intro → CTA → animation → what → for → deliverables → process → needs → related → closing band.
- Fixed CTA labels: hero and closing band "Book a free audit call". Related links use the service name.
- `for` lines: **process-automation** Small-business owners and operations managers who lose hours each week to copy-paste work. · **ai-automation** Operations and IT managers, and owners whose paperwork needs reading, not only copying. · **ai-cost-optimization** Founders, CTOs and IT managers whose AI bill keeps growing and who want to understand it. · **cloud-devops** Founders, CTOs and IT managers whose releases are manual, risky or slow. · **websites-and-apps** Small-business owners and founders whose site is slow, dated or quiet. · **custom-software** Founders and operations managers for whom no existing tool fits.

`services.related` heading: Related services. Links are generated from config, link text is the service name.

### 3.1 Business process automation `/services/process-automation/`
- `seo_title`: Business process automation | {{brand.name}}  (42)
- `meta_description`: Stop re-typing data and chasing approvals. We automate the repeat work between your tools. Start with a 2–3 day audit. Book a free audit call.  (142)
- h1: Business process automation
- `intro`: Every week someone on your team copies data from one tool to another, builds the same report or chases the same approval. That work is slow, dull and easy to get wrong. We make it run by itself.
- `what` (h2 What we do): We look at how the work really happens, pick the chores that cost the most time, and connect your existing tools so the data moves on its own. We use the tools you already pay for where we can, and write small custom pieces only where we must. [[PLACEHOLDER: Q1 confirm tools and platforms the owner is happy to name]]
- diagram alt: Before and after. Before, a person copies data between three tools. After, the tools pass the data to each other.
- `deliverables` (h2 Typical deliverables):
  - A Workflow Automation Audit (2–3 days): a ranked list of what to automate, with rough effort for each
  - An Automation Build (1–3 weeks): the working automation, tested on your real cases
  - Alerts when something fails, so nothing breaks silently
  - A short guide so your team knows how it works
  - Optional monthly retainer for ongoing changes
  - [[PLACEHOLDER: Q1 confirm deliverables per package]]
- `process` (h2 How an engagement runs): 1. Free audit call. 2. Audit of one process, 2–3 days. 3. Fixed-price build, typically 1–3 weeks. 4. Handover and a check-in after launch. [[PLACEHOLDER: Q1/Q2 check-in period]]
- `needs` (h2 What we need from you): Someone who knows how the work is done today · Access to the tools involved, shared safely · A person to test the result with us · A few real examples, such as sample orders or invoices

### 3.2 AI automation `/services/ai-automation/`
- `seo_title`: AI automation for small businesses | {{brand.name}}  (49)
- `meta_description`: We add an AI step where it helps, like reading invoices or sorting emails, with a person checking the unclear cases. Book a free audit call.  (140)
- h1: AI automation
- `intro`: Some chores need reading or judging, not just copying: invoices, emails, forms, notes. AI can do the first pass. We build that step into your workflow and keep a person in charge.
- `what`: We add an AI step only where it saves real time. For example, it reads an incoming invoice and fills in the spreadsheet. If it is unsure, it flags the item for a person. We keep a log of what it did, so you can check.
- diagram alt: A document goes into an AI step. Clear results go straight to the spreadsheet. Unclear ones go to a person to check.
- `deliverables`: A working AI step inside your workflow · Rules for what gets checked by a person · A log of every decision · A short note on what data leaves your systems and where it goes · Handover guide. [[PLACEHOLDER: Q1 confirm AI tools and data-handling stance]]
- `process`: 1. Free audit call. 2. Test the idea on 20–50 of your real documents (example size, to be agreed). 3. Build it into the workflow. 4. Run it alongside your people for a short period, then hand over.
- `needs`: Real examples to test with · A person to decide what counts as "unclear" · Agreement on what data may be sent to an AI provider
- Honesty note: "We tell you where AI is a poor fit. If a simple rule does the job, we use the rule."

### 3.3 Cloud and DevOps `/services/cloud-devops/`
- `seo_title`: Cloud and DevOps setup | {{brand.name}}  (40)
- `meta_description`: Automated releases, a tidy cloud setup and clear handover for growing teams. Fewer manual steps, fewer surprises. Book a free audit call.  (137)
- h1: Cloud and DevOps
- `intro`: If releasing your software means a long checklist and crossed fingers, or the cloud bill surprises you each month, your setup needs work. We build pipelines and cloud setups that are simple to run and well documented.
- `what`: We automate how your code is built, tested and released. We set up your cloud accounts with sensible access rules, backups and cost limits, and hand over everything so you are not locked to us. [[PLACEHOLDER: Q6 confirm the founders' cloud and DevOps experience, plus any certifications or platforms to name]]
- diagram alt: A pipeline: code is saved, tested automatically, then released to the live site with one approval.
- `deliverables`: Automated build, test and release pipeline · Cloud account setup with access rules and backups · Monitoring and alerts for the basics · Cost review with options · Runbook and handover session. [[PLACEHOLDER: Q1 confirm; owner says this is for larger clients]]
- `process`: 1. Free audit call. 2. Review of what you have today. 3. Agreed plan and fixed price. 4. Build and test. 5. Handover, with an option of a monthly retainer.
- `needs`: Admin access to your cloud and code accounts, granted safely · A person who can approve changes · Notes on anything that must not go down, and when

### 3.4 Websites and apps `/services/websites-and-apps/`
- `seo_title`: Business websites and apps | {{brand.name}}  (42)
- `meta_description`: A fast, clear business website in 1–2 weeks, built to be found and to bring enquiries. See what is included. Book a free audit call.  (132)
- h1: Websites and apps
- `intro`: Your website is often the first thing a customer sees. If it is slow, confusing or out of date, they leave. We build a clear business website in 1–2 weeks, and web apps when you need more.
- `what`: We plan the pages, write or tidy the copy with you, build a fast site that works on a phone, and set it up so search engines can read it. We also connect the contact form to the tools you use, so enquiries do not get lost.
- diagram alt: A visitor lands on a page, reads it, and sends an enquiry that reaches your team.
- `deliverables`: A multi-page business website · Mobile-friendly and accessible pages · Search basics (titles, descriptions, sitemap) · A contact form wired to your inbox or chat · Simple analytics that need no cookie banner · Handover so you can edit content. [[PLACEHOLDER: Q1 confirm package contents; Q2 "from" price]]
- `process`: 1. Free audit call. 2. Plan the pages and content. 3. Build and review with you. 4. Launch and hand over. Typical total: 1–2 weeks.
- `needs`: Your logo and any text or photos you already have · Someone to approve the pages · Access to your domain settings, if you have a domain

### 3.5 Custom software `/services/custom-software/`
- `seo_title`: Custom software development | {{brand.name}}  (42)
- `meta_description`: When no off-the-shelf tool fits, we build the missing piece: internal tools, integrations and back-office apps. Book a free audit call.  (135)
- h1: Custom software
- `intro`: Sometimes the tool you need does not exist, or the ones you have do not talk to each other. We build the missing piece, small and focused, so it fits how you work.
- `what`: We start by checking whether an existing tool can do the job, because that is cheaper. If not, we build a small, well-tested application or integration and document it so someone else could maintain it.
- diagram alt: Three separate tools connect through one small custom service that moves data between them.
- `deliverables`: Working software, tested · Source code [[PLACEHOLDER: Q1 confirm code-ownership terms]] · Documentation · Deployment set up and handed over · Optional support retainer
- `process`: 1. Free audit call. 2. Short written scope with a fixed price. 3. Build in small steps with demos. 4. Handover. [[PLACEHOLDER: Q1 timelines; the brief gives none for custom software]]
- `needs`: A clear owner for decisions · Examples of how the work is done today · Access to systems the software must connect to

### 3.6 AI cost optimization `/services/ai-cost-optimization/`
Scope is not confirmed (Q13). Everything below describes a method, not a result. **No savings figure, percentage or promise appears here or anywhere else on the site.**
- `seo_title`: AI cost optimization | {{brand.name}}  (35)
- `meta_description`: Find out where your AI spend goes and test less costly ways to get the same work done. No savings promised up front. Book a free audit call.  (141)
- h1: AI cost optimization
- `intro`: AI features are easy to switch on and hard to keep track of. If your AI bill keeps growing and nobody can say why, we help you see where the money goes and what could change.
- `what`: We look at how your AI is used today and where the spend sits. Then we test other ways to do the same work on your own cases, and show you what we found, including the cases where nothing better exists. We do not promise a saving before we have looked. [[PLACEHOLDER: Q13 owner confirms the method and what is in and out of scope, for example model choice, caching, prompt length, cloud cost review]]
- `for`: Founders, CTOs and IT managers whose AI bill keeps growing and who want to understand it.
- `deliverables`: A plain-language picture of where AI spend goes · Options we tested on your own cases, with what each one changes · A short written report with our recommendation · Handover of anything we set up. [[PLACEHOLDER: Q13 confirm deliverables]]
- `process`: 1. Free audit call. 2. Look at how and where you use AI. 3. Test options on your real cases, next to what you do today. 4. Report and recommendation. [[PLACEHOLDER: Q13 timeline and price model]]
- `needs`: Read-only access to usage and billing information, granted safely · Examples of the work the AI does for you · A person who can say what quality is good enough · Agreement on what data we may see
- honesty note: "Cheaper only counts if the work stays as good. We check that first."
- Banned on this page and in all related copy: "cut your AI bill by…", "save up to…", "guaranteed", any percentage or currency amount of savings. [[PLACEHOLDER: Q13 owner states whether any statement about expected savings is allowed; until then, none]]

### 3.7 Service animations: captions and text alternatives
Each animation plays once when it scrolls into view and ends on a finished picture. The caption is visible text under the diagram. The text alternative is for assistive technology (the `figure` description, or a visually hidden paragraph); the SVG itself is `aria-hidden`. Both say what the diagram explains, and all are examples, not client results. Use the same text on Home rows and on each detail page.

| Animation | Caption (one line, visible) | Text alternative (says what it explains) |
|-----------|-----------------------------|-------------------------------------------|
| Hero: dispatch field | One order moves from the shop to the spreadsheet to the invoice tool. | An example workflow. An order arrives in a shop, is recorded in a spreadsheet and ends up in the invoice tool without anyone retyping it. It explains what "makes the work run by itself" means. |
| Business process automation | One order moves from the shop to the invoice tool without retyping. | An example. An order leaves the shop and appears in the invoice tool by itself, so nobody copies it by hand. It explains what connecting two tools does. |
| AI automation | An invoice becomes fields. Anything unclear goes to a person to check. | An example. An invoice goes in. The AI step reads it. Clear details become fields in the sheet. Unclear ones are set aside for a person to check. It explains that a person stays in charge. |
| AI cost optimization | An example of comparing AI spend with a test route. It shows the method, not a saving. | An example of method only. One tall bar shows today's spend and a shorter bar shows a test route. The bars have no numbers and are not a result. It explains that we compare spend before we recommend a change. |
| Cloud and DevOps | Code passes its tests, then waits for a person to approve the release. | An example pipeline. Code is built, then tested, and the tests pass. A pause marked with two bars shows the release waiting for a person to approve it. It explains that a release has automatic checks and a human decision. |
| Websites and apps | A page is built up from content into a clear path to an enquiry. | An example. Page sections appear one after another: a heading, text, a button and a contact box. It explains that every page leads a visitor to one clear enquiry. |
| Custom software | A small custom connector joins two tools that did not fit together. | An example. Tool A and Tool B sit apart. A small block labelled Adapter appears between them and joins them. It explains what a custom piece of software does. |

Replay and control labels:
- Replay button: "Replay example" (hero: "Replay workflow"). Accessible name adds the service: "Replay example: {service name}".
- Reduced-motion note (visible only when motion is off, optional): "Animation is off. This is the finished picture."
- Cloud and DevOps: the pause marker is described in text ("waits for approval"), never by colour alone.

The "diagram alt" lines in 3.1–3.5 are replaced by the text alternatives above.

---

## 4. How we work `/how-we-work/`

- `seo_title`: How we work: from first call to handover | {{brand.name}}  (58)
- `meta_description`: Four steps from a free audit call to a working system. Fixed-price packages, an optional retainer and clear handover. Book a free audit call.  (141)

### `how.intro`
- h1: How we work
- lede: You should know what happens next at every stage, and what it costs before we start.

### `how.steps`
- h2: From first call to delivery
- steps (ordered list; h3 + sentence + "You get"):
  1. **Free audit call.** We look at one slow process and listen. You get an honest view of what is worth automating.
  2. **Scope and price.** We write down what we will build, by when and for how much. You get a written plan to approve.
  3. **Build.** We work in small steps and show progress. You get working pieces to test, not a surprise at the end.
  4. **Hand over.** We move it live and document it. [[PLACEHOLDER: Q1 confirm handover commitments: team training, removing our access when done]] You get the system and the documents.

### `how.models`
- h2: How we engage
- items:
  - **Fixed-price package.** One clear outcome, one price, one timeline. Typical: Workflow Automation Audit 2–3 days · Business Website 1–2 weeks · Automation Build 1–3 weeks · Cloud and DevOps setup, scoped per client.
  - **Monthly retainer.** For ongoing automation or DevOps changes after the first build. [[PLACEHOLDER: Q2 retainer scope and hours]]

### `how.pricing`
- h2: Pricing
- body: Packages have a fixed price, shown as a "from" price. The final price depends on the number of tools, the amount of custom work and how clear the process is. We agree it in writing before we start. [[PLACEHOLDER: Q2 "from" prices for the four packages]]

### `how.handover`
- h2: Security and handover
- body: [[PLACEHOLDER: Q1 confirm ownership terms and access practice. Draft: "You keep your accounts, data and code. We ask for the least access we need and remove it when we finish. We document how everything works."]]

### `how.faq` (optional short list)
- h2: Common questions
- **Do I need to know what to automate?** No. The audit call is for finding out.
- **What if I only need a website?** That is a good place to start. We build it in 1–2 weeks.
- **How soon will I hear back?** Within 1 business day.
- **Who owns the result?** [[PLACEHOLDER: Q1 ownership terms]]

---

## 5. About `/about/`

- `seo_title`: About us | {{brand.name}}  (18)
- `meta_description`: Meet the founders behind {{brand.name}}, an India-based team that automates boring work for small businesses worldwide.  (119)

### `about.intro`
- h1: About {{brand.name}}
- lede: We are a small, founder-led team in India. We automate boring work for small businesses and startups, wherever they are.

### `about.who`
- h2: Who is behind {{brand.name}}
- body: {{brand.name}} was started by three founders: Mohammed Farhan, Adnan Sameer and Syed Zoheb Ali. [[PLACEHOLDER: Q6 role line for each founder, for example "cloud and DevOps engineer" for Mohammed Farhan (from the brief), and bios]]
- photo: [[PLACEHOLDER: Q6 photos, optional; omit the column if none]]
- photo alt (when supplied): Portrait of {name}, {role}.

### `about.expertise`
- h2: What we are good at
- list: Cloud and DevOps · Software development · AI automation · AI cost optimization · Websites and apps for businesses [[PLACEHOLDER: Q6 owner confirms each founder's areas; this list is the services list only]]
- note: [[PLACEHOLDER: Q6 any certifications or years of experience the owner wants stated]]

### `about.proof`
- h2: How you can check our work
- body: We build this site in the open, with written requirements, reviews and tests. [[PLACEHOLDER: Q5 public GitHub and Medium URLs; shown only once the owner approves]] Case studies will come as we complete client work.

### `about.name`
- h2: The name
- body: [[PLACEHOLDER: owner confirms the name story. Draft: "A clock keeps time by itself. A vane turns with the wind and shows the way."]]
- note: Name story lives on this page only. The name may change (Q9), so no other page relies on it.

---

## 6. Contact `/contact/`

- `seo_title`: Contact {{brand.name}} | Book a free audit call  (41)
- `meta_description`: Book a free audit call or send a short message about the work you want off your plate. We reply within 1 business day.  (118)

### `contact.intro`
- h1: Tell us what you want off your plate
- lede: Book a free audit call, or send a short message. We reply within 1 business day.
- primary: Book a free audit call (links to the booking page from config; [[PLACEHOLDER: Q4 Cal.com booking URL, via site config]])
- form heading (h2): Or send a message

### `contact.form`
Labels, hints, errors and button text: see `microcopy.md` section 1.

### `contact.next-steps` (side panel)
- h2: What happens next
- steps: 1. We read your message. 2. We reply within 1 business day, by email or phone. 3. If it looks like a fit, we book a free audit call.

### `contact.privacy-note`
We use your details only to reply to you. Read our privacy notice. (link text: "privacy notice")

### `contact.fallback`
You can also reach us at {{brand.email}}. [[PLACEHOLDER: Q4/Q8 no mailbox yet. Hide this line until the config has an email or link]]

---

## 7. Enquiry sent `/contact/thanks/`

- `seo_title`: Enquiry sent | {{brand.name}}  (noindex)
- `meta_description`: We have your message and will reply within 1 business day.
- h1: Message sent
- body: Thanks. We have your message and will reply within 1 business day.
- h2: What happens next
- steps: 1. We read your message. 2. We reply by email or phone. 3. If it fits, we suggest a time for a free audit call.
- links: Read how we work · Back to home

## 8. Enquiry failed `/contact/error/`

- `seo_title`: Message not sent | {{brand.name}}  (noindex)
- `meta_description`: Your message was not sent. Please try the form again.
- h1: We could not send your message
- body: Your message was not sent, and this page has not kept your text. Please try again. [[PLACEHOLDER: Q4/Q8 fallback contact line, hidden if none: "Or reach us at {{brand.email}}."]]
- cta: Back to the form

---

## 9. Privacy notice `/privacy/`

- `seo_title`: Privacy notice | {{brand.name}}  (26)
- `meta_description`: What {{brand.name}} collects when you contact us or visit this site, why, who sees it and how to ask us to delete it.  (117)
- Status: **structure and plain-English draft only, not legal advice. The owner must review it before launch.** [[PLACEHOLDER: Q9 legal review]]
- h1: Privacy notice
- meta line: Last updated: [[PLACEHOLDER: date of publication]]

### `legal.privacy`
- h2: What we collect
  - body: If you send a message, we collect your name, how to reach you, your message and, if you give it, your company name. We also see simple visit counts (pages viewed, country, browser type) from our analytics.
- h2: Why we collect it
  - body: To reply to you and to understand which pages are useful. [[PLACEHOLDER: Q9 legal basis wording for the jurisdiction]]
- h2: Who receives it
  - body: Your message is sent to us through [[PLACEHOLDER: Q4 notification channel and backup store, for example a messaging app and a spreadsheet; confirm names with the owner before publishing]]. Analytics are provided by Cloudflare Web Analytics (owner Q10).
- h2: How long we keep it
  - body: [[PLACEHOLDER: Q9 retention period for enquiries]]
- h2: Your rights and how to use them
  - body: You can ask what we hold about you and ask us to correct or delete it. Contact us at {{brand.email}}. [[PLACEHOLDER: Q9 rights wording for India (Telangana)]]
- h2: Cookies and analytics
  - body: Cloudflare Web Analytics does not use cookies, so this site has no cookie banner. If that changes, we will update this page first.
- h2: Who we are
  - body: {{brand.name}}, India (Telangana). Registration is in progress. [[PLACEHOLDER: Q9 registered name and address, once registered]]

---

## 10. 404 `404.html`

- `seo_title`: Page not found | {{brand.name}}  (noindex)
- `meta_description`: This page could not be found.
- h1: We could not find that page
- body: The link may be old, or the page may have moved. Try one of these instead.
- links: Home · Services · Contact

---

## 11. Alt text and OG

| Item | Value |
|------|-------|
| Logo (header) | {{brand.name}} home |
| OG title | same as `seo_title` of the page |
| OG description | same as `meta_description` |
| OG image alt | {{brand.name}}: automation that runs like clockwork |
| Decorative SVGs | `aria-hidden="true"`, empty alt |
| Workflow diagrams and service animations | text alternative in section 3.7 |

## 12. Unique-title check (updated for #87)

All `seo_title` values above are different and ≤ 60 characters with `{{brand.name}}` counted as 9. Noindex pages (Thanks, Error, 404) have titles too, for the browser tab.

## 13. Open questions and decisions (also in the PR description)

**Decisions**
1. **CTA label conflict.** Owner answer Q4 says "Book a free audit call". `PRD.md`, `sitemap.md` and `wireframes.md` say "Start a conversation" and "Submit enquiry". This deck follows the owner (CTA "Book a free audit call", form button "Send message", Contact h1 changed). Follow-up ticket #32 realigns those three files. If the owner prefers "Start a conversation", it is a find-and-replace in this deck.
2. British or US spelling.
   Also: custom software is shown as a fifth service; owner decides (Q1 lists four packages) before Gate 2.
3. Final tagline (working one is used).
4. One file or one file per page: the ticket asked for `copy-deck.md`, so all pages live here.
5. Redesign (#87): the old `home.chores` list is removed because concept C has no such section; the example chores now live in the lede and the six rows. `home.process` and `home.about` stay as optional bands below the services; design decides whether they ship.
6. Audience answers sit in the lede, the `for` tag on each row and the detail-page `for` block, not in a separate "pick your role" section, because concept C has none.

**Placeholders (redesign additions first)**
- Q13: what AI cost optimization includes, deliverables, timeline, price model; whether any statement about expected savings is allowed (none until answered)
- Q14: confirm the six services are final
- Q16: may the site say it is built by our own AI engineering team through a public repository
- Q3: audience priority (the `for` tags are not a ranking)
- Audit call length
- Q1: custom software offered? tools named, deliverables, timelines, ownership terms, access practice, real example chores
- Q2: "from" prices, retainer scope
- Q4: Cal.com URL, fallback email, notification channel
- Q5: GitHub and Medium URLs
- Q6: founder roles, bios, photos, certifications, years
- Q9: legal name and address, retention period, rights wording, legal review, last-updated date
