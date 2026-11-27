# Deployment

How the application runs on the staging and production servers. The server operator keeps a
reviewed, pinned copy of [`compose.server.yaml`](compose.server.yaml) and owns the deploy script;
this repository provides the images, this template and the GitHub Actions workflows. Any change to
the template is handed to the operator; deployments only change the image tag.

| Environment | URL                              | Deployed by                                                    |
| ----------- | -------------------------------- | -------------------------------------------------------------- |
| staging     | https://test-staging.oleksa.live | every push to `main` (`sha-<commit>` tag)                      |
| production  | https://test.oleksa.live         | every release (`vX.Y.Z` tag), after approval by the maintainer |

## Images

| Image                                              | Port | User     | Notes                                               |
| -------------------------------------------------- | ---- | -------- | --------------------------------------------------- |
| `ghcr.io/oleksadid/backoffice-user-management-web` | 8080 | uid 101  | nginx: SPA + reverse proxy for `/api` to `api:3000` |
| `ghcr.io/oleksadid/backoffice-user-management-api` | 3000 | uid 1000 | Node.js 24, heap capped at 384 MB                   |

- Platform `linux/amd64`. Tags: `sha-<40 hex>` for every push to `main`, `vX.Y.Z` for releases.
  A release tag points to the **same digest** that was deployed to staging (no rebuild).
- Both images run with `read_only: true` and a `tmpfs` on `/tmp`; nothing else is written.
- `web` resolves `api` through Docker DNS (`127.0.0.11`) at request time, so the API service must
  be reachable as `api` on a network shared with `web`.

## Commands

Run from the directory with the server's compose file. Both commands are non-interactive,
idempotent and exit non-zero on failure.

| Purpose                   | Command                                             | Available from |
| ------------------------- | --------------------------------------------------- | -------------- |
| Apply pending migrations  | `docker compose run --rm api npm run migrate`       | first image    |
| Reset demo data (nightly) | `docker compose run --rm api npm run db:reset-demo` | `v0.2.0`       |

`db:reset-demo` deletes all users and sessions and inserts a fixed set of demo users
(`firstname.lastname@example.com`, password `demo-password`). It never touches the schema.

## Environment variables

Values are not listed on purpose; secrets are generated on the server.

### `api`

| Variable                     | Required      | Purpose                                                                       | Format / default                        |
| ---------------------------- | ------------- | ----------------------------------------------------------------------------- | --------------------------------------- |
| `DATABASE_URL`               | yes           | PostgreSQL connection (secret: contains the password)                         | `postgres://user:pass@db:5432/name`     |
| `PUBLIC_ORIGIN`              | from `v0.3.0` | Public origin; state-changing requests from other origins are rejected (CSRF) | `https://test.oleksa.live`              |
| `AUTH_RATE_LIMIT_PER_MINUTE` | no            | Sign-in and sign-up attempts per client IP and minute                         | integer, default `10`                   |
| `COOKIE_SECURE`              | no            | Send the session cookie only over HTTPS; keep the default on servers          | `true` (default) or `false`             |
| `TRUST_PROXY_HOPS`           | no            | Proxies whose `X-Forwarded-*` headers are trusted (`web` = 1)                 | integer, default `0`; template sets `1` |
| `NODE_ENV`                   | no            | Runtime mode                                                                  | `production` (set in the image)         |
| `LOG_LEVEL`                  | no            | Log verbosity                                                                 | `info` (default), `warn`, `debug`, ...  |
| `DATABASE_POOL_MAX`          | no            | Maximum database connections                                                  | integer 1 to 100, default `10`          |
| `SHUTDOWN_TIMEOUT_MS`        | no            | Time to drain requests on `SIGTERM`                                           | milliseconds, default `10000`           |
| `SESSION_TTL_HOURS`          | no            | Absolute session lifetime (from `v0.2.0`)                                     | integer, default `168` (7 days)         |
| `HOST`, `PORT`               | no            | Listen address                                                                | `0.0.0.0`, `3000`                       |

