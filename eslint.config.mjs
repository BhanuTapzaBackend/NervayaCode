import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettierConfig from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off', // Requires type information
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // React specific rules
      'react/no-unescaped-entities': 'error',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-react': 'off', // Not needed with React 17+
      'react/jsx-uses-vars': 'error',
      'react/no-array-index-key': 'warn',
      'react/no-danger': 'warn',
      'react/no-deprecated': 'warn',
      'react/no-unsafe': 'warn',
      'react/prop-types': 'off', // Using TypeScript instead

      // Next.js specific rules
      '@next/next/no-img-element': 'error',
      '@next/next/no-html-link-for-pages': 'error',

      // ── Project rules (FRONTEND_STANDARDS.md §16 enforcement) ──────────
      // Pre-existing violations live in eslint-suppressions.json (the
      // ratchet baseline): `eslint .` passes today, any NEW violation fails,
      // and the baseline may only shrink (`eslint . --prune-suppressions`
      // after cleanups). Never regenerate it to admit new violations.

      // §6.7 — console.log must not ship; warn/error are the required
      // channel for fire-and-forget failures (§3.6).
      'no-console': ['error', { allow: ['warn', 'error'] }],
      // §2.1 — components/hooks never talk HTTP directly; the axios client
      // is reachable only from the tier-1 layer (override block below).
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/lib/axios',
              message:
                'FRONTEND_STANDARDS.md §2.1: only src/lib/api/** may import the axios client. ' +
                'Call a src/lib/api/<domain>.ts function from a src/queries hook instead.',
            },
            {
              name: 'axios',
              message:
                'FRONTEND_STANDARDS.md §2.3: one axios instance (src/lib/axios.ts). ' +
                'Import the shared client via the src/lib/api service layer, not the axios package.',
            },
          ],
        },
      ],
      'no-debugger': 'error',
      'no-alert': 'warn',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'warn',
      'prefer-template': 'warn',
      'no-useless-return': 'error',
      'no-useless-concat': 'error',
      'no-duplicate-imports': 'error',
      'no-unused-expressions': 'error',
      'no-param-reassign': ['error', { props: false }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      curly: ['error', 'all'],
      'brace-style': ['error', '1tbs', { allowSingleLine: true }],
      'comma-dangle': ['error', 'always-multiline'],
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],
      indent: ['error', 2, { SwitchCase: 1 }],
      'max-len': ['warn', { code: 120, ignoreUrls: true, ignoreStrings: true }],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'comma-spacing': ['error', { before: false, after: true }],
      'key-spacing': ['error', { beforeColon: false, afterColon: true }],
      'space-before-blocks': 'error',
      'space-before-function-paren': ['error', { anonymous: 'always', named: 'never', asyncArrow: 'always' }],
      'space-in-parens': ['error', 'never'],
      'space-infix-ops': 'error',
      'space-unary-ops': ['error', { words: true, nonwords: false }],
      'spaced-comment': ['error', 'always', { exceptions: ['-', '+'] }],
    },
  },
  // §1.3 — component size cap (hard MUST at 300; ~200 is the SHOULD).
  // skipBlankLines/skipComments so the cap measures code, not headers.
  {
    files: ['**/*.tsx'],
    rules: {
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
    },
  },
  // Tier-1 service layer: the only place allowed to import the axios client
  // (and axios.ts itself is the only importer of the axios package).
  {
    files: ['src/lib/api/**/*.ts', 'src/lib/axios.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      ...prettierConfig.rules,
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'node_modules/**',
    '*.config.{js,mjs,ts}',
    'scripts/**',
    // Playwright output: the generated HTML report bundles minified JS, which
    // otherwise floods `npm run lint` with thousands of errors after any e2e run.
    'e2e/.artifacts/**',
  ]),
]);

export default eslintConfig;
