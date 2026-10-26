import { defineConfig } from 'astro/config';

// Static output; host-specific adapters live in infra/, never here.
export default defineConfig({
  output: 'static',
  server: { host: '127.0.0.1', port: Number(process.env.PORT) || 4321 },
});
