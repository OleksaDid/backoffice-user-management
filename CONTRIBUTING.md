# Contributing

This document describes how changes move from an idea to production. The rules are enforced by
tooling wherever possible (see [Enforcement](#enforcement)), so following them is mostly automatic.

## Workflow at a glance

```
feature/*, fix/*, chore/*, docs/*, ci/*, test/*  ──PR──▶  main  ──auto──▶  staging (+ full e2e)
                                                           │
             release-please keeps a release PR open on main (version bump + CHANGELOG)
                                                           │
                         maintainer merges the release PR ─▶ tag vX.Y.Z + GitHub Release
                                                           │
     same image digest promoted to production ─▶ maintainer approves the deployment ─▶ smoke tests
                                                           │
                                         automatic rollback if smoke tests fail
```

1. **Branch** from an up-to-date `main` using the [naming convention](#branch-names).
2. **Spec first**: behaviour changes start in [`docs/spec`](docs/spec). Each scenario has an ID
   (for example `AUTH-05`) that tests reference.
3. **Commit** in small steps with [Conventional Commits](#commit-messages). A good commit does one
   thing and its body explains _why_.
4. **Open a pull request** to `main` using the template. CI must be green.
5. **Review**: the maintainer reviews every PR. Feedback is addressed in follow-up commits; history
   is not rewritten once review has started (except for the final rebase).
6. **Merge** with a merge commit (no squash). The granular commits stay readable and
   `git log --first-parent main` shows one entry per pull request.
7. **Staging** deploys automatically from `main` and runs the full end-to-end suite against it.
8. **Release**: release-please opens or updates a release PR from the commit history. Merging it
   is the release decision; approving the production deployment is the deploy decision.

Hotfixes follow the same path with a `fix/*` branch; release-please then proposes a patch release.

## Branch names

`<type>/<short-kebab-description>`, for example `feature/user-pagination`, `fix/session-expiry`.

| Type       | Use for                                    |
| ---------- | ------------------------------------------ |
| `feature`  | new user-facing or API behaviour           |
| `fix`      | bug fixes                                  |
| `chore`    | tooling, dependencies, housekeeping        |
| `docs`     | documentation and specification only       |
| `ci`       | pipelines and delivery                     |
| `test`     | tests only                                 |
| `refactor` | internal changes without behaviour changes |
| `perf`     | performance improvements                   |
| `build`    | build system, Docker images                |

Branches created by release-please (`release-please--*`) and Dependabot (`dependabot/*`) are
allowed as they are.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org): `type(scope): summary`.

- Types: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `build`, `ci`, `chore`, `revert`.
- Scopes (optional): `api`, `web`, `contracts`, `e2e`, `db`, `ci`, `deps`, `deps-dev`, `docker`,
  `docs`, `release`.
- Summary in the imperative mood, lower case, no trailing period.
- The body explains the reason and any trade-off. Reference spec IDs where relevant.
- `feat` and `fix` drive minor and patch versions; `feat!` or a `BREAKING CHANGE:` footer drives a
  major version.

```
feat(api): reject name changes for inactive users

USR-07: first and last name are locked while a user is inactive. The rule
lives in the domain layer so every entry point gets it.
```

## Pull requests

- One logical change per PR; large features are split into reviewable PRs.
- The PR title is a Conventional Commit summary (it is validated in CI).
- Fill in the template, including **AI assistance and human review**.
- Rebase on `main` before merging; resolve all conversations.

## Enforcement

| Rule              | Locally (Husky)                                         | On GitHub                                  |
| ----------------- | ------------------------------------------------------- | ------------------------------------------ |
| Formatting, lint  | `pre-commit`: lint-staged runs ESLint `--fix`, Prettier | CI `format:check`, `lint`                  |
| Commit messages   | `commit-msg`: commitlint                                | CI checks every PR commit and the PR title |
| Branch names      | `pre-push`: `scripts/check-branch-name.mjs`             | CI checks the PR head branch               |
| Types and tests   | `pre-push`: typecheck + unit tests                      | CI full pipeline                           |
| Protected `main`  | –                                                       | repository ruleset: PR + green checks      |
| Production deploy | –                                                       | environment approval by the maintainer     |

Hooks are installed by `npm install` (the `prepare` script). They can be bypassed with
`--no-verify`, which is why CI repeats every check.

### Known limitation: review approval

The maintainer currently opens pull requests with their own account, including those drafted by an
AI coding agent. GitHub does not allow approving your own pull request, so the ruleset cannot
_require_ an approval; it requires green checks and resolved conversations instead, and the
maintainer reviews and merges manually. The better setup is a separate bot account (or GitHub App)
for the agent, with a required approval from a human reviewer. It was skipped here to reduce setup
friction under a short deadline.
