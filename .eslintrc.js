module.exports = {
  env: {
    browser: true,
    commonjs: true,
    node: true,
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
  rules: {
    'react/jsx-no-undef': 1,
    'react/no-multi-comp': 1,
    'react/function-component-definition': 0,
    'react/jsx-props-no-spreading': 0,
    'jsx-a11y/anchor-is-valid': 0,
    'no-unused-vars': 0,
    'import/no-unresolved': 0,
    'no-console': [2, { allow: ['warn', 'error'] }],
    'jsx-a11y/interactive-supports-focus': 0,
    'react/prop-types': 0,
    'linebreak-style': 0,
  },
  settings: {
    'import/resolver': {
      node: {
        paths: ['.'],
      },
    },
  },
};
