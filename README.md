# Back-office User Management

A back-office application for registering and managing users: a Fastify REST API and a React
single-page app sharing typed contracts, backed by PostgreSQL.

> Work in progress: the API foundation is in place; features arrive part by part.

## Quick start

Requirements: Docker with Compose v2.

```bash
docker compose up --build
curl http://localhost:3000/api/health/ready   # {"status":"ok",...}
open http://localhost:3000/api/docs           # OpenAPI UI
```

## Development

Requirements: Node.js 22.12+ (`nvm use` picks 24), Docker for the database and integration tests.

```bash
npm install
docker compose -f compose.yaml -f compose.dev.yaml up -d db
cp apps/api/.env.example apps/api/.env
npm run dev:migrate -w @backoffice/api
npm run dev -w @backoffice/api
npm test                                       # unit + integration (Testcontainers)
```

## Documentation

- [Behaviour specification](docs/spec/README.md)
- [Acceptance criteria mapped to the spec](docs/acceptance-criteria.md)
- [Contributing and delivery workflow](CONTRIBUTING.md)
- [Decision log](docs/decisions/README.md)
- [Guidance for AI coding agents](AGENTS.md)

## License

[MIT](LICENSE)
