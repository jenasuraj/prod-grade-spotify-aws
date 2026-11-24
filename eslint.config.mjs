import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['**/node_modules', '**/dist', '**/coverage', 'apps/api/src/generated']),

  js.configs.recommended,
  tseslint.configs.recommended,

  // NestJS API
  {
    files: ['apps/api/**/*.ts'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      // Lets `const { id: _id, ...rest } = obj` strip fields without a warning
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
  {
    // supertest and jest matchers are loosely typed
    files: ['apps/api/**/*.spec.ts', 'apps/api/**/*.e2e-spec.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },

  // React web app
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['apps/web/**/*.test.{ts,tsx}', 'apps/web/jest.setup.ts'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.jest },
    },
  },

  // Plain JS config files
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: { globals: globals.node },
  },

  // Must be last: turns off rules that conflict with Prettier
  prettier,
]);
