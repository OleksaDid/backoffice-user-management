# Back-office User Management

A back-office application for registering and managing users: a Fastify REST API and a React
single-page app sharing typed contracts, backed by PostgreSQL.

> Work in progress: the users and sessions API (Part 0) is in place; the UI arrives part by part.

## Live environments

- Production: https://test.oleksa.live (deployed from releases)
- Staging: https://test-staging.oleksa.live (deployed from `main`)

## Quick start

Requirements: Docker with Compose v2.

```bash
docker compose up --build
open http://localhost:8080                     # web app
curl http://localhost:8080/api/health/ready   # {"status":"ok",...}
open http://localhost:8080/api/docs           # OpenAPI UI
docker compose run --rm api npm run db:reset-demo   # optional: 20 demo users
```

## API

Full, interactive reference: `/api/docs` (OpenAPI 3.1, generated from the validation schemas).
Errors use RFC 9457 problem details with a stable `code` ([error catalog](docs/spec/05-errors.md)).

| Method | Path                         | Purpose                                           | Spec         |
| ------ | ---------------------------- | ------------------------------------------------- | ------------ |
| GET    | `/api/users?page&pageSize`   | List users, newest first (default 6 per page)     | USR-03 to 06 |
| POST   | `/api/users`                 | Create a user                                     | USR-01, 02   |
| PATCH  | `/api/users/:id`             | Update first/last name (locked while inactive)    | USR-07 to 09 |
| PUT    | `/api/users/:id/status`      | Activate/deactivate (deactivation ends sessions)  | USR-10, 11   |
| DELETE | `/api/users/:id`             | Delete a user and their sessions                  | USR-13       |
| POST   | `/api/sessions`              | Create a session for an active user (Part 0 only) | SES-01 to 03 |
| DELETE | `/api/sessions/:id`          | Terminate a session (idempotent)                  | SES-04 to 06 |
| GET    | `/api/health/live`, `/ready` | Liveness; readiness incl. database and migrations | HLT-01       |

## Development

Requirements: Node.js 22.12+ (`nvm use` picks 24), Docker for the database and integration tests.

```bash
npm install
docker compose -f compose.yaml -f compose.dev.yaml up -d db
cp apps/api/.env.example apps/api/.env
npm run dev:migrate -w @backoffice/api
npm run dev -w @backoffice/api                 # API on :3000
npm run dev -w @backoffice/web                 # web on :5173, proxies /api
npm test                                       # unit + integration (Testcontainers)
```

## Documentation

- [Behaviour specification](docs/spec/README.md)
- [Acceptance criteria mapped to the spec](docs/acceptance-criteria.md)
- [Contributing and delivery workflow](CONTRIBUTING.md)
- [Deployment: environments, images, configuration](deploy/README.md)
- [Decision log](docs/decisions/README.md)
- [Guidance for AI coding agents](AGENTS.md)

## License

[MIT](LICENSE)
