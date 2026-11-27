# 0002. Delivery workflow: trunk, release-please and human gates

- Status: Accepted
- Date: 2026-11-27

## Context

Code is written with the help of an AI coding agent. A human must stay in control of what is merged,
released and deployed, and the history should be easy to review commit by commit.

## Decision

- Short-lived branches → pull request → `main`. `main` is protected and always deployable.
- Merge commits, not squash merges: granular commits remain, and the first-parent history shows one
  entry per pull request.
- Conventional Commits, enforced locally (Husky) and in CI.
- `main` deploys automatically to **staging**, where the full e2e suite runs.
- **release-please** maintains a release PR with the next version and changelog. Merging it creates
  the tag and GitHub Release. Long-lived release branches were considered and rejected as overhead
  for a single release line.
- The release promotes the image digest that passed staging to **production**, behind a GitHub
  Environment approval by the maintainer, followed by smoke tests and automatic rollback.

## Consequences

- Three explicit human decisions: merge a PR, merge a release PR, approve a production deployment.
- PR approvals cannot be required while the maintainer opens PRs with their own account; see
  CONTRIBUTING.md, "Known limitation: review approval".
