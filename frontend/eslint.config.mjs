import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

/** @type {import('eslint').Linter.Config[]} */
const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
      '*.tsbuildinfo',
    ],
  },

  ...nextCoreWebVitals,
  ...nextTypescript,

  {
    rules: {
      // 352 usos de `any` hoy. Warning para que sean visibles y bajen con el
      // tiempo, sin bloquear el build. Subir a 'error' cuando llegue a 0.
      '@typescript-eslint/no-explicit-any': 'warn',

      // 106 hoy. Deuda de limpieza, no bugs: warning para no bloquear el build.
      // Subir a 'error' cuando esten en 0.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Bugs reales que tsc no marca.
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-unsafe-optional-chaining': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
    },
  },

  {
    files: ['__tests__/**', '**/*.test.ts', '**/*.test.tsx', 'e2e/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
]

export default config
