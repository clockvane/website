import { getViteConfig } from 'astro/config';
import { defineConfig } from 'vitest/config';

export default getViteConfig(
  defineConfig({
    test: {
      include: ['tests/{unit,infra}/**/*.test.ts'],
      coverage: {
        provider: 'v8',
        include: ['site.config.ts', 'src/lib/**/*.ts', 'src/scripts/**/*.ts'],
        reporter: ['text', 'lcov'],
        // Report both controllers; retain the existing gates and add one for motion.
        // Contact's DOM behaviour is covered by Playwright, not the unit suite.
        thresholds: {
          'site.config.ts': { perFile: true, lines: 80 },
          'src/lib/**/*.ts': { perFile: true, lines: 80 },
          'src/scripts/motion.ts': { perFile: true, lines: 80 },
        },
      },
    },
  }),
);
