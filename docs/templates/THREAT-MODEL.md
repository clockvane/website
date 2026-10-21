# Threat model

## System and data flows
Mermaid diagram: visitor → CDN/host → site; contact form → handler → destination; developer →
GitHub → CI → host. Mark trust boundaries.

## Assets
Site integrity, lead data (PII), hosting/GitHub accounts and tokens, brand reputation.

## Threats (STRIDE-lite)
| # | Component | Threat | S/T/R/I/D/E | Likelihood | Impact | Mitigation | Ticket |
|---|-----------|--------|-------------|------------|--------|------------|--------|

## Baseline controls
- Security headers + CSP (see headers.md)
- Form: server-side validation, spam protection, rate limits, no PII in logs
- Supply chain: pinned action SHAs, least-privilege tokens, Dependabot, lockfiles, secret scanning
- Accounts: 2FA on GitHub and host, environment-scoped secrets, production approval

## Residual risks accepted by the owner
