// Single source of truth for response security headers (docs/security/headers.md).
// Host-neutral data plus a renderer for the Cloudflare Pages / Netlify `_headers` format.
// Other hosts (nginx, firebase.json) get their own renderers from the same data.
// Runs under Node >= 24 type stripping: keep this file free of imports and enums.
//
// CLI: cli.ts. ENQUIRY_WORKER_ORIGIN (optional https origin of the enquiry Worker) is added
// to connect-src and form-action. Never `*`. Unset means 'self' only.

export type HeaderRule = { path: string; headers: Record<string, string> };

const HTTPS_ORIGIN = /^https:\/\/[a-z0-9.-]+(:\d+)?$/i;

export const workerSecurityHeaders = {
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'no-store',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

export function csp(enquiryOrigin?: string): string {
  if (enquiryOrigin !== undefined && !HTTPS_ORIGIN.test(enquiryOrigin)) {
    throw new Error(
      `ENQUIRY_WORKER_ORIGIN must be a bare https origin, got "${enquiryOrigin}"`,
    );
  }
  const extra = enquiryOrigin ? ` ${enquiryOrigin}` : '';
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self'${extra}`,
    `form-action 'self'${extra}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "manifest-src 'self'",
    'upgrade-insecure-requests',
  ].join('; ');
}

export function rules(
  opts: { enquiryOrigin?: string | undefined; noindex?: boolean } = {},
): HeaderRule[] {
  const all: Record<string, string> = {
    'Content-Security-Policy': csp(opts.enquiryOrigin),
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy':
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Cache-Control': 'public, max-age=0, must-revalidate',
  };
  if (opts.noindex) all['X-Robots-Tag'] = 'noindex, nofollow';
  return [
    { path: '/*', headers: all },
    // Cloudflare appends matching rules; hashed assets override the HTML default.
    // The `!` form detaches the inherited value so only the immutable one is sent.
    {
      path: '/_astro/*',
      headers: {
        '! Cache-Control': '',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
  ];
}

export function renderPagesHeaders(
  opts: { enquiryOrigin?: string | undefined; noindex?: boolean } = {},
): string {
  const out: string[] = [];
  for (const r of rules(opts)) {
    out.push(r.path);
    for (const [k, v] of Object.entries(r.headers)) {
      out.push(k.startsWith('! ') ? `  ! ${k.slice(2)}` : `  ${k}: ${v}`);
    }
    out.push('');
  }
  return out.join('\n');
}
