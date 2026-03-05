// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import stylistic from '@stylistic/eslint-plugin'

export default withNuxt(
  // Your custom configs here
  {
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      // Priority 2: Bug prevention (enforced as errors)
      'vue/no-expose-after-await': 'error', // Can cause bugs with component refs
      'vue/no-side-effects-in-computed-properties': 'error', // Computed must be pure
      'vue/return-in-computed-property': 'error', // Computed must return a value

      // Priority 1, 3 & 4: Security and code quality (warnings for gradual improvement)
      'vue/no-v-html': 'warn', // XSS risk - reviewed and justified where used
      'no-unused-vars': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-prototype-builtins': 'warn',
      'vue/no-unused-properties': 'warn',
      'vue/no-unused-refs': 'warn',
      'vue/require-prop-types': 'warn',
      'vue/custom-event-name-casing': 'warn',
      'vue/valid-v-slot': 'warn',
      'vue/no-template-shadow': 'warn',

      // JS rules
      'prefer-const': 'error',

      // Stylistic rules - DISABLED to avoid conflicts with Prettier
      // Prettier handles all formatting, ESLint only enforces logic rules
      // If you need to change formatting, update .prettierrc

      // Vue rules
      'vue/block-order': ['error', { order: ['template', 'script', 'style'] }],
      'vue/block-tag-newline': [
        'error',
        { singleline: 'always', multiline: 'always', maxEmptyLines: 1 }
      ],
      'vue/component-name-in-template-casing': [
        'error',
        'PascalCase',
        { registeredComponentsOnly: true }
      ],
      'vue/define-macros-order': ['error', { order: ['defineProps', 'defineEmits'] }],
      'vue/html-comment-content-newline': [
        'error',
        {
          singleline: 'never',
          multiline: 'always'
        }
      ],
      'vue/html-comment-content-spacing': ['error', 'always'],
      'vue/html-comment-indent': ['error', 2],
      'vue/no-empty-component-block': ['error'],
      'vue/no-use-v-else-with-v-for': ['error'],
      'vue/eqeqeq': ['error']
      // Note: Vue stylistic rules (array-bracket-newline, arrow-spacing, etc.)
      // are handled by Prettier to avoid conflicts
    }
  },
  {
    files: ['*.vue', '*.js', '*.ts'],
    rules: {
      'no-undef': 'warn'
    }
  },
  {
    files: [
      // These pages are not used directly by users so they can have one-word names.
      '**/pages/**/*.{js,ts,jsx,tsx,vue}',
      '**/layouts/**/*.{js,ts,jsx,tsx,vue}',
      '**/app.{js,ts,jsx,tsx,vue}',
      '**/error.{js,ts,jsx,tsx,vue}',
      // These files should have multiple words in their names as they are within subdirectories.
      '**/components/*/**/*.{js,ts,jsx,tsx,vue}'
    ],
    rules: { 'vue/multi-word-component-names': 'off' }
  },
  {
    // Pages and layouts are required to have a single root element if transitions are enabled.
    files: ['**/pages/**/*.{js,ts,jsx,tsx,vue}', '**/layouts/**/*.{js,ts,jsx,tsx,vue}'],
    rules: { 'vue/no-multiple-template-root': 'error' }
  }
)
