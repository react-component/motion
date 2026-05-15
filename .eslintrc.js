const restrictedPackageDirectoryImports = [
  '@rc-component/*/es',
  '@rc-component/*/es/**',
  '@rc-component/*/lib',
  '@rc-component/*/lib/**',
  'rc-*/es',
  'rc-*/es/**',
  'rc-*/lib',
  'rc-*/lib/**',
];

module.exports = {
  extends: [require.resolve('@umijs/fabric/dist/eslint')],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: restrictedPackageDirectoryImports,
            message:
              'Do not import package internals from es/lib. Import from the package root.',
          },
        ],
      },
    ],
    'no-template-curly-in-string': 0,
    'prefer-promise-reject-errors': 0,
    'react/no-array-index-key': 0,
    'react/sort-comp': 0,
    '@typescript-eslint/no-explicit-any': 0,
    'react/no-find-dom-node': 0,
    'jsx-a11y/label-has-for': 0,
    'jsx-a11y/label-has-associated-control': 0,
    'default-case': 0,
  },
};
