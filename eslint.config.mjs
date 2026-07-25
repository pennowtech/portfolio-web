import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import prettier from 'eslint-config-prettier/flat';

export default defineConfig([
  ...nextVitals,
  prettier,
  {
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
      'react/function-component-definition': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/prop-types': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'no-console': ['error', { allow: ['warn', 'error'] }]
    }
  },
  globalIgnores([
    '.next/**',
    'out/**',
    '.vercel/**',
    'playwright-report/**',
    'public/**',
    'Urql2.jsx',
    'index-copy.jsx',
    'login.jsx'
  ])
]);
