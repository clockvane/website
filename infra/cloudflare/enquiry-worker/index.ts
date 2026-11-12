import { siteOrigin } from '../../../site.config.ts';
import { handleEnquiry } from '../../../src/lib/contact/handler.ts';
import { workerSecurityHeaders } from '../../headers/render.ts';
import { deliverToHubSpot, type HubSpotEnv } from './hubspot.ts';

interface Bindings extends HubSpotEnv {
  /** `staging` on the enquiry-staging Worker (wrangler.toml [env.staging.vars]); unset in production. */
  SITE_ENV?: string;
  ENQUIRY_RATE_LIMIT?: {
    limit: (options: { key: string }) => Promise<{ success: boolean }>;
  };
}

/**
 * The one site origin this Worker serves: production accepts only the configured site, the
 * staging Worker only the Pages `staging` branch alias of that same domain. Derived from
 * site.config.ts (rule 5) and never read from the request, so CORS and the no-JS redirects
 * stay fixed per environment.
 */
export function allowedOrigin(env: Pick<Bindings, 'SITE_ENV'>): string {
  if (env.SITE_ENV?.trim() !== 'staging') return siteOrigin;
  const site = new URL(siteOrigin);
  return `${site.protocol}//staging.${site.host}`;
}

export async function workerFetch(
  request: Request,
  env: Bindings,
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  const site = allowedOrigin(env);
  const origin = request.headers.get('origin');
  const headers = new Headers(workerSecurityHeaders);
  headers.set('Vary', 'Origin');
  if (origin === site) {
    headers.set('Access-Control-Allow-Origin', site);
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
  }
  // Staging only: HubSpot's outcome as a header, so a failed test enquiry can be diagnosed
  // without logs. Production never sets it.
  let upstream: string | undefined;
  const staging = env.SITE_ENV?.trim() === 'staging';
  let response: Response;
  const path = new URL(request.url).pathname;
  if (path === '/health' && request.method === 'GET')
    response = new Response('ok');
  else if (path !== '/enquiry') response = new Response(null, { status: 404 });
  else if (request.method === 'OPTIONS')
    response = new Response(null, {
      status: origin === site ? 204 : 403,
    });
  else
    response = await handleEnquiry(request, {
      siteOrigin: site,
      allowRequest: async () => {
        const ip = request.headers.get('CF-Connecting-IP');
        return Boolean(
          ip &&
          env.ENQUIRY_RATE_LIMIT &&
          (await env.ENQUIRY_RATE_LIMIT.limit({ key: ip })).success,
        );
      },
      // HubSpot free CRM (PRD Q4). Missing secrets answer 503, HubSpot failure 502.
      deliver: async (enquiry) => {
        const result = await deliverToHubSpot(
          enquiry,
          env,
          new URL('/contact/', site).href,
          fetcher,
          (detail) => (upstream = detail),
        );
        return result === 'unconfigured' ? result : result === 'ok';
      },
    });
  for (const [name, value] of response.headers) headers.set(name, value);
  if (staging && upstream) {
    headers.set('X-Enquiry-Upstream', upstream);
    if (origin === site)
      headers.set('Access-Control-Expose-Headers', 'X-Enquiry-Upstream');
  }
  return new Response(response.body, { status: response.status, headers });
}

export default { fetch: workerFetch };
