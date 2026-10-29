# PRD — Clockvane company website

| Field | Value |
|-------|-------|
| Owner | product-owner |
| Status | In review (Gate 1 candidate) |
| Last updated | 2026-10-29 |
| Inputs | `docs/product/BRIEF.md` (including "Change request — 2026-10-29: a clean, futuristic, fast website"), `docs/product/competitor-scan.md` (#2) |

Priorities: **p0** = launch blocker, **p1** = needed for a credible v1, **p2** = nice for v1 / first follow-up, **p3** = future.
Requirement IDs (e.g. FR-1) are stable so stories and tests can cite them.

## 1. Problem and opportunity
Small and mid-sized businesses lose hours every week to repetitive manual work (copying data between tools, chasing approvals, manual reports) and often have outdated or no web presence. Hiring a developer is hard to judge: most agency sites use the same vague claims ("tailored", "scalable", "end-to-end"), hide how engagements work, and push several competing calls to action (competitor scan).

Clockvane is a new firm that automates boring business work and builds websites, apps, cloud/DevOps and AI automation. The website must turn a visitor who has a concrete chore or project into a conversation with the owner. A new firm cannot win on logo walls, so it wins on **specificity, plain language and honesty**.

### 1.1 Positioning update (change request, 2026-10-29)
The owner's change request (`docs/product/BRIEF.md` → "Change request — 2026-10-29") replaces the "calm, not flashy" direction and the Gate 2 "Workshop ledger" visual direction. Everything else in the brief and the Gate 1 answers still applies.

- **Our site is our first proof of work.** We sell websites, AI automation, AI cost optimization, and cloud and DevOps. A visitor judges within seconds whether we can build something excellent, and the site is the evidence.
- **Clean, futuristic, not bloated.** Clean first (one idea per section, few elements per screen); futuristic without science fiction (precision, depth, light; no stock robots, glowing brains or purple "AI" gradients); fast (hard limits in section 7.2).
- **Words stay plain** (Q12): futuristic design, plain language, no buzzwords.
- **Motion carries meaning** and is never a distracting loop. It must degrade to a static, still-beautiful site with reduce-motion on, with WebGL unavailable, and without JavaScript.
- **Differentiation:** a visitor comparing agencies should not be able to ask "is this a template?"
- Stack, techniques and visual concepts are not decided here. Design explores three concepts, the owner chooses at Gate 2b, and ADR-004 sets the allowed motion techniques.

## 2. Goals and non-goals
### Goals (measurable; targets in section 7)
- G1. Give a visitor a clear answer in under 10 seconds: what Clockvane does, for whom, and what to do next.
- G2. Produce qualified enquiries through one primary conversion that works with no mailbox.
- G3. Build trust without invented proof: concrete service descriptions, a transparent way of working, and only real proof once supplied.
- G4. Meet the quality bar: Lighthouse ≥ 95 on key pages, WCAG 2.2 AA, unique SEO metadata on every page.
- G5. Be cheap to run now (free tier, zero spend) and cheap to change later (brand, domain, email, host).
- G6. Make the site itself the proof: a visitor of any audience concludes "these people build excellent things" from the site's look, speed and precision, without any invented claim.
- G7. Impress the owner on phone and laptop: sign-off at Gate 2b ("this impresses me").

### Non-goals (v1)
- No blog, case-study library, client portal, user accounts, payments, booking engine or CMS login (see section 9).
- No marketing campaigns, ads or email newsletters (a separate team, after domain and email exist).
- No multi-language site in v1 (unless the owner answers otherwise, Q7).
- No stack, hosting or visual decisions in this document (ADR-001/002/004 and the design system own these).
- No heavy 3D libraries, autoplay video backgrounds, third-party scripts, stock imagery or client-side frameworks for effects.
- No claims about clients, years in business, certifications or statistics until supplied by the owner.

## 3. Audiences
Full personas: `docs/product/personas.md`. Since the 2026-10-29 change request, **three buyer audiences are first-class** (small-business owners, startup founders/CTOs, operations/IT managers) plus agency comparers. The order is not a ranking; the owner confirms priority (Q3). All are hypotheses, not research.

| Audience | Job to be done | What they check in the first 10 seconds | What the site must show them | What scares them off |
|----------|----------------|------------------------------------------|------------------------------|----------------------|
| **Small-business owner** (automation, website) | "Stop wasting my team's hours on repetitive tasks and get a site/app that works." | Will this save me time? Can I trust them? Is it easy to start? | Clear outcomes in plain language, a short path to the free audit call, and a site so polished it answers "can they build mine?" | Jargon, hype, hidden costs, a huge project |
| **Startup founder or CTO** (cloud and DevOps, custom software, AI) | "Get an MVP, platform or cloud setup built by someone senior and modern." | Technical depth, modern engineering, speed | Precision in every detail, technical depth one click away, a site that loads instantly, plain engagement models | Junior-looking presentation, a slow site, a long sales process |
| **Operations or IT manager** (AI automation, AI cost optimization, cloud) | "Integrate systems, cut cloud and AI spend, fix delivery pipelines, add AI without risk." | Risk, security, return on spend | How the work runs, how data stays safe, how costs come down: shown visually, never with invented numbers | Vague capability lists, no security stance, no way to assess quality |
| **Anyone comparing agencies** | "Shortlist two or three firms quickly." | "Is this a template?" | Something they have not seen on other agency sites | Generic layouts and the same vague claims |
| **Owner / future team (internal)** | Keep content, contact details and brand editable without engineers | n/a | Single config file, documented content updates | Hard-coded values scattered around |

## 4. Value proposition and services
Working promise (tagline is a working idea, final copy lives in the copy deck): **"Automation that runs like clockwork."** We take over repetitive business work and build the websites, apps and cloud foundations that keep it running.

Service names and scope below come from the brief and the change request. Detailed offers, packages and deliverables are **not confirmed** (Q1, Q13). All services share one visual language; each may show its own short, meaningful animation (design decides).

| Service | Customer problem | Outcome we promise | Proof we can show |
|---------|------------------|--------------------|-------------------|
| Business process automation | Staff re-key data, chase approvals, build reports by hand | Chores run on their own; fewer errors; time returned to the team | [[PLACEHOLDER: real project or measured outcome, if any]] |
| Websites and web/mobile apps | Outdated or missing site; need a customer-facing or internal app | A fast, accessible site or app that supports the business goal | [[PLACEHOLDER: live sites/apps built; this website itself can be shown as a working example once live]] |
| Custom software development | Off-the-shelf tools do not fit the process | Software fitted to how the business works | [[PLACEHOLDER: past projects, with client permission]] |
| AI cost optimization (new) | Spend on AI usage (and possibly cloud) grows without anyone knowing where it goes or how to reduce it | Lower, better-understood running costs for AI-powered work, without losing the results the business needs. **Exact scope is unconfirmed (Q13); no savings figures may be stated** | [[PLACEHOLDER: owner-supplied method, example or measured result, if any]] |
| Cloud and DevOps | Fragile deployments, rising cloud bills, no automation of releases | Reliable, repeatable delivery and sensible cloud setup | [[PLACEHOLDER: owner's cloud/DevOps credentials or certifications; the brief states the owner is a Cloud/GCP and DevOps engineer]] |
| AI automation | Want AI in a workflow but unsure where it is safe and worth it | Targeted AI steps in real workflows, with human checks where needed | [[PLACEHOLDER: example workflows or results]] |

Differentiators to express (from the competitor scan): plain, honest copy; named boring chores rather than generic lists; one repeated CTA; an explicit way of working and pricing stance; one team across automation, build and cloud.

## 5. Pages (v1) and purpose
Compact on purpose: no repeated sections (competitor scan). Every page needs a unique title, description, OG tags and a sitemap entry (NFR-SEO).

| Page | Purpose | Primary CTA | Priority |
|------|---------|-------------|----------|
| Home | State what we do and for whom, route to services, show the way of working, repeat the CTA | Book a free audit call | p0 |
| Services (overview) | Explain all six services (service list pending Q1/Q13) in concrete terms and link to detail | Book a free audit call | p0 |
| Service detail pages (6, one per service) | Problem, what we do, typical deliverables, how engagements work; searchable landing for each service | Book a free audit call | p1 |
| How we work (process and engagement) | Reduce fear: steps from first call to delivery, engagement models, how scoping and pricing work | Book a free audit call | p1 |
| About | Who is behind Clockvane, why it exists (name story from the brief), expertise. Only owner-supplied facts | Book a free audit call | p1 |
| Contact | Primary conversion page; the contact path from section 6 | Send message | p0 |
| Privacy notice (and cookie info if needed) | Legal basis for collecting enquiries and any analytics | None | p0 |
| 404 page | Recover lost visitors | Back home / contact | p0 |
| Proof (work / testimonials) | Show real work and quotes. **Empty-safe**: must not render or must show an honest "coming soon" until real proof exists | Book a free audit call | p2 |
| FAQ | Answer pricing, timeline, process, ownership questions (can be a section instead of a page) | Book a free audit call | p2 |
| Blog / insights, case studies, client portal | Future | n/a | p3 |

Cross-cutting: global header with primary CTA, footer with legal links, sitemap.xml, robots.txt, social/OG preview image.

## 6. Conversions
- **Primary:** "Book a free audit call": an enquiry (name, contact detail, short description of the chore or project). [[PLACEHOLDER: owner to choose between enquiry form and book-a-call link, Q4]]
- **Secondary:** Read the way of working / services; copy or click a direct contact method once one exists.
- **No-mailbox path:** The enquiry must reach the owner without a Clockvane mailbox. Any delivery mechanism (a form service, notification to the owner's existing channel, or a scheduling link) is chosen in the design phase; the requirement is that the destination is a config value so switching to a real mailbox is a config change, not a rewrite. Visitors must always get an on-page confirmation and an expected response time. [[PLACEHOLDER: promised response time]]
- Exactly one primary CTA label is used site-wide.

## 7. Success metrics
Targets are initial hypotheses for a new site with little traffic; review after 3 months. Analytics must be privacy-respecting and its ID lives in config.

| Metric | Target | How measured |
|--------|--------|--------------|
| Qualified enquiries per month | [[PLACEHOLDER: owner's target; suggested start: 2-4/month in first 3 months]] | Count of submissions, tagged qualified/unqualified by owner |
| Visitor-to-enquiry conversion | ≥ 2% of unique visitors reach the contact page, ≥ 20% of those submit (hypothesis) | Analytics events: contact page view, submit success |
| Lighthouse (Performance, Accessibility, Best Practices, SEO) | ≥ 95 on Home, Services, Contact | CI Lighthouse run |
| Core Web Vitals | Field targets (p75, mobile): LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1. Lab limits are stricter: see 7.2 | Lab in CI, then field data when available |
| Owner sign-off, Gate 2b | Owner says "this impresses me" after viewing the chosen concept on his phone and on a laptop | Gate 2b PR merged by the owner |
| Audience fit | A first-time visitor of each audience in section 3 can state what Clockvane does and what to do next within 10 seconds | Informal walkthrough with real people, where possible [[PLACEHOLDER: owner to supply 3-5 testers]] |
| Accessibility | 0 critical/serious axe violations; keyboard-only walkthrough passes | CI axe checks plus manual check per release |
| Pages with unique title and description | 100% | CI check against sitemap |
| Time to first meaningful reply to enquiry | [[PLACEHOLDER: owner commitment]] | Owner's log |
| Content accuracy | 0 unsupported claims | PO review of every content PR |

### 7.2 "Not bloated" limits (from the change request; lab, mobile, every key page; CI enforces)
| Limit | Value |
|-------|-------|
| Lighthouse (all four categories) | ≥ 95 |
| LCP / CLS / interaction | ≤ 2.0 s / ≤ 0.05 / ≤ 200 ms |
| JavaScript per page (compressed), all effects included | ≤ 35 kB; hero visual code ≤ 15 kB |
| CSS per page (compressed) | ≤ 40 kB |
| Fonts | ≤ 3 files, ≤ 120 kB, self-hosted |
| Whole page (compressed) | ≤ 600 kB |
| Not allowed | client-side frameworks for effects, heavy 3D libraries, autoplay video backgrounds, third-party scripts, stock imagery |
| Effects | animate only transform/opacity; pause off-screen and in background tabs; respect reduce-motion and data-saver; static fallback without WebGL; all content usable without JavaScript |

Architecture records the techniques and updates `docs/architecture/nfr.md` (ADR-004); where it differs from this table, the stricter value wins until the owner agrees otherwise.

## 8. Requirements
### 8.1 Functional
- FR-1 (p0) Every page shows the same primary CTA in the header and in at least one in-page position.
- FR-2 (p0) Contact enquiry captures name, a reply contact, and a message; validates input on client and server; shows success and error states; resists spam without forcing a CAPTCHA by default.
- FR-3 (p0) Enquiry destination and fallback contact methods are configuration, not code.
- FR-4 (p0) Brand name, domain, email, phone, socials and analytics IDs are defined only in the site config file and env vars (CLAUDE.md rule 5).
- FR-5 (p1) Proof components (testimonials, logos, case studies, stats) render nothing when no real data exists.
- FR-6 (p1) Service pages follow one repeatable structure so a sixth service or a case study can be added without redesign.
- FR-7 (p0) Real 404 page; loading, empty and error states for any interactive element.
- FR-8 (p1) Visitors can reach every page within two clicks from Home.

### 8.2 Content
- CR-1 Copy comes from the approved copy deck; plain, benefit-led, specific; no superlatives or unverifiable numbers.
- CR-2 No invented testimonials, clients, team members, years in business, prices or statistics. Unknown facts are `[[PLACEHOLDER: …]]` in drafts and must be resolved or removed before Gate 3.
- CR-3 Each service page names concrete chores or deliverables, not only categories.
- CR-4 A pricing stance statement is present on "How we work" (content depends on Q2).
- CR-5 Placeholder identity (name, domain, email) is easy to swap; no copy depends on the domain or email being live.
- CR-6 Legal pages reflect what is actually collected (enquiry data, analytics).

### 8.3 SEO
- NFR-SEO-1 Each page has a unique title (≤ 60 chars guideline) and description (≤ 160), canonical URL, OG and Twitter tags.
- NFR-SEO-2 sitemap.xml and robots.txt generated; every public page indexed once the production domain is live; non-production environments are `noindex`.
- NFR-SEO-3 Structured data where it fits (Organization, WebSite, Service, BreadcrumbList, ContactPage) with no fabricated fields (no ratings or reviews without real ones).
- NFR-SEO-4 One H1 per page; descriptive link text; images have meaningful alt text.
- NFR-SEO-5 URLs are stable, lowercase and readable, so a later domain change can be handled with redirects.

### 8.4 Accessibility
- NFR-A11Y-1 WCAG 2.2 AA on all pages: semantic landmarks, keyboard operability, visible focus, contrast, target size, reduced-motion respect.
- NFR-A11Y-2 Form fields have labels, error messages are associated and announced, and no information is conveyed by colour alone.
- NFR-A11Y-4 Contrast meets AA on dark surfaces, including text over glow and grid effects; the site is fully keyboard usable; with reduce-motion on it is static and complete.
- NFR-A11Y-3 Works at 200% zoom and on small screens (320 px) without loss of content.

### 8.5 Performance
- NFR-PERF-1 Lighthouse ≥ 95 on key pages and Core Web Vitals targets in section 7 on a mid-range mobile profile.
- NFR-PERF-4 The limits in section 7.2 apply to every page including all effects; a page that exceeds them does not merge.
- NFR-PERF-5 Showing a visitor their own page-load time is welcome, but only if measured in their browser; never a stated or invented figure.
- NFR-PERF-2 Performance budgets (page weight, JS, fonts, images) are set in the NFRs; third-party scripts need a written justification.
- NFR-PERF-3 Pages remain usable without JavaScript for reading content; the CTA has a non-JS fallback where feasible.

### 8.6 Portability and operations
- NFR-PORT-1 The build output is host-agnostic (static files and/or OCI image); no host-proprietary runtime APIs in application code.
- NFR-PORT-2 Moving host or domain is a pipeline and config change, not a code change.
- NFR-PORT-3 Zero recurring cost on free tiers until the owner approves spend; no account creation by agents.
- NFR-PORT-4 Previews for every PR; production deploy only after Gate 3.

### 8.7 Security and privacy
- NFR-SEC-1 Security headers, HTTPS only, no secrets in the repo, input validated server-side.
- NFR-SEC-2 Collect the minimum personal data; tell the visitor what is collected and why; analytics without cross-site tracking by default; consent banner only if the chosen tools require one.

## 9. Constraints and assumptions
**Constraints** (from brief): free tier only; name Clockvane is final but domain (clockvane.com) and email are not live; hosting must be movable; zero spend without owner approval; no mailbox yet, so contact must work without one; quality must not look template-generated (design system only).

**Assumptions** (to confirm; wrong ones change scope):
- A1. Audience is mainly small/mid-sized businesses buying services in one or more markets [[PLACEHOLDER: target region and client size, Q3]].
- A2. English only for v1.
- A3. The owner handles all enquiries personally and can respond within [[PLACEHOLDER: response time]].
- A4. The site is informational; no logins or payments at launch.
- A5. Launch happens on a free-subdomain URL; domain cutover occurs later as a config and redirect change.

## 10. Future (not v1)
All marked p3; each needs its own ticket and a PRD change-log entry before work starts. The v1 structure (FR-6, NFR-SEO-5, config-driven content) should not block them.
- Blog / insights and buyer-education content (guides, checklists, ROI calculator), as seen with peers.
- Case-study library once real client work can be shown.
- Client portal and customer apps.
- Multilingual content.
- Marketing integrations (newsletter, CRM, ads tracking) once domain and email exist.
- Directory profiles (e.g. review/directory sites) as a discovery channel.
- Real mailbox, branded email, and a custom domain.

## 11. Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Owner proof, services and pricing answers arrive late, so the site looks thin | High | High | Placeholders list in section 12; empty-safe proof components; launch copy limited to confirmed facts |
| Pressure to fill gaps with plausible but invented claims | Medium | High | CR-2; PO reviews every content PR; unresolved placeholders block Gate 3 |
| Contact path without a mailbox loses or delays leads | Medium | High | Config-driven destination, on-page confirmation, test delivery before launch, fallback contact method |
| Free-tier limits (builds, forms, bandwidth) reached or terms change | Medium | Medium | Portability requirements; monitor usage; documented migration path |
| Site reads as generic and fails to differentiate | Medium | High | Specific chores in copy; design system review; competitor patterns to avoid |
| Name or domain change after launch | Low | Medium | FR-4, NFR-SEO-5, redirects plan |
| New firm with little proof is not trusted | High | Medium | About page candour, transparent process and pricing stance, show this site's quality as proof |
| Scope creep into blog/portal | Medium | Medium | Section 10 and change-log rule |

## 12. Open questions for the owner
Only the owner can answer these. Do not guess; draft copy uses placeholders until answered.
- [ ] **Q1 Services and packages:** which of the five services do you actually offer now? Any fixed packages or productised entry offers (for example a workflow audit)? What deliverables and typical timelines per service?
- [ ] **Q2 Pricing stance:** publish ranges, "from" prices, how pricing works only, or nothing? Engagement models offered (fixed price, time and materials, retainer)?
- [ ] **Q3 Target client:** which client size, industries and region? Remote only or local presence?
- [ ] **Q4 Primary conversion:** enquiry form, book-a-call link, or both? Which existing channel should enquiries notify you on until a mailbox exists? Promised response time?
- [ ] **Q5 Proof:** any past projects, clients (with permission to name), testimonials, certifications (for example Google Cloud) or measurable results you may publish? If none, confirm we launch without a proof section.
- [ ] **Q6 About:** name and photo to show? Short bio, years of experience, team size (solo or more)? Brand story wording from the brief okay to use?
- [ ] **Q7 Languages:** English only at launch?
- [ ] **Q8 Contact details and socials:** phone, location, business hours, social accounts to link (or none) at launch?
- [ ] **Q9 Legal:** registered company name, address and jurisdiction for the privacy notice and footer; any terms you want published?
- [ ] **Q10 Analytics:** is privacy-friendly traffic analytics acceptable, and which tool, within the free tier?
- [ ] **Q11 Targets:** what monthly enquiry volume would count as success?
- [ ] **Q12 Tone:** any words or styles to avoid or prefer (formal vs. friendly)? Competitors you admire or dislike?

New with the 2026-10-29 change request:
- [ ] **Q13 AI cost optimization scope:** what exactly do you offer (for example reviewing AI model usage and spend, choosing cheaper models, caching, cloud cost review)? What does the customer get, and what is out of scope? May we say anything about expected savings? (Until answered, no figures.)
- [ ] **Q14 Full service list:** is the list of six (business process automation, AI automation, AI cost optimization, cloud and DevOps, websites and apps, custom software) final? Anything to add, merge or drop? (Extends Q1.)
- [ ] **Q15 Theme:** dark-first (the brief's direction), light only, or dark with a light option? Our recommendation: dark-first with a light option if it stays within the size limits.
- [ ] **Q16 Built-by-AI proof:** may the site state that it is built by our own AI engineering team through a public, reviewed repository, as proof of how we work? If yes, may we link the repository, and how prominently?
- [ ] **Q17 Gate 2b testers:** besides you, can 3-5 people from the audiences in section 3 look at the concepts on their phones?

## Change log
| Date | Change | Why |
|------|--------|-----|
| 2026-10-22 | Initial draft | Ticket #3, Gate 1 input |
| 2026-10-29 | Redesign change request: new positioning (site is first proof of work; clean, futuristic, not bloated), three buyer audiences first-class, new service AI cost optimization (scope open, Q13), "not bloated" limits (7.2), Gate 2b owner sign-off, new questions Q13-Q17. Supersedes "calm, not flashy" and the Gate 2 visual direction. Copy deck changes after Gate 2b | Owner change request in BRIEF.md; ticket #78 |
| 2026-10-26 | Primary CTA label is now "Book a free audit call" and the form button "Send message" (previous labels replaced in PRD, sitemap.md, wireframes.md; Contact h1 follows the copy deck) | Owner answer Q4; ticket #32 |
