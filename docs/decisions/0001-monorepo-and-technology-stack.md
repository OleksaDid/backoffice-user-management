# 0001. Monorepo and technology stack

- Status: Accepted
- Date: 2026-11-27

## Context

The system has a Node.js REST API and a React SPA that share data models (users, sessions, errors).
Required: Node.js 22+, TypeScript 5+, React 18+, Playwright 1.50+, containerized delivery. The
evaluation values best practices, efficiency and production readiness.

## Decision

- **One npm workspaces monorepo**: `apps/api`, `apps/web`, `packages/contracts`, `e2e`. Plain npm
  keeps the setup free of extra tools for reviewers.
- **Shared contracts**: zod schemas in `packages/contracts` are the single source of truth for
  request/response shapes and error codes. The API validates and serializes with them; the web app
  uses the inferred types and the same validation rules in forms.
- **API: Fastify 5** with `fastify-type-provider-zod`, OpenAPI generated from the same schemas,
  and first-party plugins for cookies, security headers and rate limiting. Hono was considered for
  its typed RPC client; typed RPC is not needed because the contracts package already shares types.
- **Persistence: PostgreSQL 17 with Drizzle ORM** and committed SQL migrations.
- **Web: React 19, Vite, React Router, TanStack Query, react-hook-form, Mantine** (design tokens as
  CSS variables, accessible components, built-in color scheme management).
- **Tests: Vitest** (unit, integration with Testcontainers) and **Playwright** with axe for e2e
  and accessibility.
- **TypeScript 5.9** (not 7.x yet) for compatibility with typescript-eslint; **ESLint 9** because
  eslint-plugin-jsx-a11y does not support ESLint 10 yet.

## Consequences

- Changing a contract breaks the build of whichever side is out of date, which is the point.
- Both apps are versioned and released together.
- A small hand-written API client is needed in the web app (no code generation).
