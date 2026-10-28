import { siteOrigin } from '../../../site.config.ts';
import { handleEnquiry } from '../../../src/lib/contact/handler.ts';
import { workerSecurityHeaders } from '../../headers/render.ts';

interface Bindings {
  ENQUIRY_RATE_LIMIT?: {
    limit: (options: { key: string }) => Promise<{ success: boolean }>;
  };
}

export async function workerFetch(
  request: Request,
  env: Bindings,
): Promise<Response> {
  const origin = request.headers.get('origin');
  const headers = new Headers(workerSecurityHeaders);
  headers.set('Vary', 'Origin');
  if (origin === siteOrigin) {
    headers.set('Access-Control-Allow-Origin', siteOrigin);
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
  }
  let response: Response;
  const path = new URL(request.url).pathname;
  if (path === '/health' && request.method === 'GET')
    response = new Response('ok');
  else if (path !== '/enquiry') response = new Response(null, { status: 404 });
  else if (request.method === 'OPTIONS')
    response = new Response(null, {
      status: origin === siteOrigin ? 204 : 403,
    });
  else
    response = await handleEnquiry(request, {
      siteOrigin,
      allowRequest: async () => {
        const ip = request.headers.get('CF-Connecting-IP');
        return Boolean(
          ip &&
          env.ENQUIRY_RATE_LIMIT &&
          (await env.ENQUIRY_RATE_LIMIT.limit({ key: ip })).success,
        );
      },
      // ADR-002: fail visibly until the owner selects the delivery channel (Q4).
      deliver: async () => false,
    });
  for (const [name, value] of response.headers) headers.set(name, value);
  return new Response(response.body, { status: response.status, headers });
}

export default { fetch: workerFetch };
