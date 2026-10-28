import { describe, expect, it, vi } from 'vitest';
import { workerFetch } from '../../../infra/cloudflare/enquiry-worker';
import { siteOrigin } from '../../../site.config';

describe('Worker boundary', () => {
  it('sets security headers on every route, including errors and health', async () => {
    for (const path of ['/health', '/unknown', '/enquiry']) {
      const response = await workerFetch(
        new Request(`https://worker.example.test${path}`),
        {},
      );
      expect(response.headers.get('content-security-policy')).toBe(
        "default-src 'none'; frame-ancestors 'none'",
      );
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    }
  });
  it('allows CORS only for the configured site', async () => {
    for (const origin of [siteOrigin, 'https://evil.test']) {
      const response = await workerFetch(
        new Request('https://worker.example.test/enquiry', {
          method: 'OPTIONS',
          headers: { Origin: origin },
        }),
        {},
      );
      expect(response.status).toBe(origin === siteOrigin ? 204 : 403);
      expect(response.headers.get('access-control-allow-origin')).toBe(
        origin === siteOrigin ? siteOrigin : null,
      );
      expect(
        response.headers.get('access-control-allow-credentials'),
      ).toBeNull();
    }
  });
  it('uses the edge IP limiter and fails closed without delivery configuration', async () => {
    const limit = vi.fn(async () => ({ success: true }));
    const request = () =>
      new Request('https://worker.example.test/enquiry', {
        method: 'POST',
        headers: {
          Origin: siteOrigin,
          Accept: 'application/json',
          'CF-Connecting-IP': '192.0.2.1',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          name: 'Alex',
          reply: 'alex@example.test',
          message: 'Please automate order entry.',
        }),
      });
    expect(
      (await workerFetch(request(), { ENQUIRY_RATE_LIMIT: { limit } })).status,
    ).toBe(502);
    expect(limit).toHaveBeenCalledWith({ key: '192.0.2.1' });
    expect((await workerFetch(request(), {})).status).toBe(429);
  });
});
