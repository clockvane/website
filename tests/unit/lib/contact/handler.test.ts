import { describe, expect, it, vi } from 'vitest';
import {
  handleEnquiry,
  type EnquiryServices,
} from '../../../../src/lib/contact/handler';

const origin = 'https://site.example.test';
const data = {
  name: 'Alex',
  reply: 'alex@example.test',
  message: 'Please automate our order entry.',
  website: '',
  started: '1000',
};
function services(overrides: Partial<EnquiryServices> = {}): EnquiryServices {
  return {
    siteOrigin: origin,
    allowRequest: vi.fn(async () => true),
    deliver: vi.fn(async () => true),
    now: () => 5000,
    ...overrides,
  };
}
function request(body: object = data, json = true, headers: HeadersInit = {}) {
  return new Request('https://worker.example.test/enquiry', {
    method: 'POST',
    headers: {
      Origin: origin,
      Accept: json ? 'application/json' : 'text/html',
      'Content-Type': 'application/x-www-form-urlencoded',
      ...headers,
    },
    body: new URLSearchParams(body as Record<string, string>),
  });
}
describe('portable enquiry handler', () => {
  it('confirms only after delivery; delivers validated fields and request id', async () => {
    const deps = services();
    const response = await handleEnquiry(request(), deps);
    expect(response.status).toBe(200);
    expect(deps.deliver).toHaveBeenCalledWith(
      { name: data.name, reply: data.reply, message: data.message },
      expect.any(String),
    );
    expect(await response.json()).toMatchObject({ ok: true });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it('redirects native success and all native failures to fixed config URLs without PII', async () => {
    for (const success of [true, false]) {
      const response = await handleEnquiry(
        request({ ...data, started: '', redirect: 'https://evil.test' }, false),
        services({ deliver: async () => success }),
      );
      expect(response.status).toBe(303);
      expect(response.headers.get('location')).toBe(
        `${origin}/contact/${success ? 'thanks' : 'error'}/`,
      );
      expect(await response.text()).toBe('');
    }
    expect(
      (
        await handleEnquiry(request({ ...data, name: '' }, false), services())
      ).headers.get('location'),
    ).toBe(`${origin}/contact/error/`);
  });
  it.each([
    [{ ...data, name: '' }, 400],
    [{ ...data, website: 'bot' }, 400],
    [{ ...data, started: '4900' }, 400],
    [{ ...data, started: '6000' }, 400],
    [{ ...data, started: 'nonsense' }, 400],
    [{ ...data, message: 'x'.repeat(11000) }, 413],
  ])(
    'rejects invalid/spam/oversize input without delivery',
    async (body, status) => {
      const deps = services();
      expect((await handleEnquiry(request(body), deps)).status).toBe(status);
      expect(deps.deliver).not.toHaveBeenCalled();
    },
  );
  it('rejects hostile origins, methods, media types and malformed JSON', async () => {
    expect(
      (
        await handleEnquiry(
          request(data, true, { Origin: 'https://evil.test' }),
          services(),
        )
      ).status,
    ).toBe(403);
    expect((await handleEnquiry(new Request(origin), services())).status).toBe(
      405,
    );
    expect(
      (
        await handleEnquiry(
          request(data, true, { 'Content-Type': 'text/plain' }),
          services(),
        )
      ).status,
    ).toBe(415);
    expect(
      (
        await handleEnquiry(
          request(data, true, { 'Content-Type': 'application/json' }),
          services(),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await handleEnquiry(
          request(data, true, { 'Content-Length': '11000' }),
          services(),
        )
      ).status,
    ).toBe(413);
    expect(
      (await handleEnquiry(request(data, true, { Origin: 'null' }), services()))
        .status,
    ).toBe(403);
  });
  it('supports JSON and same-origin Referer fallback', async () => {
    const input = new Request(origin, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Referer: `${origin}/contact/`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    expect((await handleEnquiry(input, services())).status).toBe(200);
  });
  it('returns generic errors for rate limits, failed or thrown delivery', async () => {
    const blocked = services({ allowRequest: async () => false });
    expect((await handleEnquiry(request(), blocked)).status).toBe(429);
    expect(blocked.deliver).not.toHaveBeenCalled();
    for (const deliver of [
      async () => false,
      async () => {
        throw Error('secret destination');
      },
    ]) {
      const response = await handleEnquiry(request(), services({ deliver }));
      expect(response.status).toBe(502);
      expect(await response.text()).not.toMatch(/secret|Alex|example/);
    }
  });
});
