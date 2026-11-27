// Conventional Commits: https://www.conventionalcommits.org
// release-please derives versions and the changelog from these messages.
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'api',
        'web',
        'contracts',
        'e2e',
        'db',
        'ci',
        'deps',
        'deps-dev',
        'docker',
        'docs',
        'release',
      ],
    ],
    'body-max-line-length': [1, 'always', 100],
  },
};
