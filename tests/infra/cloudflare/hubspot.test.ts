import { describe, expect, it, vi } from 'vitest';
import { workerFetch } from '../../../infra/cloudflare/enquiry-worker';
import { siteOrigin } from '../../../site.config';

const GUID = '0a1b2c3d-1111-2222-3333-444455556666';
const secrets = { HUBSPOT_PORTAL_ID: '12345', HUBSPOT_FORM_GUID: GUID };
const limiter = { limit: async () => ({ success: true }) };

function post(fields: Record<string, string> = {}) {
  return new Request('https://worker.example.test/enquiry', {
    method: 'POST',
    headers: {
      Origin: siteOrigin,
      Accept: 'application/json',
      'CF-Connecting-IP': '192.0.2.1',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Alex',
      reply: 'alex@example.test',
      service: 'ai-automation',
      message: 'Please automate order entry.',
      ...fields,
    }),
  });
}
const env = (extra = {}) => ({
  ENQUIRY_RATE_LIMIT: limiter,
  ...secrets,
  ...extra,
});

describe('HubSpot delivery', () => {
  it('submits one contact with the service at the top of the message', async () => {
    const fetcher = vi.fn(async () => new Response('{}', { status: 200 }));
    const response = await workerFetch(post(), env(), fetcher);
    expect(response.status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(
      `https://api.hsforms.com/submissions/v3/integration/submit/12345/${GUID}`,
    );
    const body = JSON.parse(init.body as string);
    expect(body.fields).toEqual([
      { name: 'email', value: 'alex@example.test' },
      { name: 'firstname', value: 'Alex' },
      {
        name: 'message',
        value: expect.stringMatching(
          /^Service: .+\n\nPlease automate order entry\.$/,
        ),
      },
    ]);
    expect(body.context.pageUri).toBe(`${siteOrigin}/contact/`);
  });
  it('uses the EU host when configured and keeps a phone reply in the message', async () => {
    const fetcher = vi.fn(async () => new Response('{}'));
    await workerFetch(
      post({ reply: '+44 20 7946 0000' }),
      env({ HUBSPOT_REGION: 'eu1' }),
      fetcher,
    );
    const [url, init] = fetcher.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toContain('https://api-eu1.hsforms.com/');
    const body = JSON.parse(init.body as string);
    expect(body.fields.map((f: { name: string }) => f.name)).toEqual([
      'firstname',
      'message',
    ]);
    expect(body.fields[1].value).toContain('Reply by phone: +44 20 7946 0000');
  });
  it('sends nothing for invalid or spam submissions', async () => {
    const fetcher = vi.fn(async () => new Response('{}'));
    expect(
      (await workerFetch(post({ reply: 'nope' }), env(), fetcher)).status,
    ).toBe(400);
    expect(
      (await workerFetch(post({ website: 'http://spam.test' }), env(), fetcher))
        .status,
    ).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('answers 503 and sends nothing when secrets are missing or malformed', async () => {
    const fetcher = vi.fn(async () => new Response('{}'));
    for (const e of [
      { ENQUIRY_RATE_LIMIT: limiter },
      env({ HUBSPOT_PORTAL_ID: '../x' }),
      env({ HUBSPOT_FORM_GUID: 'bad' }),
    ])
      expect((await workerFetch(post(), e, fetcher)).status).toBe(503);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('uses redirect "manual" (workerd rejects "error") and treats a redirect as a failure', async () => {
    const ok = vi.fn(async () => new Response('{}'));
    expect((await workerFetch(post(), env(), ok)).status).toBe(200);
    const init = (ok.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(init.redirect).toBe('manual');
    const redirect = vi.fn(
      async () =>
        new Response(null, {
          status: 302,
          headers: { Location: 'https://x.example' },
        }),
    );
    expect((await workerFetch(post(), env(), redirect)).status).toBe(502);
  });
  it('answers 502 without echoing HubSpot on non-2xx, network error or timeout, with no retry', async () => {
    for (const fetcher of [
      vi.fn(async () => new Response('secret hubspot detail', { status: 400 })),
      vi.fn(async () => {
        throw new TypeError('network');
      }),
      vi.fn(async () => {
        throw new DOMException('timeout', 'TimeoutError');
      }),
    ]) {
      const response = await workerFetch(post(), env(), fetcher);
      expect(response.status).toBe(502);
      expect(await response.text()).not.toContain('hubspot');
      expect(fetcher).toHaveBeenCalledTimes(1);
    }
  });
});
