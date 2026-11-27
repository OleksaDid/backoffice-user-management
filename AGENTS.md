# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, Cursor, Copilot and others) working in this
repository. Humans may find it a useful map too. Keep it accurate: update it in the same PR that
changes a command, a convention or the architecture.

## Project

Back-office user management: a Fastify REST API (users, sessions, authentication) and a React SPA
(sign-up/sign-in, user management dashboard, light/dark themes), backed by PostgreSQL.

## Repository map

| Path                 | What lives there                                                      |
| -------------------- | --------------------------------------------------------------------- |
| `apps/api`           | Fastify service: `http` → `services` → `domain` ← `repositories`      |
| `apps/web`           | React SPA (Vite, Mantine, React Router, TanStack Query)               |
| `packages/contracts` | zod schemas, DTO types and the error catalog shared by api and web    |
| `e2e`                | Playwright tests, tagged `@full` and `@smoke`                         |
| `docs/spec`          | behaviour specification; every scenario has an ID like `AUTH-05`      |
| `docs/decisions`     | decision log (ADRs), including assumptions about unclear requirements |
| `.github`            | CI/CD workflows, PR template, CODEOWNERS                              |

Directories appear as the corresponding pull requests land; check that a path exists before using it.

## Commands

Requires Node.js 22.12+ (`.nvmrc` pins 24) and Docker for integration and e2e tests.

```bash
npm install                      # install all workspaces and git hooks
npm run format                   # Prettier write
npm run lint                     # ESLint (type-aware)
npm run typecheck                # tsc in every workspace
npm test                         # unit + integration tests (integration needs Docker)
npm run check:branch             # validate the current branch name

docker compose up --build        # full stack, production-like
docker compose -f compose.yaml -f compose.dev.yaml up -d db   # database only, for dev
npm run dev -w @backoffice/api           # API with reload (copy apps/api/.env.example to .env)
npm run dev -w @backoffice/web           # web dev server on :5173, proxies /api to :3000
npm run dev:migrate -w @backoffice/api   # apply migrations in dev
npm run dev:reset-demo -w @backoffice/api  # replace data with 20 demo users
npm run db:generate -w @backoffice/api -- --name <change>   # new migration from schema.ts
```

## How we build features (spec-driven)

1. Behaviour is specified in `docs/spec` first, with IDs and Given/When/Then scenarios.
2. Contracts next: zod schemas and error codes in `packages/contracts`.
3. Tests reference spec IDs in their titles: `it('AUTH-05 rejects mismatched passwords', ...)`.
   Scaffolding may start as `it.todo(...)`, so every commit stays green.
4. Implementation, then docs.

Do not implement behaviour that is not in the spec. If the spec is unclear or wrong, propose a spec
change in the same PR and call it out in the PR description.

## Conventions

- TypeScript strict everywhere; no `any`, no non-null assertions to silence the compiler.
- Validate at the edge with the shared zod schemas; domain code receives typed, valid input.
- Domain rules are pure functions in `apps/api/src/domain` with no I/O.
- Errors: throw `AppError` subclasses with a code from the error catalog. Never return ad-hoc
  error shapes; the central error handler produces RFC 9457 problem details.
- Logging goes through the injected logger or `ErrorReporter`, never `console.*`.
- Database changes only through new migrations generated from `apps/api/src/db/schema.ts`. Never
  edit a migration that has been merged; follow expand/contract (spec 06, DATA-02).
- Accessibility is a requirement: semantic HTML, labelled controls, keyboard support. The jsx-a11y
  lint rules and axe checks in e2e must pass.
- English for all code, comments, docs and UI text.

## Git workflow

Read [CONTRIBUTING.md](CONTRIBUTING.md). In short:

- Branch `<type>/<kebab-description>` from `main`; never commit to `main` directly.
- Small Conventional Commits (`feat(api): ...`) whose bodies explain why.
- Open a PR with the template filled in, including the "AI assistance and human review" section.
- A human reviews and merges every PR. Do not merge, approve or force-push protected branches.

## Boundaries

- Never commit secrets, tokens, real personal data or `.env` files. Use `.env.example` for
  documenting configuration.
- Do not disable lint rules, tests or CI checks to make a change pass; fix the cause or ask.
- Do not change CI/CD deployment workflows or infrastructure files unless the task is about them.

## Definition of done

- Spec updated, tests added (unit, integration or e2e as appropriate) with spec IDs.
- `npm run format:check && npm run lint && npm run typecheck && npm test` pass locally.
- Docs updated for changed behaviour, commands or decisions.
