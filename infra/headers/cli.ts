// CLI: node infra/headers/cli.ts [--noindex] [--analytics]   (prints the _headers file to stdout)
// --analytics: the artifact loads Cloudflare Web Analytics (set by infra/cloudflare/prepare-*.sh).
// Env: ENQUIRY_WORKER_ORIGIN  optional https origin of the enquiry Worker.
// Node 24 strips types and resolves the .ts import below.
import { renderPagesHeaders } from './render.ts';

declare const process: {
  argv: string[];
  env: Record<string, string | undefined>;
  stdout: { write(s: string): void };
};

process.stdout.write(
  renderPagesHeaders({
    enquiryOrigin: process.env['ENQUIRY_WORKER_ORIGIN'] || undefined,
    noindex: process.argv.includes('--noindex'),
    analytics: process.argv.includes('--analytics'),
  }),
);
