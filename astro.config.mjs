import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { siteOrigin } from './site.config.ts';
import './src/styles/generate.mjs';

// Static output; host-specific adapters live in infra/, never here.
export default defineConfig({
  output: 'static',
  site: siteOrigin,
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => !/\/(?:404|contact\/(?:thanks|error))\/$/.test(page),
    }),
  ],
  build: { inlineStylesheets: 'never' },
  vite: { build: { assetsInlineLimit: 0 } },
  server: { host: '127.0.0.1', port: Number(process.env.PORT) || 4321 },
});
