// CLI: node infra/headers/cli.ts [--noindex] [--analytics] [--enquiry-from-config]   (prints the _headers file)
// --analytics: the artifact loads Cloudflare Web Analytics (set by infra/cloudflare/prepare-*.sh).
// Env: ENQUIRY_WORKER_ORIGIN  optional https origin of the enquiry Worker (wins over the config).
// --enquiry-from-config: use the origin of site.config.ts contact.endpoint, the single source.
//   Only then is site.config.ts loaded, which needs `npm ci` (zod).
// Node 24 strips types and resolves the .ts imports below.
import { renderPagesHeaders } from './render.ts';

declare const process: {
  argv: string[];
  env: Record<string, string | undefined>;
  stdout: { write(s: string): void };
};

let fromConfig: string | undefined;
if (process.argv.includes('--enquiry-from-config')) {
  const { siteConfig } = await import('../../site.config.ts');
  fromConfig = new URL(siteConfig.contact.endpoint).origin;
}

process.stdout.write(
  renderPagesHeaders({
    enquiryOrigin: process.env['ENQUIRY_WORKER_ORIGIN'] || fromConfig,
    noindex: process.argv.includes('--noindex'),
    analytics: process.argv.includes('--analytics'),
  }),
);
