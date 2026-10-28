# Microcopy

Status: draft for Gate 2 · Owner: content-writer · Ticket: #23
Rules: `voice-and-tone.md` sections 8 and 11. Errors say what happened and how to fix it, with no blame. Brand and contact values are tokens.

## 1. Contact form (`contact.form`)

| Field | Label | Helper text | Required |
|-------|-------|-------------|----------|
| Name | Your name | We use this only to reply to you. | yes |
| Reply contact | Email or phone | Where should we reply? [[PLACEHOLDER: Q4 email only, or email or phone; wireframe default is email or phone]] | yes |
| Message | What would you like off your plate? | A sentence or two is enough. For example: "We re-type orders into our accounts tool every day." | yes |
| Company | Company (optional) | Helps us prepare for the call. | no |
| Honeypot | (hidden, no label shown to people or assistive tech) | | n/a |

Buttons: **Send message** · loading: **Sending…** · back link on the error page: **Back to the form**.
Character counter (JS only): "{n} characters left". Near the limit: "{n} characters left. Shorten your message or split it in two."

### Validation messages
Shown under the field and listed in the error summary.

| Case | Message |
|------|---------|
| Summary heading | There is a problem |
| Summary intro | Fix these to send your message: |
| Name empty | Enter your name. |
| Name too long | Shorten your name to {max} characters or fewer. |
| Name has prohibited characters | Remove < and > from your name and keep it on one line. Retype any pasted text to remove hidden characters. |
| Reply contact empty | Enter an email address or phone number so we can reply. |
| Email invalid | Enter an email address like name@example.com. |
| Phone invalid | Enter a phone number with the country code, like +91 98765 43210. |
| Reply contact too long | Shorten this to {max} characters or fewer. |
| Reply contact has prohibited characters | Remove < and > from your email or phone and keep it on one line. Retype any pasted text to remove hidden characters. |
| Message empty | Tell us a little about the work you want off your plate. |
| Message too short | Add a few more words so we can understand the task. [[PLACEHOLDER: engineering to set the minimum, suggest 10 characters]] |
| Message too long | Shorten your message to {max} characters or fewer. You can send details later. |
| Message has prohibited characters | Replace < and > in your message with words such as “less than” or “over”. Retype any pasted text to remove hidden characters. |
| Company too long | Shorten the company name to {max} characters or fewer. |

Prohibited characters are `<`, `>` and hidden control characters. Name and reply
contact must stay on one line; messages may contain line breaks and tabs. These
field errors explain how to correct the text; the generic spam message below is
reserved for honeypot and timing checks.

### Status and results
| State | Copy |
|-------|------|
| Sending (live region) | Sending your message. |
| Success (inline, JS) | h2: Message sent. Body: Thanks, {name}. We have your message and will reply within 1 business day. |
| Success (thanks page) | See `copy-deck.md` section 7. |
| Delivery failure banner (JS) | We could not send your message. Your text is still here. Try again, or reach us at {{brand.email}}. [[PLACEHOLDER: hide the email clause if the config has no email]] |
| Delivery failure, no fallback | We could not send your message. Your text is still here. Please try again in a few minutes. |
| Failure page (no JS) | See `copy-deck.md` section 8. |
| Offline | You seem to be offline. Check your connection and try again. Your text is still here. |
| Too many attempts | You have sent several messages in a short time. Please wait a few minutes and try again. |
| Spam check failed | We could not send your message. Please try again. |

Never say "Invalid input", "Error 422" or show a code.

## 2. Navigation and accessibility strings
| Item | Copy |
|------|------|
| Skip link | Skip to main content |
| Menu button | Menu (open) · Close (open state) |
| Services disclosure | Show services · Hide services |
| Breadcrumb label | Breadcrumb |
| Footer nav labels | Services · Company |
| Current page (screen reader) | Current page |
| External link hint | Opens in a new tab |
| Copyright | © {year} {{brand.name}} |
| Location line | India · working with clients worldwide |
| Logo link | {{brand.name}} home |

## 3. Page states
| State | Copy |
|-------|------|
| 404 h1 | We could not find that page |
| 404 body | The link may be old, or the page may have moved. Try one of these instead. |
| 404 links | Back to home · Services · Contact |
| Empty proof section | Renders nothing. No heading, no "coming soon". |
| Empty contact fallback | Renders nothing. Do not mention a missing email. |
| Empty socials | Renders nothing. |
| Image failed to load | Alt text shows; no extra message. |
| Page loading | None. Pages are static HTML. |
| Script off | Nothing shown. The form works with a normal page reload. |

## 4. Consent and analytics
The default design uses Cloudflare Web Analytics, which does not use cookies (owner Q10), so **no cookie banner is shown**. Keep this line in the footer or privacy notice:

- Footer link: Privacy notice
- Privacy note under the form: We use your details only to reply to you. Read our privacy notice.
- Analytics line (privacy notice): This site uses privacy-friendly analytics without cookies. We see page views and country, not who you are.

If a tool that needs consent is added later, use this banner (not built at launch):
- Heading: Cookies
- Body: We would like to use cookies to count visits. This is optional. [[PLACEHOLDER: only if consent is required, wording to be checked against the final tool and law]]
- Buttons: Accept analytics · Decline

## 5. Open items
- Q4: email only or email or phone for the reply field; notification channel wording
- Minimum and maximum field lengths (engineering)
- Fallback contact availability
