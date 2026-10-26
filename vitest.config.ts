import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['site.config.ts', 'src/lib/**/*.ts'],
      reporter: ['text', 'lcov'],
      thresholds: { perFile: true, lines: 80 },
    },
  },
});
