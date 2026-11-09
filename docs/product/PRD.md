# PRD — company website

| Field | Value |
|-------|-------|
| Owner | product-owner |
| Status | v3, in review (ticket #122) |
| Last updated | 2026-11-04 |
| Inputs | `docs/product/BRIEF.md` (owner answers and change request 3, which wins over anything older), `docs/product/competitor-scan.md` |

Priorities: **p0** = launch blocker, **p1** = needed for a credible v1, **p2** = nice for v1 / first follow-up, **p3** = future.
Requirement IDs (e.g. FR-1) are stable so stories and tests can cite them.

The working brand is held only in `site.config.ts` and may change. This document says "we" on purpose.

## 1. Problem and opportunity
Technical work is hard to buy. A person with a problem often can't tell who is able to solve it. A company that wants AI in its workflows, a new website or a tailored system hears the same vague claims from most providers, and many sites hide how an engagement works (competitor scan). These statements are our working hypotheses, not research.

We offer one place for this work: experienced specialists who help directly, and who build with AI where it helps. A new firm cannot win on logo walls, so we win on **specificity, plain language and honesty**, and on the quality of the site itself.

### 1.1 Positioning (change request 3, 2026-11-03)
- **Tagline:** "Built by experts. Powered by AI." It works with any company name.
- **Positioning:** for individuals and companies who need technical work done well, we bring expert help, AI automation, website creation and tailored solutions into one place, with experts leading the work and AI supporting it.
- **Value proposition:** you deal with people who know the work, you get a clear next step, and you are told plainly what you will get. Final wording belongs to the copy deck.
- **Name-independent:** nothing may depend on the company name. No visual, metaphor, illustration, animation or copy plays on it, so a rename stays a one-line config change.
- **Any client, professional tone:** we write for individuals and companies alike and never describe a client by size or stage.
- **Product-led look:** clean, light and confident, with the qualities of mobbin.com translated to our business (section 5.1). We learn from it and copy nothing.

## 2. Goals and non-goals
### Goals (targets in section 7)
- G1. Give a visitor a clear answer in under 10 seconds: what we do, who it is for, and what to do next.
- G2. Produce qualified enquiries for each of the four services through a path that works with no mailbox.
- G3. Build trust without invented proof: concrete service descriptions, a transparent way of working, and only real proof.
- G4. Meet the quality bar: the limits in section 7.2, WCAG 2.2 AA, unique SEO metadata on every page.
- G5. Be cheap to run now (free tier, zero spend) and cheap to change later (brand, domain, email, host).
- G6. Make the site itself evidence of how well we build, without any invented claim.
- G7. Win the owner's approval of the design system and prototype at Gate 2e, on phone and laptop.

### Non-goals (v1)
- No blog, case-study library, client portal, user accounts, payments or CMS login (see section 10). "Book an expert" starts a conversation or a booking; it does not take payment.
- No marketing campaigns, ads or newsletters (a separate team, after domain and email exist).
- English only (Q7).
- No stack, hosting or visual decisions in this document (ADRs and the design system own these).
- No 3D worlds, particles, dark sci-fi or animation frameworks (change request 3).
- No claims about clients, years in business, certifications or statistics until the owner supplies them.

## 3. Audiences
Full personas: `docs/product/personas.md`. All are hypotheses, not research. The order is not a ranking.

| Audience | Job to be done | What they check in the first 10 seconds | What the site must show them | What scares them off |
|----------|----------------|------------------------------------------|------------------------------|----------------------|
| **Individual who needs an expert** (P1) | "Help me get past this technical problem, or tell me what to do next." | Can a real expert help me? How do I start? | Plainly that expert individuals are available, the areas they cover, how a session works, what it costs | Sales language, being brushed off, unclear cost |
| **Company that needs AI automation** (P2) | "Put AI into our real workflows so the work gets done reliably." | Do they understand workflows? Is it safe? | Example screens of an automation run and an AI demo, where people stay in control, a short way to start | Hype, vague AI claims, no stance on data |
| **Company that needs a website** (P3) | "Get a website or web app that represents us well and works." | Can they build something this good for us? | This site as evidence, example screens, what is included, how a project runs | Template looks, hidden costs, long timelines with no steps |
| **Company that needs a solution or expert help** (P4) | "Solve this specific technical problem for us, or lend us someone who can." | Have they got the depth? Will they understand our case? | Scope in concrete terms, expertise, how we scope and hand over, a route to a technical conversation | Vague capability lists, no way to assess quality |
| **Owner / future team (internal)** | Keep content, contact details and brand editable without engineers | n/a | Single config file, documented content updates | Hard-coded values scattered around |

Anyone comparing providers also asks "is this a template?" The site answers that for every audience.

## 4. Value proposition and services
These four services replace all earlier service lists. Business process automation, AI cost optimization, cloud and DevOps, and custom software are no longer separate services. **Wording decision:** software development, cloud and DevOps appear only as areas of expertise inside expert support and as examples inside solutions, subject to Q18 and Q21. AI cost optimization is not mentioned, because its scope was never confirmed.

### 4.1 Expert support
| | |
|---|---|
| **Goal** | Connect a person or a company with an experienced specialist who can help with technical work |
| **Who it is for** | Individuals (P1) and companies (P4) |
| **What the client gets** | Advice, troubleshooting, hands-on help and guidance on technical work, from an expert individual. Areas: [[PLACEHOLDER: areas of expertise, Q18]]. Session format: [[PLACEHOLDER: how a support session works, Q19]]. Pricing: [[PLACEHOLDER: support session pricing model, Q20]] |
| **Primary call to action** | **Book an expert** |
| **Proof we can show** | [[PLACEHOLDER: real stories or proof, Q22]] |

### 4.2 AI automation
| | |
|---|---|
| **Goal** | Let a company's workflows do more of their work reliably, with AI agents and automations built into them |
| **Who it is for** | Companies with repeatable work in their workflows (P2) |
| **What the client gets** | AI agents and automations designed, built and fitted into their workflows. Pricing: [[PLACEHOLDER: "from" price, Q20]] |
| **Primary call to action** | **Book a call** |
| **Proof we can show** | Original example screens, labelled as examples. [[PLACEHOLDER: real stories or proof, Q22]] |

### 4.3 Website creation
| | |
|---|---|
| **Goal** | Give a client a website or web app that serves its purpose and is fast and accessible |
| **Who it is for** | Any client who needs a website or web app; the main persona is a company (P3) |
| **What the client gets** | A website or web app, designed and built. Pricing: [[PLACEHOLDER: "from" price, Q20]] |
| **Primary call to action** | **Book a call** |
| **Proof we can show** | This website, its review process and our public repositories (owner answer Q5). Original example screens, labelled as examples |

### 4.4 Solutions for companies
| | |
|---|---|
| **Goal** | Solve a company's specific problem with software or a technical solution made for its case |
| **Who it is for** | Companies whose need does not fit a standard product or the other three services (P4) |
| **What the client gets** | Tailored software and technical solutions. Scope: [[PLACEHOLDER: scope of the solutions we offer, Q21]]. Pricing: [[PLACEHOLDER: "from" price or how it is quoted, Q20]] |
| **Primary call to action** | **Book a call** |
| **Proof we can show** | [[PLACEHOLDER: real stories or proof, Q22]] |

Differentiators to express: plain, honest copy; expert individuals a visitor can actually reach; an explicit way of working and pricing stance; example screens that show the work rather than describe it.

## 5. Pages (v1) and purpose
Every page needs a unique title, description, OG tags and a sitemap entry (NFR-SEO). URLs and navigation: `docs/design/sitemap.md`.

| Page | Purpose | Primary CTA | Priority |
|------|---------|-------------|----------|
| Home | State what we do and for whom, show the four services and the AI demo, repeat the CTA (section 5.1) | Book a call | p0 |
| Services overview | Present the four services as one place, each with its example screens, and link to detail | Book a call | p0 |
| Expert support | Section 4.1: what you get, how it works, who it is for, example screens | Book an expert | p1 |
| AI automation | Section 4.2, same structure | Book a call | p1 |
| Website creation | Section 4.3, same structure | Book a call | p1 |
| Solutions for companies | Section 4.4, same structure | Book a call | p1 |
| How we work | Reduce fear: steps from first call to delivery, how a support session and a project each run, how pricing works | Book a call | p1 |
| About | Who is behind the company, founders and expertise. Owner-supplied facts only; no story about the name | Book a call | p1 |
| Contact | Conversion page: the contact path from section 6 | Send message | p0 |
| Privacy notice | What is collected and why, including cookie information if needed | None | p0 |
| 404 page | Recover lost visitors | Back home / Contact | p0 |
| FAQ | Answer pricing, timeline, process and ownership questions (can be a section instead of a page) | Book a call | p2 |
| Blog / insights, case studies, client portal, apps | Future (section 10) | n/a | p3 |

Cross-cutting: global header with the primary CTA, rich footer with service and legal links, sitemap.xml, robots.txt, social/OG preview image.

### 5.1 Home page and imagery (change request 3)
Section order: hero, tools strip, problem and solution, the four services, the AI demo, stories, closing CTA, rich footer.
- **Hero:** a confident headline sentence with small visual tokens between the words. Tokens are services, tools and topics, never pictures of invented people.
- **Tools strip:** only tools we really work with [[PLACEHOLDER: tool list, and whether logos may be shown, Q24]]. It must not suggest a partnership or a client relationship.
- **Four services:** a "one place for everything" view, like Mobbin's tabs, with thumbnails per service.
- **AI demo:** a prompt, steps appearing and a result, with a live feel. It is scripted, labelled as an example, and shows no invented outcome.
- **Stories:** appear only when real. Drafts hold placeholders; production renders nothing until then (FR-5).
- **Imagery:** original example screens we design ourselves (website pages, an AI assistant at work, an automation run, an expert support session), in auto-scrolling columns and marquees. Every one is labelled as an example and none imitates client work.

## 6. Conversions
- **Primary, by context:**
  - **"Book a call"** is the site-wide label: the header, home, services overview, company services and other pages.
  - **"Book an expert"** is the in-page primary CTA on the Expert support page, and on that service's card where the four services are shown. The header keeps "Book a call", so the header never changes between pages.
  - The form button on Contact reads "Send message".
- **Decision:** the earlier label "Book a free audit call" is retired, because the audit package is gone with change request 3 and the first call may or may not stay free. Copy does not say "free" until the owner confirms it (Q23).
- **Destination:** both CTAs lead to the contact path, with the service already chosen where possible. An enquiry records which service it is about (FR-9), which is how we count conversions per service.
- **Booking:** the owner chose Cal.com plus a short contact form (Q4). The booking link is a config value and opens as a link, not an embedded script. Until the owner creates the account [[PLACEHOLDER: Cal.com booking link, Q4]], CTAs go to the contact form.
- **Secondary:** read a service page or How we work; open our public repositories and articles (Q5, Q8).
- **No-mailbox path:** enquiries notify the owner by WhatsApp or Telegram webhook, with a Google Sheet backup (Q4). The destination is configuration, so switching to a mailbox is a config change. Visitors always get an on-page confirmation and the promised response: within 1 business day (Q4).

## 7. Success metrics
Detail: `docs/product/success-metrics.md`. There is no baseline yet. The only owner-set business target is Q11; we set per-service targets from real data three months after launch and invent none before then.

| Metric | Target | How measured |
|--------|--------|--------------|
| Qualified enquiries, all services | 3–5 per month in the first quarter, growing after (owner answer Q11) | Enquiry log, tagged qualified or not by the owner |
| Conversions per service (expert support, AI automation, website creation, solutions) | Counted from launch; [[PLACEHOLDER: per-service targets, set from 3 months of data]] | Service recorded on each enquiry (FR-9) and bookings per service |
| Service page views to enquiries, per service | Tracked; [[PLACEHOLDER: target, set from 3 months of data]] | Page views from Cloudflare Web Analytics against the enquiry log. It has no custom events, so we do not depend on click tracking |
| First reply to an enquiry | Within 1 business day (owner answer Q4) | Enquiry log |
| Lighthouse (all four categories), mobile | ≥ 95 on every page | CI Lighthouse run |
| Core Web Vitals | Lab limits in section 7.2. Field (p75, mobile): LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 | Lab in CI, then field data when available |
| Owner sign-off | Owner approves the design system and prototype on phone and laptop | Gate 2e PR merged by the owner |
| Audience fit | A first-time visitor from each audience in section 3 can say what we do and what to do next within 10 seconds | Informal walkthrough with real people [[PLACEHOLDER: testers, Q17]] |
| Accessibility | 0 critical or serious axe violations; keyboard-only walkthrough passes | CI axe checks plus a manual check per release |
| Pages with unique title and description | 100% | CI check against sitemap |
| Content accuracy | 0 unsupported claims | PO review of every content PR |

### 7.2 Limits (from change request 3; lab, mobile, every page)
| Limit | Value |
|-------|-------|
| Lighthouse (all four categories) | ≥ 95 |
| LCP / CLS | ≤ 2.0 s / ≤ 0.05 |
| Script per page (compressed) | ≤ 50 kB. CSS marquees and small vanilla JS; no animation framework |
| Images | AVIF or WebP, responsive sizes, lazy below the fold |
| Whole page | ≤ 1.5 MB |
| Reduced motion | Marquees stop and the page stays complete |
| Not allowed | 3D worlds, particles, dark sci-fi, anything that plays on the name, invented logos, testimonials or numbers |

`docs/architecture/nfr.md` holds the engineering budgets (NFR v3, #123). Where it differs from this table, the stricter value wins until the owner agrees otherwise.

## 8. Requirements
### 8.1 Functional
- FR-1 (p0) Every page shows the header CTA "Book a call" and at least one in-page CTA, using the labels in section 6.
- FR-2 (p0) Contact enquiry captures name, a reply contact and a message; validates input on client and server; shows success and error states; resists spam without forcing a CAPTCHA by default.
- FR-3 (p0) Enquiry destination, booking link and fallback contact methods are configuration, not code.
- FR-4 (p0) Brand name, domain, email, phone, socials and analytics IDs are defined only in the site config file and env vars (CLAUDE.md rule 5).
- FR-5 (p1) Proof components (stories, testimonials, logos, stats) render nothing when no real data exists.
- FR-6 (p1) The four service pages come from one data-driven template, so a fifth service or a case study can be added without redesign.
- FR-7 (p0) Real 404 page; loading, empty and error states for any interactive element.
- FR-8 (p1) Visitors can reach every page within two clicks from Home.
- FR-9 (p1) Each enquiry records the service it is about: expert support, AI automation, website creation, solutions, or "not sure". A service page's CTA preselects it where possible; without JavaScript the visitor chooses it.

### 8.2 Content
- CR-1 Copy comes from the approved copy deck; plain, benefit-led, specific; no superlatives or unverifiable numbers. Professional tone for any client. No buzzwords (Q12).
- CR-2 No invented testimonials, clients, team members, years in business, prices or statistics. Unknown facts are `[[PLACEHOLDER: …]]` in drafts and must be resolved or removed before Gate 3.
- CR-3 Each service page says what you get, how it works and who it is for, in concrete terms and not only categories.
- CR-4 A pricing stance is present on How we work: "from" prices, fixed price for defined work, a monthly option for ongoing work (Q2), amounts subject to Q20.
- CR-5 Placeholder identity (name, domain, email) is easy to swap; no copy depends on the name, domain or email.
- CR-6 Legal pages reflect what is actually collected (enquiry data, analytics).
- CR-7 Home and the Expert support page say plainly that expert individuals are available to help individuals and companies.
- CR-8 No copy describes a client by size or stage.
- CR-9 Every example screen and the AI demo are original and labelled as examples.

### 8.3 SEO
- NFR-SEO-1 Each page has a unique title (≤ 60 chars guideline) and description (≤ 160), canonical URL, OG and Twitter tags.
- NFR-SEO-2 sitemap.xml and robots.txt generated; every public page indexed once the production domain is live; non-production environments are `noindex`.
- NFR-SEO-3 Structured data where it fits (Organization, WebSite, Service, BreadcrumbList, ContactPage) with no fabricated fields (no ratings or reviews without real ones).
- NFR-SEO-4 One H1 per page; descriptive link text; images have meaningful alt text.
- NFR-SEO-5 URLs are stable, lowercase and readable, and do not contain the brand name, so a later domain change can be handled with redirects.

### 8.4 Accessibility
- NFR-A11Y-1 WCAG 2.2 AA on all pages: semantic landmarks, keyboard operability, visible focus, contrast, target size, reduced-motion respect.
- NFR-A11Y-2 Form fields have labels, error messages are associated and announced, and no information is conveyed by colour alone.
- NFR-A11Y-3 Works at 200% zoom and on small screens (320 px) without loss of content.
- NFR-A11Y-4 Marquees and auto-scrolling columns can be paused and stop under reduced motion; their content is decorative or available elsewhere; the page stays complete and keyboard usable.

### 8.5 Performance
- NFR-PERF-1 The limits in section 7.2 and the Core Web Vitals targets in section 7 are met on a mid-range mobile profile.
- NFR-PERF-2 Performance budgets are set in the NFRs; third-party scripts need a written justification.
- NFR-PERF-3 Pages remain usable without JavaScript for reading content; the CTA has a non-JS fallback where feasible.
- NFR-PERF-4 The limits in section 7.2 apply to every page including all effects; a page that exceeds them does not merge.

### 8.6 Portability and operations
- NFR-PORT-1 The build output is host-agnostic (static files and/or OCI image); no host-proprietary runtime APIs in application code.
- NFR-PORT-2 Moving host or domain is a pipeline and config change, not a code change.
- NFR-PORT-3 Zero recurring cost on free tiers until the owner approves spend; no account creation by agents.
- NFR-PORT-4 Previews for every PR; production deploy only after Gate 3.

### 8.7 Security and privacy
- NFR-SEC-1 Security headers, HTTPS only, no secrets in the repo, input validated server-side.
- NFR-SEC-2 Collect the minimum personal data; tell the visitor what is collected and why; analytics without cross-site tracking by default; consent banner only if the chosen tools require one.

## 9. Constraints and assumptions
**Constraints:** free tier only; zero spend without owner approval; the name is a placeholder held in one config file; domain and email are not live, so contact must work without a mailbox; hosting must be movable; quality must not look template-generated (design system only).

**Assumptions** (to confirm; wrong ones change scope):
- A1. Clients are individuals and companies worldwide, served remotely from India (Q8, change request 3).
- A2. The three founders handle enquiries personally and can reply within 1 business day (Q4, Q6).
- A3. The site is informational; no logins or payments at launch. A paid expert session is arranged after first contact (Q19, Q20).
- A4. Launch happens on a free-subdomain URL; domain cutover occurs later as a config and redirect change.
- A5. The monthly enquiry target from Q11 still applies after the service change.
- A6. Owner answers not touched by change request 3 still hold (Q2, Q4–Q10). See section 12.

## 10. Future (not v1)
All marked p3; each needs its own ticket and a PRD change-log entry before work starts. The v1 structure (FR-6, NFR-SEO-5, config-driven content) should not block them.
- Blog / insights and buyer-education content.
- Case-study library once real client work can be shown.
- Client portal and customer apps.
- Online payment for expert sessions.
- Multi-language content.
- Marketing integrations (newsletter, CRM, ads tracking) once domain and email exist.
- Directory profiles as a discovery channel.
- Real mailbox, branded email and a custom domain.

## 11. Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Expert support is the lead promise but its areas, format and price are unknown, so the page reads thin | High | High | Q18–Q20 are the first questions to answer; launch copy limited to confirmed facts |
| "Built by experts" is claimed with no visible proof | High | High | Show real founders and real public work; add stories when real; no unsupported claims (CR-2) |
| Example screens are mistaken for client work | Medium | High | CR-9: visible "example" label on every screen and on the AI demo |
| Pressure to fill gaps with plausible but invented claims | Medium | High | CR-2; PO reviews every content PR; unresolved placeholders block Gate 3 |
| Four services for any client feel unfocused, or individuals and companies feel out of place on each other's path | Medium | Medium | Clear paths per audience, one template per service, walkthrough per audience (section 7) |
| Contact path without a mailbox loses or delays leads | Medium | High | Config-driven destination, Sheet backup, on-page confirmation, test delivery before launch |
| Free-tier limits reached or terms change | Medium | Medium | Portability requirements; monitor usage; documented migration path |
| Few visitors make per-service numbers noisy | High | Low | Judge by counts and owner-tagged quality, not rates |
| Image-rich pages exceed the limits | Medium | Medium | Section 7.2 is enforced in CI; AVIF or WebP; lazy loading below the fold |
| Mobbin-style design reads as a copy of Mobbin | Medium | Medium | Original screens and our own content; PO and design review |
| Scope creep into blog or portal | Medium | Medium | Section 10 and the change-log rule |

## 12. Open questions for the owner
Only the owner can answer these. Each has a working default, so no work waits for them; drafts use placeholders until answered.

**Priority for change request 3:**
- [ ] **Q18 Areas of expertise:** which areas can expert support cover? Default: draft from the brief (software development, cloud, DevOps, AI automation), for you to confirm.
- [ ] **Q19 How a support session works:** format, length, channel, who the expert is and how soon it can start? How many experts can we name, and is it the three founders or a wider group? Default: describe only "book, then we arrange it".
- [ ] **Q20 Pricing:** what is the support session pricing model (per session, hourly, package)? Which "from" prices per service? Q2 chose "from" prices, but no amounts exist yet and the packages they belonged to are gone. Default: state how pricing works, with no amounts.
- [ ] **Q21 Scope of solutions:** what do "solutions for companies" include and exclude? Default: "tailored software and technical solutions", the brief's words, with software, cloud and DevOps as examples.
- [ ] **Q22 Real stories or proof:** any past projects, clients (with permission to name), testimonials, certifications or results we may publish? Default: launch without the stories section, showing this site, public repositories and articles (Q5).
- [ ] **Q23 First call:** is the first call free? Does that differ between a company call and a booked expert? Default: don't say "free".
- [ ] **Q24 Tools strip:** which tools do we really work with, and may we show their logos? Default: text names only, confirmed by you, or leave the strip out.
- [ ] **Q25 Company field on the contact form:** copy deck §6 lists an optional company field, but the NFRs (SEC-11, NFR-SEC-2) limit personal data to name, reply contact and message. Should the form ask for a company name? Default: no, leave it out. The form does ask which service is wanted, which is not personal data; the tech lead should add it to SEC-11.

**Carried over and still open:**
- [ ] **Q4 Booking link (rest answered):** the owner chose HubSpot Meetings (2026-11-09); supply the public Meetings URL for `booking` in the site config. Default: CTAs go to the contact form.
- [ ] **Q6 Founder roles (rest answered):** the role to show beside each founder's name. Default: names only.
- [ ] **Q8 Links (rest answered):** the GitHub and Medium URLs for the site config.
- [ ] **Q17 Testers:** can 3-5 people from the audiences in section 3 try the site on their phones? Default: walkthrough with the founders only.

**Answered (owner answers 2026-10-23 unless noted; earlier wording in `BRIEF.md`):**
- [x] **Q1 Services:** replaced by change request 3 (section 4).
- [x] **Q2 Pricing stance:** "from" prices, fixed price for packages, monthly retainer option. Amounts: Q20.
- [x] **Q3 Target client:** replaced by change request 3: any client, individuals and companies. Clients worldwide, based in India.
- [x] **Q4 Conversion:** HubSpot free CRM receives each enquiry as a contact with the message (HubSpot emails the owner) and HubSpot Meetings handles booking (owner decision 2026-11-09, replacing Cal.com, Telegram and Google Sheet); short form, reply within 1 business day. The CTA label is replaced by section 6.
- [x] **Q5 Proof:** no testimonials or logos at launch. Honest proof: this website and its process, public repositories, founders' articles.
- [x] **Q6 About:** founder-led: Mohammed Farhan, Adnan Sameer, Syed Zoheb Ali. No invented team size. Minimal bios; no name story (change request 3).
- [x] **Q7 Languages:** English only at launch.
- [x] **Q8 Contact:** link GitHub and Medium; show "India · working with clients worldwide"; phone and others deferred.
- [x] **Q9 Legal:** name from config, India (Telangana) jurisdiction, contact path; no registered-entity number until registered.
- [x] **Q10 Analytics:** Cloudflare Web Analytics (free, cookieless, no banner).
- [x] **Q11 Target:** 3–5 qualified enquiries per month in the first quarter, growing after.
- [x] **Q12 Tone:** plain, confident, specific, no buzzwords. Change request 3 adds a professional tone for any client. **Decision:** the line "we automate the boring stuff" is retired, because it no longer covers all four services.
- [x] **Q13, Q14 AI cost optimization, service list:** closed by change request 3.
- [x] **Q15 Theme:** light (change request 3).
- [x] **Q16 Built-by-AI proof:** yes, as honest proof through a public, reviewed repository (change request 1, not replaced).

## Change log
| Date | Change | Why |
|------|--------|-----|
| 2026-10-22 | Initial draft | Ticket #3, Gate 1 input |
| 2026-10-26 | Primary CTA label "Book a free audit call", form button "Send message" | Owner answer Q4; ticket #32 |
| 2026-10-29 | Redesign change request: new positioning, three buyer audiences, AI cost optimization, size limits, Gate 2b sign-off, Q13-Q17 | Owner change request in BRIEF.md; ticket #78 |
| 2026-11-04 | PRD v3. Name-independent positioning and tagline; four services, each with goal, audience, what the client gets and CTA; any client, professional tone; Mobbin-style home and imagery (5.1); limits from change request 3 (7.2). CTAs now "Book a call" and "Book an expert". Added FR-9 (enquiry records the service, needed for conversions per service), CR-7 to CR-9, Q18-Q24; owner answers Q1-Q12 recorded. Removed the unsupported 2% and 20% conversion hypotheses, the 3D and glow requirements, and NFR-PERF-5 (visitor's own load time); NFR-A11Y-4 rewritten. The later "Proof" page is replaced by the stories section on Home; case studies stay future | Owner change request 3; ticket #122 |