There is no signing secret: the session id is a random UUID stored in the database, sent in an
`HttpOnly; Secure; SameSite=Strict` cookie. `Secure` cookies work because the API sees
`X-Forwarded-Proto: https` from the web server.

### `db`

`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (official `postgres:17-alpine` image).

### `web`

None.

## Network egress

The API needs **no internet access** (no SMTP, no external APIs). `api` and `db` can live on an
`internal: true` network; only `web` needs to be reachable by the tunnel.

## Health checks

| Endpoint (through web)                 | Meaning                                                                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `GET http://web:8080/api/health/ready` | `200` only when the API runs, the database answers and the newest migration bundled with the image is applied; otherwise `503` |
| `GET http://web:8080/api/health/live`  | `200` while the API process runs                                                                                               |
| `GET http://web:8080/healthz`          | `200` while nginx runs (used by the `web` image health check)                                                                  |

Both images also define a Docker `HEALTHCHECK`.

## Rollback and migrations

A rollback returns to the previous **images**; it never reverts the schema. Migrations therefore
follow expand/contract (spec 06, DATA-02):

- every migration is backward compatible with the **previous release's image**, so rolling back by
  one release after a migration is safe;
- constraints are tightened only in a later release, once no supported image writes data that
  would violate them.

Planned schema steps: `v0.1.0` creates the schema; `v0.3.0` adds nullable `email` and a
credentials table (a `v0.2.0` image keeps working); `v0.4.0` makes `email` required (a `v0.3.0`
image keeps working, a `v0.2.0` image would not). Rolling back more than one release across a
contract migration is not supported.

## Proxy and caching

Chain: Cloudflare edge → cloudflared → `web` (:8080, HTTP) → `api` (:3000).

- `web` passes `Host` and `X-Forwarded-Proto` through unchanged and sets `X-Forwarded-For` /
  `X-Real-IP` from `CF-Connecting-IP` (overwriting any client-supplied value). The API trusts one
  proxy hop.
- `/api/*` responses carry `Cache-Control: no-store`. `index.html` is `no-cache`; hashed files
  under `/assets/` are cached for a year.
- The SPA is served with a Content-Security-Policy without inline scripts, `frame-ancestors 'none'`
  and `X-Content-Type-Options: nosniff`. User input is rendered as text only and length-limited on
  the server.

## GitHub Actions

| Workflow       | Trigger                         | Does                                                                                                  |
| -------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `ci.yml`       | pull requests, pushes to `main` | checks, tests, image build, full-stack smoke test                                                     |
| `delivery.yml` | push to `main`                  | publish `sha-<commit>` images → deploy staging → full e2e on staging (3 browsers) → update release PR |
| `release.yml`  | release published (`vX.Y.Z`)    | retag the staging-tested images to `vX.Y.Z` → deploy production after approval                        |
| `deploy.yml`   | called by the two above         | Tailscale + SSH `deploy <env> <tag>`, smoke test, `rollback` on failure                               |

The release PR and the release itself are created with the `RELEASE_PLEASE_TOKEN` repository
secret (a fine-grained token with contents and pull request write access): events created with
the default `GITHUB_TOKEN` would not trigger CI on the release PR or the production workflow.

- Environments `staging` (branch `main`) and `production` (tags `v*.*.*`, required reviewer).
- Per environment: secrets `TS_OAUTH_CLIENT_ID`, `TS_OAUTH_SECRET`, `DEPLOY_SSH_KEY`; variables
  `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_KNOWN_HOSTS`. Each environment has its own key.
- The deploy job joins the tailnet as an ephemeral `tag:ci` node and runs
  `ssh <user>@<host> deploy <env> <tag>`; the server accepts only `deploy <env> <tag>` and
  `rollback <env>`.
- Deploy exit codes: `0` success, `1` health check failed and rolled back, `2` bad arguments,
  `3` another deployment in progress, `4` pull or migrate failed (nothing changed).
