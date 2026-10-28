import { build, preview } from 'astro';

// Inject only in this isolated test artifact; production routes stay unchanged.
const config = {
  outDir: '.agentops-scratch/components-dist',
  integrations: [
    {
      name: 'component-fixture',
      hooks: {
        'astro:config:setup': ({ injectRoute }) =>
          injectRoute({
            pattern: '/__components/',
            entrypoint: './tests/fixtures/page-components.astro',
          }),
      },
    },
  ],
};
await build(config);
const server = await preview(config);
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, async () => {
    await server.stop();
    process.exit(0);
  });
}
