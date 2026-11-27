# 0006. Testing strategy and quality gates

- Status: Accepted
- Date: 2026-11-27

## Context

The brief asks for automated tests that guarantee the described behaviour and "reasonable test
coverage". The code is largely written by an AI coding agent, so tests are also the main evidence
that what was specified is what was built.

## Decision

- **Four levels**, each testing what it is best at:
  - unit: pure domain rules, schemas, hashing, configuration, error mapping (fast, exhaustive);
  - integration: every API endpoint against a real PostgreSQL (Testcontainers), migrations
    replaying their history, the real process starting and shutting down;
  - component: React pages with the real routes, guards and query client, the API mocked by MSW
    with an in-memory fake that enforces the API's rules;
  - end-to-end: Playwright against the production images (CI) and the deployed staging
    environment, in Chromium, Firefox and WebKit, with axe accessibility checks in both themes.
- **Requirement IDs in test titles** (spec-driven development): a generated traceability matrix
  shows which requirements are verified at which level and fails CI when stale or incomplete.
- **Coverage thresholds** (90% lines/functions/statements, 85% branches) guard against erosion; they
  are a floor, not the goal.
- **Gates**: every pull request runs all levels; staging runs the full e2e suite before a release
  can be cut; production runs smoke checks after deployment and rolls back on failure.

## Consequences

- Real defects were caught by tests, not review: an unhandled database pool error, duplicated
  headers, contrast failures, a review fix that had not landed.
- CI takes longer (three browsers); `E2E_BROWSERS=chromium` keeps local runs fast.
- e2e on shared staging creates test users (prefixed `e2e-`), removed by the nightly reset.
