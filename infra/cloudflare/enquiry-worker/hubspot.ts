import {
  serviceOptions,
  type Enquiry,
} from '../../../src/lib/contact/schema.ts';

export interface HubSpotEnv {
  HUBSPOT_PORTAL_ID?: string;
  HUBSPOT_FORM_GUID?: string;
  /**
   * Optional: `eu1` for a portal hosted in HubSpot's EU data centre, which uses a regional
   * submission host. US data centres (na1, na2, …) all use the default `api.hsforms.com`, so
   * this stays unset for them. See docs/devops/cicd.md (Enquiry Worker).
   */
  HUBSPOT_REGION?: string;
}

const TIMEOUT_MS = 5000;
const PORTAL_ID = /^\d{1,12}$/;
const FORM_GUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type DeliverResult = 'ok' | 'unconfigured' | 'failed';

/** Builds the HubSpot submission body. The service goes at the top of the message. */
export function hubspotPayload(enquiry: Enquiry, pageUri: string) {
  const service =
    serviceOptions.find(({ value }) => value === enquiry.service)?.label ??
    enquiry.service;
  const isEmail = enquiry.reply.includes('@');
  const lines = [`Service: ${service}`];
  if (!isEmail) lines.push(`Reply by phone: ${enquiry.reply}`);
  lines.push('', enquiry.message);
  return {
    fields: [
      ...(isEmail ? [{ name: 'email', value: enquiry.reply }] : []),
      { name: 'firstname', value: enquiry.name },
      { name: 'message', value: lines.join('\n') },
    ],
    context: { pageUri, pageName: 'Contact' },
  };
}

/** HubSpot's machine-readable error codes only (never messages, which can echo submitted values). */
async function errorTypes(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      errors?: { errorType?: unknown }[];
    };
    const types = (body.errors ?? [])
      .map(({ errorType }) => errorType)
      .filter(
        (t): t is string => typeof t === 'string' && /^[A-Z_]{1,40}$/.test(t),
      );
    return types.length ? ` ${[...new Set(types)].join(',')}` : '';
  } catch {
    return '';
  }
}

/**
 * Posts one submission to HubSpot. Never retries; never exposes HubSpot's response to the
 * visitor. `report` receives a short outcome (`status 404`, `status 400 REQUIRED_FIELD`,
 * `exception TimeoutError`) that the staging Worker returns as a diagnostic header.
 */
export async function deliverToHubSpot(
  enquiry: Enquiry,
  env: HubSpotEnv,
  pageUri: string,
  fetcher: typeof fetch = fetch,
  report: (detail: string) => void = () => {},
): Promise<DeliverResult> {
  const portal = env.HUBSPOT_PORTAL_ID?.trim();
  const guid = env.HUBSPOT_FORM_GUID?.trim();
  if (!portal || !guid || !PORTAL_ID.test(portal) || !FORM_GUID.test(guid)) {
    report('unconfigured');
    return 'unconfigured';
  }
  // Only EU-hosted portals (eu1) use a regional host; every US data centre, na2 included, uses
  // the default host. HubSpot Forms API: https://developers.hubspot.com/docs/api-reference/legacy/marketing/forms/v3-legacy
  const host =
    env.HUBSPOT_REGION?.trim() === 'eu1'
      ? 'api-eu1.hsforms.com'
      : 'api.hsforms.com';
  try {
    const response = await fetcher(
      `https://${host}/submissions/v3/integration/submit/${portal}/${guid}`,
      {
        method: 'POST',
        // Worker subrequests carry no User-Agent by default; edge firewalls may refuse those.
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'enquiry-worker/1.0',
        },
        body: JSON.stringify(hubspotPayload(enquiry, pageUri)),
        // workerd accepts only "follow" and "manual"; "error" throws a TypeError.
        redirect: 'manual',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    const redirected =
      response.type === 'opaqueredirect' ||
      (response.status >= 300 && response.status < 400);
    const ok = response.ok && !redirected;
    if (ok || redirected) {
      await response.body?.cancel();
      report(`${redirected ? 'redirect' : 'status'} ${response.status}`);
    } else report(`status ${response.status}${await errorTypes(response)}`);
    return ok ? 'ok' : 'failed';
  } catch (error) {
    const name = error instanceof Error ? error.name : 'unknown';
    report(`exception ${/^\w{1,40}$/.test(name) ? name : 'unknown'}`);
    return 'failed';
  }
}
