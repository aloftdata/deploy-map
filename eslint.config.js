import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  // "essential" only: the larger presets are mostly template formatting rules.
  vue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    // <script lang="ts"> blocks need the TypeScript parser.
    languageOptions: { parserOptions: { parser: tseslint.parser } },
    // TypeScript already reports undefined names, and knows the DOM types.
    rules: { 'no-undef': 'off' },
  },
  {
    files: ['e2e/**/*.mjs'],
    languageOptions: { globals: { process: 'readonly', URL: 'readonly' } },
  },
  {
    // Plain browser script loaded after the widget bundle.
    files: ['demo/**/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: { DeployMap: 'readonly', document: 'readonly', console: 'readonly' },
    },
  },
)
