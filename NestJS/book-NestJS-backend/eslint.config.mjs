// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      "no-var": "warn",
      "no-multiple-empty-lines": "warn",
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      "eqeqeq": "warn",
      "dot-notation": "warn",
      "no-unused-vars": "warn",
      "react/destructuring-assignment": "warn",
      "react/jsx-pascal-case": "warn",
      "react/no-direct-mutation-state": "warn",
      "react/jsx-no-useless-fragment": "warn",
      "react/no-unused-state": "warn",
      "react/jsx-key": "warn",
      "react/self-closing-comp": "warn",
      "react/jsx-curly-brace-presence": "warn",
    },
  },
);