import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // ── Ignored paths ─────────────────────────────────────────────────────────
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'node_modules/**',
  ]),

  // ── Custom rules ──────────────────────────────────────────────────────────
  {
    rules: {
      // Enforce explicit return types on module-boundary functions
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // Disallow `any` — use `unknown` instead
      '@typescript-eslint/no-explicit-any': 'error',

      // Require consistent type imports
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // Disallow unused variables (warn only; CI can enforce error)
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Prefer `const` over `let` when reassignment doesn't happen
      'prefer-const': 'error',

      // Disallow console.log in production code (allow warn + error)
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Enforce import order
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },
]);

export default eslintConfig;
