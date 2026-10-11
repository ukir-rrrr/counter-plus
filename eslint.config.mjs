// @ts-check
import expoConfig from 'eslint-config-expo/flat';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...expoConfig,
  {
    ignores: ['node_modules/', '.expo/', 'drizzle/', 'assets/'],
  },
];
