import { describe, expect, it } from 'vitest';
import { csp, renderPagesHeaders, rules } from './render';

const REQUIRED = [
  'Content-Security-Policy',
  'Strict-Transport-Security',
  'X-Content-Type-Options',
  'Referrer-Policy',
  'Permissions-Policy',
  'Cross-Origin-Opener-Policy',
  'Cross-Origin-Resource-Policy',
];

describe('security headers', () => {
  it('contains every header from docs/security/headers.md', () => {
    const out = renderPagesHeaders();
    for (const h of REQUIRED) expect(out).toContain(`  ${h}: `);
    expect(out).toContain('/_astro/*');
    expect(out).toContain('immutable');
    expect(out).not.toContain('X-XSS-Protection');
  });

  it('CSP has no unsafe-inline, unsafe-eval or wildcard', () => {
    const p = csp('https://enquiry.example.workers.dev');
    expect(p).not.toMatch(/unsafe-inline|unsafe-eval|\*/);
    expect(p).toContain("frame-ancestors 'none'");
    expect(p).toContain(
      "connect-src 'self' https://enquiry.example.workers.dev",
    );
    expect(p).toContain(
      "form-action 'self' https://enquiry.example.workers.dev",
    );
  });

  it('defaults to self-only when no Worker origin is set', () => {
    expect(csp()).toContain("connect-src 'self';");
  });

  it('rejects a non-https or wildcard Worker origin', () => {
    for (const bad of [
      '*',
      'http://a.dev',
      'https://a.dev/path',
      'https://a.dev; script-src *',
    ]) {
      expect(() => csp(bad)).toThrow();
    }
  });

  it('adds X-Robots-Tag only when noindex is requested', () => {
    expect(renderPagesHeaders()).not.toContain('X-Robots-Tag');
    expect(renderPagesHeaders({ noindex: true })).toContain(
      'X-Robots-Tag: noindex, nofollow',
    );
    expect(rules()).toHaveLength(2);
  });
});
