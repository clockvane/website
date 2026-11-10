import {
  serviceOptions,
  type Enquiry,
} from '../../../src/lib/contact/schema.ts';

export interface HubSpotEnv {
  HUBSPOT_PORTAL_ID?: string;
  HUBSPOT_FORM_GUID?: string;
  /** Optional: `eu1` for a portal hosted in HubSpot's EU data centre. */
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

/** Posts one submission to HubSpot. Never retries; never exposes HubSpot's response. */
export async function deliverToHubSpot(
  enquiry: Enquiry,
  env: HubSpotEnv,
  pageUri: string,
  fetcher: typeof fetch = fetch,
): Promise<DeliverResult> {
  const portal = env.HUBSPOT_PORTAL_ID?.trim();
  const guid = env.HUBSPOT_FORM_GUID?.trim();
  if (!portal || !guid || !PORTAL_ID.test(portal) || !FORM_GUID.test(guid))
    return 'unconfigured';
  const host =
    env.HUBSPOT_REGION?.trim() === 'eu1'
      ? 'api-eu1.hsforms.com'
      : 'api.hsforms.com';
  try {
    const response = await fetcher(
      `https://${host}/submissions/v3/integration/submit/${portal}/${guid}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hubspotPayload(enquiry, pageUri)),
        // workerd accepts only "follow" and "manual"; "error" throws a TypeError.
        redirect: 'manual',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    await response.body?.cancel();
    const redirected =
      response.type === 'opaqueredirect' ||
      (response.status >= 300 && response.status < 400);
    return response.ok && !redirected ? 'ok' : 'failed';
  } catch {
    return 'failed';
  }
}
