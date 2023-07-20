module.exports = {
  extends: [
    'alloy',
    'alloy/react',
    'alloy/typescript',
    './.eslintrc-auto-import.json'
  ],
  env: {
    // 你的环境变量（包含多个预定义的全局变量）
    //
    browser: true
    // node: true
    // mocha: true,
    // jest: true,
    // jquery: true
  },
  globals: {
    // 你的全局变量（设置为 false 表示它不允许被重新赋值）
    // myGlobal: false
    API: 'readonly',
    Expand: 'readonly',
    ExpandRecursively: 'readonly'
  },
  rules: {
    // 自定义你的规则
    'max-params': 'off',
    'no-promise-executor-return': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-invalid-void-type': 'off',
    '@typescript-eslint/consistent-type-assertions': 'off',
    '@typescript-eslint/consistent-type-definitions': 'off'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};
