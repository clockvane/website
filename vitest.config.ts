import { getViteConfig } from 'astro/config';
import { defineConfig } from 'vitest/config';

export default getViteConfig(
  defineConfig({
    test: {
      include: ['tests/{unit,infra}/**/*.test.ts'],
      coverage: {
        provider: 'v8',
        include: ['site.config.ts', 'src/lib/**/*.ts'],
        reporter: ['text', 'lcov'],
        thresholds: { perFile: true, lines: 80 },
      },
    },
  }),
);
