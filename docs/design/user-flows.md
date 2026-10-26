# User flows

Status: draft for Gate 2 · Owner: UX/UI Designer · Ticket: #12
Pages and URLs: `sitemap.md`. Personas: `docs/product/personas.md`.

## 1. Primary conversion: Start a conversation

PRD section 6: one primary conversion, an enquiry (name, reply contact, short description). It must work without a Clockvane mailbox and always give an on-page confirmation with an expected response time.
`[[PLACEHOLDER: Q4 form vs book-a-call link; promised response time]]`

```mermaid
flowchart TD
  L["Landing page<br/>(search, referral, direct)"] --> R{"Finds own chore<br/>or need?"}
  R -->|"yes"| CTA["Clicks Start a conversation<br/>(header, hero or closing band)"]
  R -->|"not sure"| EX["Reads Services or How we work"]
  EX --> CTA
  CTA --> CF["Contact page<br/>/contact/"]
  CF --> FILL["Fills name, reply contact,<br/>message"]
  FILL --> SUB["Submits"]
  SUB --> VAL{"Valid?"}
  VAL -->|"no (JS)"| ERR["Inline errors, summary focused,<br/>input kept"]
  VAL -->|"no (native check, no JS)"| NAT["Browser shows its own<br/>field messages"]
  NAT --> FILL
  ERR --> FILL
  VAL -->|"yes"| SEND{"Delivery<br/>succeeds?"}
  SEND -->|"no (JS)"| FAIL["Error message with<br/>fallback contact, input kept"]
  SEND -->|"no (no JS, 303)"| EP["/contact/error/ static page:<br/>text not kept, fallback contact,<br/>link back to form"]
  EP --> CF
  FAIL --> FILL
  SEND -->|"yes"| OK["Confirmation with expected<br/>response time and next steps"]
  OK --> NEXT["Optional: read How we work"]
```

Notes:
- Entry points: header button (every page), hero (Home), closing CTA band (every content page), footer band.
- Spam resistance is invisible (honeypot and server checks), no CAPTCHA by default (FR-2).
- Without JS the form posts normally after native constraint validation (`required`, `type="email"`, `maxlength`). The enquiry handler (Worker, separate origin) answers `303` to `/contact/thanks/` on success, or to the static `noindex` page `/contact/error/` if the server rejects the submission or delivery fails. That page says the text was not kept, shows the fallback contact and links back to the form. Redirect targets are fixed absolute URLs built from `site.config.ts` url, never from request fields. Only the JS path keeps input.
- Analytics events (success-metrics): contact page view, submit success. Funnel: CTA click, contact view, submit.

## 2. Persona journeys

```mermaid
flowchart LR
  subgraph P1["P1 Owner-operator"]
    a1["Search for a chore"] --> a2["Home or service page"] --> a3["How we work<br/>(cost and process)"] --> a4["Contact"]
  end
  subgraph P2["P2 Ops or IT manager"]
    b1["Search for technical need"] --> b2["Service detail<br/>(Cloud and DevOps)"] --> b3["How we work<br/>(security, handover)"] --> b4["Contact"]
  end
  subgraph P3["P3 Technical founder"]
    c1["Referral or community"] --> c2["Home (judges site quality)"] --> c3["About<br/>(who builds it)"] --> c4["Contact"]
  end
```

## 3. Secondary flows

```mermaid
flowchart TD
  H["Home"] -->|"Services in nav or hero list"| S["Services overview"]
  S -->|"pick a service"| D["Service detail"]
  D -->|"Start a conversation"| C["Contact"]
  D -->|"See how engagements work"| W["How we work"]
  W -->|"Start a conversation"| C
  H -->|"About in nav"| A["About"]
  A -->|"Start a conversation"| C
  C -->|"copy or click fallback contact<br/>(only when configured)"| X["Email or scheduling link"]
```

## 4. Recovery: 404

```mermaid
flowchart TD
  U["Unknown or old URL"] --> N["404 page<br/>plain message"]
  N -->|"Back home"| H["Home"]
  N -->|"Browse services"| S["Services"]
  N -->|"Start a conversation"| C["Contact"]
```

## 5. Navigation structure

```mermaid
flowchart TD
  subgraph HDR["Header, all pages"]
    h1["Logo to Home"]
    h2["Services with five-item list"]
    h3["How we work"]
    h4["About"]
    h5["Start a conversation (button)"]
  end
  subgraph FTR["Footer, all pages"]
    f0["Closing CTA band<br/>(not on Contact, Enquiry sent, Enquiry failed, legal pages or 404)"]
    f1["Services: five links"]
    f2["Company: How we work, About, Contact"]
    f3["Privacy notice, copyright from config"]
  end
```

Mobile: header collapses to logo, CTA button and a menu button below 768 px. The menu is a no-JS `<details>` disclosure (or a button with `aria-expanded`) opening a full-width panel with the same items in the same order, closed by the menu button. Focus order follows the panel and is not trapped; Escape returns focus to the menu button (optional JS enhancement, not in v1). The CTA button sits inside the panel and, from 480 px up, also beside the menu button (wireframes.md §0; below 480 px is a Gate 2 decision, update this line to match the outcome).

## 6. Interactive states per flow step

| Step | Loading | Empty | Error |
|------|---------|-------|-------|
| Contact submit | Button "Sending…", disabled, `aria-busy` | Required fields marked; no placeholder-only labels | Inline field errors plus focused summary; delivery failure keeps input and shows fallback contact |
| Confirmation | Inline message with focus moved to it (JS) or thanks page (no JS) | n/a | Direct visit to `/contact/thanks/` shows the same neutral confirmation text without claiming a submission; link back to Contact |
| Fallback contact | n/a | Hidden if not configured | n/a |
| Menu (mobile) | n/a | n/a | Without JS, the menu is a visible link list under the logo |
