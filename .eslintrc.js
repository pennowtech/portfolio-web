module.exports = {
  env: {
    browser: true,
    commonjs: true,
    node: true,
  },
  plugins: ["prettier"],
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "airbnb",
    "airbnb/hooks",
    "prettier",
  ],
  parserOptions: {
    ecmaFeatures: {
      modules: true,
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: "module",
  },
  rules: {
    "react/jsx-no-undef": 1,
    "react/no-multi-comp": 1,
    "react/function-component-definition": 0,
    "react/jsx-props-no-spreading": 0,
    "jsx-a11y/anchor-is-valid": 0,
    "no-unused-vars": 2,
    "no-console": [2, { allow: ["warn", "error"] }],
    "jsx-a11y/interactive-supports-focus": 0,
    "react/prop-types": 0,
    "linebreak-style": 0,
    "max-len": [2, { code: 120 }],
    "prettier/prettier": 1,
  },
  settings: {
    "import/resolver": {
      node: {
        paths: ["pages", "components", "utils"],
        extensions: [".jsx"],
      },
    },
  },
};
