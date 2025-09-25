module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: undefined,
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  settings: {
    'import/resolver': {
      typescript: {
        project: __dirname,
      },
    },
  },
  rules: {
    'no-console': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  overrides: [
    {
      files: [
        'src/services/BackupService.ts',
        'src/services/CacheService.ts',
        'src/services/MongoService.ts',
        'src/scripts/seed.ts',
        'src/tests/**/*.ts'
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
  ignorePatterns: ['dist/', 'node_modules/', 'prisma/', 'logs/', '*.js'],
};


