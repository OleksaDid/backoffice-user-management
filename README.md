# Back-office User Management

A back-office application for registering and managing users: a **Fastify** REST API and a
**React** single-page app sharing typed contracts, backed by **PostgreSQL**, containerized,
tested at four levels and delivered through a human-gated CI/CD pipeline.

|                   |                                                                          |
| ----------------- | ------------------------------------------------------------------------ |
| **Production**    | https://test.oleksa.live (deployed from releases, after manual approval) |
| **Staging**       | https://test-staging.oleksa.live (deployed from every merge to `main`)   |
| **Demo sign-in**  | `ada.lovelace@example.com` / `demo-password` (or sign up with any email) |
| **API reference** | `/api/docs` on any environment (OpenAPI 3.1)                             |

Public environments are reset nightly to 20 demo users (`firstname.lastname@example.com`,
password `demo-password`).

## Contents

- [Quick start](#quick-start)
- [Features](#features)
- [Architecture](#architecture)
- [API](#api)
- [Testing](#testing)
- [Delivery: CI/CD, environments, releases](#delivery)
- [Development](#development)
- [Configuration](#configuration)
- [Assumptions](#assumptions)
- [Known limitations](#known-limitations)
- [Future improvements](#future-improvements)
- [How this was built (AI assistance and human review)](#how-this-was-built)

## Quick start

Requirements: Docker with Compose v2.

```bash
docker compose up --build                            # database, migrations, API, web
docker compose run --rm api npm run db:reset-demo    # optional: 20 demo users
open http://localhost:8080
```

Sign up, or sign in as `ada.lovelace@example.com` / `demo-password` after seeding.
`curl http://localhost:8080/api/health/ready` answers `{"status":"ok",...}` once everything runs.

## Features

The challenge parts and where they live. Every requirement has an ID in the
[specification](docs/spec/README.md); [acceptance criteria](docs/acceptance-criteria.md) maps the
original challenge to those IDs and the [traceability matrix](docs/traceability.md) maps the IDs to
tests.

| Part                 | What                                                                                                                                                                                 | Spec                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| 0. Backend           | Users and sessions REST API with the three domain rules: creation time immutable and last update always refreshed, names locked while inactive, inactive users cannot start sessions | [01](docs/spec/01-users-and-sessions-api.md)    |
| 1. Sign-up / sign-in | Email + password, httpOnly cookie sessions, sign-up shown by default, password confirmation checked before the request, Hello &lt;first_name&gt;, Log out                            | [02](docs/spec/02-authentication.md)            |
| 2. Dashboard         | 6 users per page with the page in the URL, create, edit, activate/deactivate, delete; only for signed-in users; replaces the welcome page                                            | [03](docs/spec/03-user-management-dashboard.md) |
| 3. Themes            | Light, dark and system; persisted; no flash of the wrong theme on load                                                                                                               | [04](docs/spec/04-themes.md)                    |
| 4. Testing           | Unit, integration, component and e2e tests (3 browsers), coverage thresholds, traceability                                                                                           | [07](docs/spec/07-non-functional.md)            |

Beyond the brief, for production readiness: RFC 9457 error model with a shared catalog, CSRF and
rate limiting, security headers and CSP, structured logs with request ids, health and readiness
checks, graceful shutdown, expand/contract migrations, non-root read-only containers, WCAG 2.2 AA
target with automated axe checks in both themes, staging and production environments with automatic
rollback.

## Architecture

```
Browser ──HTTPS──▶ web: nginx (SPA + reverse proxy for /api) ──▶ api: Fastify (Node 24) ──▶ PostgreSQL 17
                   same origin: no CORS, SameSite=Strict cookie, strict CSP
```

**Monorepo** (npm workspaces):

| Path                 | Contents                                                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/api`           | Fastify service. Layers: `http` (routes, auth/CSRF hooks, error handler) → `services` (use cases) → `domain` (pure rules) ← `repositories` (Drizzle, unit of work) |
| `apps/web`           | React 19 + Vite + Mantine 9, React Router, TanStack Query, react-hook-form                                                                                         |
| `packages/contracts` | zod schemas, DTO types and the error catalog, shared by both apps                                                                                                  |
| `e2e`                | Playwright journeys with axe accessibility checks                                                                                                                  |
| `deploy`             | Server Compose template and deployment guide                                                                                                                       |
| `docs`               | specification, acceptance criteria, decision log, traceability matrix                                                                                              |

Key decisions, each with context and trade-offs in the [decision log](docs/decisions/README.md):
monorepo and stack ([0001](docs/decisions/0001-monorepo-and-technology-stack.md)), delivery workflow
([0002](docs/decisions/0002-delivery-workflow.md)), interpretations of open requirements
([0003](docs/decisions/0003-interpretation-of-open-requirements.md)), credentials in a separate
table ([0004](docs/decisions/0004-credentials-in-a-separate-table.md)), session id in an httpOnly
cookie ([0005](docs/decisions/0005-session-id-in-an-httponly-cookie.md)), testing strategy
([0006](docs/decisions/0006-testing-strategy.md)).

Patterns worth pointing out:

- **Contract-first**: one zod schema validates the request in the API, generates OpenAPI and drives
  the web form, so the two sides cannot drift.
- **Domain rules as pure functions**, applied on a `SELECT … FOR UPDATE`-locked row inside a unit of
  work, so a rule check and the write it guards cannot interleave with a concurrent change.
- **One error model**: typed `AppError` with catalog codes → one central handler → problem details;
  the web app maps the same codes to messages; a replaceable `ErrorReporter` on both sides.
- **Schema evolution by migrations**: the schema starts exactly as the Part 0 domain and gains
  credentials through an expand migration and a later contract migration, so every release can be
  rolled back by one version.

## API

All endpoints are under `/api`. Everything except authentication, health and docs requires the
session cookie set by sign-up or sign-in. Errors are RFC 9457 problem details with a stable `code`
([catalog](docs/spec/05-errors.md)).

| Method | Path                            | Purpose                                                    | Spec                |
| ------ | ------------------------------- | ---------------------------------------------------------- | ------------------- |
| POST   | `/auth/sign-up`                 | Register, start a session, set the cookie                  | AUTH-01, 02         |
| POST   | `/auth/sign-in`                 | Sign in, start a session, set the cookie                   | AUTH-03 to 05       |
| POST   | `/auth/sign-out`                | End the current session, clear the cookie                  | AUTH-06             |
| GET    | `/auth/me`                      | Current user and session                                   | AUTH-07             |
| GET    | `/users?page&pageSize`          | List users, newest first (default 6 per page)              | USR-03 to 06        |
| POST   | `/users`                        | Create a user with an initial password                     | USR-01, AUTH-12     |
| PATCH  | `/users/:id`                    | Update first and last name (locked while inactive)         | USR-07 to 09        |
| PUT    | `/users/:id/status`             | Activate or deactivate (ends their sessions; not yourself) | USR-10, 11, AUTH-30 |
| DELETE | `/users/:id`                    | Delete a user and their sessions (not yourself)            | USR-13, AUTH-30     |
| DELETE | `/sessions/:id`                 | Terminate a session (idempotent)                           | SES-04 to 06        |
| GET    | `/health/live`, `/health/ready` | Liveness; readiness incl. database and migrations          | HLT-01              |

Status codes: `400` invalid request, `401` no valid session or wrong credentials, `403` inactive
account or cross-site request, `404` unknown resource, `409` conflict with the current state
(duplicate email, name locked, self-modification), `429` rate limited.

## Testing

| Level       | Tool                           | What                                                                                                        | Count           |
| ----------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------- | --------------- |
| Unit        | Vitest                         | domain rules, schemas, hashing, config, error handling, HTTP behaviour                                      | 66              |
| Integration | Vitest + Testcontainers        | every endpoint against a real PostgreSQL, migrations replaying history, process start and graceful shutdown | 54              |
| Component   | Vitest + Testing Library + MSW | pages and flows with the real routes and query client, an in-memory fake of the users API                   | 57              |
| End-to-end  | Playwright + axe               | journeys in Chromium, Firefox and WebKit against the production images; axe in both themes                  | 18 × 3 browsers |

```bash
npm test                    # unit, integration (needs Docker) and component tests
npm run test:coverage       # the same with coverage thresholds (90% lines/functions/statements, 85% branches)
docker compose up --build && npm run e2e    # e2e against the local stack
E2E_BROWSERS=chromium npm run e2e           # one browser for a quick run
npm run traceability        # regenerate docs/traceability.md
```

Test titles carry the requirement IDs they verify, which is how the
[traceability matrix](docs/traceability.md) is generated; CI fails when it is stale or when a
requirement has neither a test nor another named verification. Several real bugs in this project
were found by these tests rather than by reading code (an unhandled pool error that would crash the
process on a database restart, duplicated cache headers, contrast failures found by axe, a missing
stale-data warning).

## Delivery

Full details: [CONTRIBUTING.md](CONTRIBUTING.md) (workflow and rules) and
[deploy/README.md](deploy/README.md) (servers, images, configuration).

```
feature/* ──PR──▶ main ──▶ publish images ──▶ deploy staging ──▶ e2e on staging (3 browsers)
                                                                      │
                     release-please release PR (version + CHANGELOG) ◀┘
                                     │ merged by the maintainer
                                     ▼
          tag vX.Y.Z ──▶ same image digest promoted ──▶ approval ──▶ production ──▶ smoke test
                                                                      (rollback on failure)
```

- **Every pull request**: branch name, commit messages and PR title, formatting, lint, typecheck,
  traceability, unit/integration/component tests with coverage on Node 22 and 24, Docker images,
  full-stack smoke test, non-root check and e2e in three browsers. All are required checks.
- **Three human decisions**: merge a PR, merge a release PR, approve a production deployment.
- **Conventions enforced by tooling**: Prettier and ESLint on pre-commit, commitlint on commit-msg,
  branch naming, typecheck and tests on pre-push; the same checks in CI.
- **History**: merge commits (no squash), so `git log --first-parent main` reads one entry per
  pull request and the granular commits underneath explain each step.

## Development

Requirements: Node.js 22.12+ (`nvm use` picks 24), Docker for the database and integration tests.

```bash
npm install                                          # all workspaces + git hooks
docker compose -f compose.yaml -f compose.dev.yaml up -d db
cp apps/api/.env.example apps/api/.env
npm run dev:migrate -w @backoffice/api
npm run dev -w @backoffice/api                       # API on :3000 with reload
npm run dev -w @backoffice/web                       # web on :5173, proxies /api
```

Useful commands: `npm run lint`, `npm run typecheck`, `npm run format`,
`npm run db:generate -w @backoffice/api -- --name <change>` (new migration from the schema),
`npm run dev:reset-demo -w @backoffice/api`. [AGENTS.md](AGENTS.md) is the same map for AI coding
agents.

## Configuration

API environment variables (validated at startup; the process refuses to start on invalid values):

| Variable                                                                | Default                                          | Purpose                                                            |
| ----------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------ |
| `DATABASE_URL`                                                          | required                                         | PostgreSQL connection                                              |
| `PUBLIC_ORIGIN`                                                         | `http://localhost:8080` (required in production) | allowed origin for state-changing requests                         |
| `COOKIE_SECURE`                                                         | `true`                                           | session cookie only over HTTPS (`false` for plain-HTTP local runs) |
| `SESSION_TTL_HOURS`                                                     | `168`                                            | absolute session lifetime                                          |
| `AUTH_RATE_LIMIT_PER_MINUTE`                                            | `10`                                             | sign-in/sign-up attempts per client IP                             |
| `TRUST_PROXY_HOPS`                                                      | `0` (`1` behind the web server)                  | trusted reverse proxies                                            |
| `LOG_LEVEL`, `PORT`, `HOST`, `DATABASE_POOL_MAX`, `SHUTDOWN_TIMEOUT_MS` | see `apps/api/src/config/env.ts`                 |                                                                    |

## Assumptions

The brief leaves some behaviour open. Each interpretation is recorded with its reasoning in
[ADR 0003](docs/decisions/0003-interpretation-of-open-requirements.md); the most visible ones:

- Users have an **email and password** (the User domain lists neither); the hash lives in a
  separate table.
- **Every signed-in user is an administrator**, as the brief says; nobody can deactivate or delete
  their own account.
- The **logins counter** counts sign-ins over time (not active sessions) and refreshes the last
  update time.
- **Status has its own endpoint and switch**, separate from editing names, so a single request
  never changes both.
- **Sessions are independent per device**; deactivating a user ends their sessions; sessions
  expire after 7 days.
- Without a session, the **sign-up page** is shown by default; log out lands on **sign-in**, as the
  brief describes.

Questions on the open points were sent to the challenge authors; the implementation follows the
stated assumptions until answered.

## Known limitations

- **Pull request approvals**: PRs are opened with the maintainer's own account, and GitHub does not
  allow approving your own PR, so the branch ruleset requires green checks and resolved
  conversations but cannot require an approval. The proper setup is a separate bot account (or
  GitHub App) for the coding agent with a required human approval; it was skipped to reduce setup
  friction under the deadline (see [CONTRIBUTING.md](CONTRIBUTING.md)).
- **Session ids are database keys**: the cookie value is the session's primary key, so a database
  leak would expose live sessions.
- **No password reset or change, no email change**; users created before credentials existed (Part
  0 data) get a placeholder email and cannot sign in.
- **Rate limiting is in memory**, per API instance; several instances would need a shared store.
- **Expired and terminated sessions are kept** without a cleanup job.
- **Theme preference is per browser**, not stored on the account.
- **Public demo**: anyone can sign up and change data; it is reset nightly. e2e runs on staging
  create `e2e-…@example.com` users until the next reset.
- The main JavaScript bundle (Mantine and the forms) is about 190 kB gzipped; the dashboard is a
  separate lazily loaded chunk.

## Future improvements

- Session management: list active sessions per user, "sign out everywhere else"; store only a hash
  of a separate random session token.
- Password reset and change via email; email verification; optional MFA or passkeys (new tables next
  to `user_credentials`, see ADR 0004).
- Roles and permissions instead of "every user is an administrator"; an audit log of changes.
- Search, sorting and filtering in the users table; server-side cursor pagination for very large
  sets.
- Observability: Sentry behind the existing `ErrorReporter` interfaces, metrics and tracing with
  OpenTelemetry, alerting on the readiness endpoint.
- Shared rate-limit store (Redis), a scheduled purge of old sessions.
- Preview environments per pull request; a bot account for agent-authored PRs with required
  approvals; visual regression and load tests.

## How this was built

This project was built with an AI coding agent (Claude Code) and a human maintainer in the loop,
which the brief explicitly allowed:

- The **maintainer** set the requirements and constraints, approved the plan and the
  [specification](docs/spec/README.md) before any feature code, reviewed every pull request,
  requested changes (for example both names required on profile updates, the separate status
  switch, the cookie-based session), merged, released and approved every production deployment.
- The **agent** wrote the code, tests and documentation against the approved spec, in small
  commits that explain their reasons, and ran an independent code review on each feature pull
  request; the findings and their fixes are part of the history.
- Commits carry a `Co-Authored-By` trailer; each pull request has an "AI assistance and human
  review" section stating what was verified.

[AGENTS.md](AGENTS.md) and [CLAUDE.md](CLAUDE.md) let a team's own agents work in this repository
with the same conventions and boundaries.

## License

[MIT](LICENSE)
