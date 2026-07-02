import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/** Shared flat ESLint config for all TS packages and apps. */
export default tseslint.config(
  { ignores: ['dist/**', '.output/**', '.tanstack/**', '**/routeTree.gen.ts', '**/generated/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ['**/scripts/**', '**/*.config.{js,ts,mjs}'],
    languageOptions: { globals: globals.node },
  },
)
