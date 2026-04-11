const path = require('node:path');
const expo = require('eslint-config-expo/flat');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  {
    ignores: ['dist/**', '.expo/**', 'node_modules/**', '**/components/__tests__/**'],
  },
  ...expo,
  {
    settings: {
      'import/resolver': {
        typescript: {
          project: path.join(__dirname, 'tsconfig.json'),
          alwaysTryTypes: true,
        },
      },
    },
  },
];
