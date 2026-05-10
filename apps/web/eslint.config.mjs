import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
  /**
   * `eslint-config-next/typescript` pulls in `typescript-eslint/base`, which has no `files` glob,
   * so `@typescript-eslint/parser` applies to every matched file — including `eslint.config.mjs`.
   * Pin the project root for the whole web app and allow the ESLint config file (not in tsconfig)
   * so the project service does not error in a monorepo.
   */
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        projectService: {
          allowDefaultProject: [
            'eslint.config.mjs',
            'postcss.config.mjs',
            'vitest.config.mjs',
            'public/sw.js',
          ],
        },
      },
    },
  },
]);

export default eslintConfig;
