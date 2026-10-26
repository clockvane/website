import eslintPluginAstro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'dist/',
      '.astro/',
      'node_modules/',
      'coverage/',
      '.agentops-scratch/',
      '.agentops-clone/',
    ],
  },
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    files: ['src/**/*.{ts,js,astro}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@cloudflare/*',
                'cloudflare:*',
                '@vercel/*',
                '@netlify/*',
                '**/infra/**',
              ],
              message: 'Keep host-specific code in infra/, outside src/.',
            },
          ],
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message: 'Read public environment values through src/lib/config/.',
        },
      ],
    },
  },
];
