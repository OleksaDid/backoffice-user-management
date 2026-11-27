# 07. Non-functional requirements

## Platform

- **NFR-01** Node.js 22.12+ (developed on 24), TypeScript 5 strict, React 18+, Playwright 1.50+.
- **NFR-02** The whole stack runs with one command: `docker compose up`. Local development without
  Docker for the apps (only the database in Docker) is also supported.

## Security

- **NFR-10** Passwords hashed with scrypt and a per-user random salt; comparison in constant time
  (AUTH-11, AUTH-04).
- **NFR-11** Session credential in an httpOnly, Secure, SameSite=Strict cookie; CSRF origin checks
  (AUTH-20, AUTH-21).
- **NFR-12** Security headers on every response: Content-Security-Policy without `unsafe-inline`
  scripts, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors 'none'`, HSTS in production.
- **NFR-13** Input validated at the edge with the shared schemas; unknown fields rejected.
- **NFR-14** Rate limiting on authentication endpoints (AUTH-40).
- **NFR-15** Secrets come from the environment, never from the repository. Configuration is
  validated at startup and the process refuses to start with invalid configuration.
- **NFR-16** Containers run as a non-root user; images contain production dependencies only.

## Accessibility

- **NFR-20** Target WCAG 2.2 level AA.
- **NFR-21** Semantic HTML: landmarks, one `h1` per page, headings in order, real `table`, `nav`,
  `form`, `button` and `label` elements rather than generic elements with handlers.
- **NFR-22** Fully keyboard operable with a visible focus indicator; focus moves to the page heading
  after navigation and is managed in dialogs (DASH-60).
- **NFR-23** Form fields have visible labels; errors are linked to their fields and announced.
- **NFR-24** Respects `prefers-reduced-motion`; usable at 320 CSS pixels width and 200% zoom.
- **NFR-25** Automated checks: jsx-a11y lint rules (strict) and axe in end-to-end tests on every page
  in both themes, with no serious or critical violations.

## Operations

- **NFR-30** Structured JSON logs (pino) with a request id on every line; the id is returned in
  `x-request-id`. Secrets, passwords and cookies are redacted.
- **NFR-31** Liveness and readiness endpoints (HLT-01) used by container health checks.
- **NFR-32** Graceful shutdown on `SIGTERM`: stop accepting connections, finish in-flight requests
  within a timeout, close the database pool.
- **NFR-33** Environments: local, staging (`test-staging.oleksa.live`, deployed from `main`) and
  production (`test.oleksa.live`, deployed from releases with manual approval).
- **NFR-34** Demo data: a seed script creates sample users; public environments are reset nightly.

## Performance

- **NFR-40** Server-side pagination with an index matching the sort order; total count and page
  fetched in parallel; no N+1 queries.
- **NFR-41** Responses are serialized from schemas (fast serialization, no accidental extra fields).
- **NFR-42** The SPA is code-split per route; hashed static assets are served with long-lived
  immutable caching and compression; `index.html` is never cached.

## Quality

- **NFR-50** Tests at three levels: unit, integration (API against a real PostgreSQL), end-to-end
  (Playwright against the containerized stack). Test titles carry spec IDs.
- **NFR-51** Coverage thresholds enforced in CI: at least 80% of lines in the API and the web app.
- **NFR-52** Every pull request runs formatting, linting, type checking, all test levels and a Docker
  build before it can be merged.
