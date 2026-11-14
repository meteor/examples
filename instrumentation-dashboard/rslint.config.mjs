import { defineConfig, js } from '@rslint/core';

export default defineConfig([
  {
    ignores: ['node_modules/**', '.meteor/**', '_build/**'],
  },
  js.configs.recommended,
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'warn',
      'no-constant-binary-expression': 'off',
    },
  },
]);
