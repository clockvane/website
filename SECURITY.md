# Security policy

## Reporting a vulnerability

Please do **not** open a public issue or pull request for a security problem.

Report it privately through GitHub instead: open the repository's **Security** tab and choose
**Report a vulnerability** (<https://github.com/clockvane/website/security/advisories/new>). Only the
owner sees the report. Include what you found, how to reproduce it, and the impact you expect.

## Scope

This repository: the website's code, its build and deploy pipelines, the host configuration in `infra/`
and the security headers. Third-party services (Cloudflare, GitHub) have their own disclosure programmes.

## Supported versions

Only the current production deployment (the latest release tag) receives fixes.

## How reports are handled

The owner confirms the report, a fix is prepared in a private security advisory, released as a patch
version, and the advisory is published afterwards — crediting the reporter if they wish.
