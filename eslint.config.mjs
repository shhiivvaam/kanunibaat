import path from 'node:path';
import { fileURLToPath } from 'node:url';

import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Only shared workspace packages live under ./packages — apps use their own eslint.config.* */
const PKG_TS_FILES = ['packages/**/*.{ts,tsx}'];

function scopedToPkg(config) {
  if (typeof config !== 'object' || config === null) {
    return config;
  }

  const hasLintKeys =
    'languageOptions' in config ||
    'linterOptions' in config ||
    ('rules' in config && config.rules) ||
    'plugins' in config;

  if (!hasLintKeys) {
    return config;
  }

  return {
    ...config,
    files: PKG_TS_FILES,
  };
}

/** Flatten ESLint/ts-eslint config fragments — each preset may be object or array. */
function appendScoped(entries, fragments) {
  const list = Array.isArray(fragments) ? fragments : [fragments];
  for (const item of list) {
    entries.push(...(Array.isArray(item) ? item.map(scopedToPkg) : [scopedToPkg(item)]));
  }
  return entries;
}

const scopedBlocks = appendScoped([], [
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  eslintConfigPrettier,
]);

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/packages/database/drizzle.config.ts',
      '**/packages/database/drizzle/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/out/**',
      // Flat config files are not part of app tsconfigs; root only matched `eslint.config.mjs` before.
      '**/eslint.config.mjs',
      '**/eslint.config.js',
      '**/eslint.config.cjs',
      // Repo / package tooling not part of workspace TypeScript projects (when linted via root ESLint).
      '**/scripts/**/*.mjs',
      'prettier.config.cjs',
      'packages/config/eslint/**',
      'packages/config/prettier/**',
    ],
  },
  ...scopedBlocks,
  // Shared workspace packages (`packages/typescript.json`-aware project service).
  {
    files: PKG_TS_FILES,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    files: PKG_TS_FILES,
    plugins: {
      import: importPlugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      'import/first': 'error',
      'import/newline-after-import': 'error',
    },
  },
);
