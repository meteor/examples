import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import importXPlugin from 'eslint-plugin-import-x';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: ['node_modules/', '.meteor/', '_build/', 'public/sw.js'],
  },

  // Base recommended rules (replaces airbnb core)
  js.configs.recommended,

  // React
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],

  // React Hooks
  reactHooksPlugin.configs.flat['recommended-latest'],

  // Accessibility
  jsxA11yPlugin.flatConfigs.recommended,

  // Import rules
  importXPlugin.flatConfigs.recommended,

  // Prettier (disables conflicting formatting rules — must be last)
  prettierConfig,

  // Project-specific overrides
  {
    files: ['**/*.{js,jsx,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.mocha,
        Meteor: 'readonly',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import-x/resolver': {
        node: true,
      },
    },
    rules: {
      'import-x/no-unresolved': 'off',
      'import-x/extensions': 'off',
      'import-x/no-extraneous-dependencies': 'off',
      'react/prop-types': 'off',
      'react/jsx-filename-extension': ['warn', { extensions: ['.jsx'] }],
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' },
      ],
      'no-underscore-dangle': ['error', { allow: ['_id'] }],
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];
