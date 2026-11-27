#!/usr/bin/env node
// Validates a branch name against the conventions in CONTRIBUTING.md.
// Usage: node scripts/check-branch-name.mjs [branch]  (defaults to the current branch)
import { execFileSync } from 'node:child_process';

const ALLOWED = [
  /^main$/,
  /^(feature|fix|chore|docs|ci|test|refactor|perf|build)\/[a-z0-9][a-z0-9._-]*$/,
  /^release-please--.+$/, // opened by release-please
  /^dependabot\/.+$/, // opened by Dependabot
];

const branch =
  process.argv[2] ??
  execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' }).trim();

if (branch === 'HEAD' || ALLOWED.some((pattern) => pattern.test(branch))) {
  process.exit(0);
}

process.stderr.write(
  `Branch "${branch}" does not follow the naming convention.\n` +
    'Use <type>/<short-kebab-description>, e.g. feature/user-pagination or fix/session-expiry.\n' +
    'Allowed types: feature, fix, chore, docs, ci, test, refactor, perf, build.\n',
);
process.exit(1);
