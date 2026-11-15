# Evidence: desktop Lighthouse for #222 (type roles), PR #233

Commit measured: `632e8ef6d7a89d773c58a15fd860548eb108116e` (PR #233 head), built with `npm run build`
and served by `npm run preview` on port 4401.

Command:

```
CHROME_PATH=<Playwright Chromium 1248> PORT=4401 LH_PRESET=desktop \
  npx lhci autorun --config tests/e2e/lighthouserc.cjs
```

Three runs per URL, representative run shown. Desktop preset. Target: every category at least 95.

| URL | Performance | Accessibility | Best practices | SEO | LCP (ms, 3 runs) | CLS |
|---|---|---|---|---|---|---|
| / | 100 | 100 | 96 | 100 | 257 to 267 | 0.002 |
| /about/ | 100 | 100 | 96 | 100 | 252 to 255 | 0 |
| /how-we-work/ | 100 | 100 | 96 | 100 | 257 to 259 | 0 |
| /contact/ | 100 | 100 | 96 | 100 | 254 to 279 | 0 |
| /privacy/ | 100 | 100 | 96 | 100 | 247 to 262 | 0 |
| /services/ | 100 | 100 | 96 | 100 | 350 to 374 | 0 |
| /services/expert-support/ | 100 | 100 | 96 | 100 | 252 to 266 | 0 |
| /services/ai-automation/ | 100 | 100 | 96 | 100 | 251 to 266 | 0 |
| /services/website-creation/ | 100 | 100 | 96 | 100 | 249 to 261 | 0 |
| /services/solutions/ | 100 | 100 | 96 | 100 | 251 to 257 | 0 |

All 30 runs passed the assertions in `tests/e2e/lighthouserc.cjs` (exit code 0).

## Best practices at 96 (not caused by #222)

The same 96 appears in the mobile run. Its only failing audit is `errors-in-console`. The single
console error is a 404 for `/favicon.ico`: the site ships no favicon. This is a visitor-facing gap
(a missing tab icon and a 404 on every page), but it is a brand asset decision, not a type change,
so it is recorded here and not fixed in #233. Follow-up: add a favicon through the site config and
the assets pipeline (new ticket).

Page weight (desktop, representative run): home 229.8 kB total, other pages 41 to 124 kB.
