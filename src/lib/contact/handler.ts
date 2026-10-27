import { validateEnquiry, type Enquiry } from './schema.ts';

export interface EnquiryServices {
  siteOrigin: string;
  allowRequest: () => Promise<boolean>;
  deliver: (enquiry: Enquiry, requestId: string) => Promise<boolean>;
  now?: () => number;
}
const MAX_BYTES = 10_240;

/** Bounded before decoding; Content-Length alone is not trustworthy. */
async function readBody(request: Request): Promise<string | undefined> {
  if (Number(request.headers.get('content-length')) > MAX_BYTES) return;
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_BYTES) {
      await reader.cancel();
      return;
    }
    chunks.push(value);
  }
  const body = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(body);
}

/** No storage, logging, host APIs or delivery secrets. Dependencies fail closed. */
export async function handleEnquiry(
  request: Request,
  services: EnquiryServices,
): Promise<Response> {
  const json = request.headers.get('accept')?.includes('application/json');
  const requestId = crypto.randomUUID();
  const respond = (status: number, payload: object = {}) => {
    const headers = { 'Cache-Control': 'no-store', 'X-Request-Id': requestId };
    if (json) return Response.json(payload, { status, headers });
    return new Response(null, {
      status: 303,
      headers: {
        ...headers,
        Location: new URL(
          status === 200 ? '/contact/thanks/' : '/contact/error/',
          services.siteOrigin,
        ).href,
      },
    });
  };
  if (request.method !== 'POST')
    return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  try {
    const origin =
      request.headers.get('origin') ??
      new URL(request.headers.get('referer') ?? 'https://invalid.invalid')
        .origin;
    if (origin !== services.siteOrigin) return respond(403);
    if (!(await services.allowRequest()))
      return respond(429, { reason: 'rate' });
    const type = request.headers.get('content-type')?.split(';')[0]?.trim();
    if (
      type !== 'application/x-www-form-urlencoded' &&
      type !== 'application/json'
    )
      return respond(415);
    const body = await readBody(request);
    if (body === undefined) return respond(413);
    let input: unknown;
    try {
      input =
        type === 'application/json'
          ? JSON.parse(body)
          : Object.fromEntries(new URLSearchParams(body));
    } catch {
      return respond(400);
    }
    const parsed = validateEnquiry(input);
    if (!parsed.ok) return respond(400, { fields: parsed.fields });
    const controls = input as Record<string, unknown>;
    const started = controls['started'];
    // Static no-JS pages cannot supply a render-time clock. Rate limiting and
    // honeypot still apply; the client clock is only an additional bot signal.
    if (
      controls['website'] ||
      (started !== undefined &&
        started !== '' &&
        (typeof started !== 'string' ||
          !Number.isFinite(Number(started)) ||
          (services.now?.() ?? Date.now()) - Number(started) < 2000))
    )
      return respond(400, { reason: 'spam' });
    return (await services.deliver(parsed.value, requestId))
      ? respond(200, { ok: true, requestId })
      : respond(502);
  } catch {
    return respond(502);
  }
}
