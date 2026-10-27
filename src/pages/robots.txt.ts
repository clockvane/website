import { siteOrigin } from '../../site.config';

export function GET(): Response {
  return new Response(
    `User-agent: *\nAllow: /\nSitemap: ${siteOrigin}/sitemap-index.xml\n`,
    {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    },
  );
}
