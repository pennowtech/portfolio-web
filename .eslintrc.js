module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'airbnb',
    'airbnb/hooks',
  ],
  parserOptions: {
    ecmaFeatures: {
      modules: true,
      jsx: true,
    },
    ecmaVersion: 13,
    sourceType: 'module',
  },
  plugins: [
    'react',
  ],
  rules: {
    'react/prop-types': 1,
    'react/jsx-no-undef': 1,
    'react/no-multi-comp': 1,
    'react/function-component-definition': 0,
    'jsx-a11y/anchor-is-valid': 0,
    'no-unused-vars': 0,
    'no-console': ['error', { allow: ['warn', 'error'] }],

  },
  settings: {
    'import/resolver': {
      node: {
        paths: ['.'],
      },
    },
  },
};
