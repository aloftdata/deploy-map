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
)
