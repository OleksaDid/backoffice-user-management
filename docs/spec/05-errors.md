# 05. Errors

One error model across the backend and the frontend, so every failure has a stable code, a clear
message and a single place where it is handled and reported.

## Response format

- **ERR-01** Every error response uses RFC 9457 problem details (`application/problem+json`):

  ```json
  {
    "type": "urn:backoffice:problem:user-name-locked",
    "title": "User name locked",
    "status": 409,
    "code": "USER_NAME_LOCKED",
    "detail": "First and last name cannot be changed while the user is inactive.",
    "requestId": "3f0c2b1e-7d7e-4a3e-9f1a-2c1f1f6a9b10",
    "errors": [{ "path": "firstName", "message": "..." }]
  }
  ```

  `errors` is present only for validation failures. `requestId` matches the `x-request-id` response
  header and the server logs.

- **ERR-02** Clients branch on `code`, never on `title` or `detail`.

## Catalog

The catalog lives in `packages/contracts` and is shared by the API and the web app.

| Code                          | HTTP | When                                            |
| ----------------------------- | ---- | ----------------------------------------------- |
| `VALIDATION_FAILED`           | 400  | malformed body, query or path; unknown fields   |
| `UNAUTHENTICATED`             | 401  | missing, unknown, terminated or expired session |
| `INVALID_CREDENTIALS`         | 401  | wrong email or password                         |
| `USER_INACTIVE`               | 403  | an inactive user tries to start a session       |
| `CSRF_REJECTED`               | 403  | cross-site state-changing request               |
| `USER_NOT_FOUND`              | 404  | unknown user id                                 |
| `SESSION_NOT_FOUND`           | 404  | unknown session id                              |
| `ROUTE_NOT_FOUND`             | 404  | unknown endpoint                                |
| `EMAIL_ALREADY_REGISTERED`    | 409  | email used by another user                      |
| `USER_NAME_LOCKED`            | 409  | profile change for an inactive user             |
| `SELF_MODIFICATION_FORBIDDEN` | 409  | deactivating or deleting one's own account      |
| `RATE_LIMITED`                | 429  | too many requests                               |
| `INTERNAL_ERROR`              | 500  | any unexpected error                            |
| `SERVICE_UNAVAILABLE`         | 503  | dependency down (readiness), server overloaded  |

Status code choices: `409` means a valid request that conflicts with the current state of the
resource (RFC 9110 §15.5.10); `400` is reserved for requests that are invalid on their own.

## Backend handling

- **ERR-10** Expected failures are thrown as `AppError` subclasses carrying a catalog code. Services
  and domain code never build HTTP responses.
- **ERR-11** One central error handler converts errors to problem details. Validation errors from
  the schemas become `VALIDATION_FAILED` with field paths. Anything that is not an `AppError` becomes
  `500 INTERNAL_ERROR` with a generic message; stack traces and internal messages never reach the
  client in production.
- **ERR-12** Errors are reported through an injected `ErrorReporter` interface. The default
  implementation writes structured logs (code, message, stack, request id, method, route, user id).
  It can be replaced (for example with Sentry) without changing call sites. Unexpected errors and
  5xx are reported at `error` level; expected 4xx are logged at `info`.
- **ERR-13** Process-level handlers catch `uncaughtException` and `unhandledRejection`, report them,
  and shut the process down gracefully with a non-zero exit code so the container restarts cleanly.
- **ERR-14** Unknown routes return `404 ROUTE_NOT_FOUND` in the same format.

## Frontend handling

- **ERR-20** The API client turns problem details into a typed `ApiError` with `code`, `status`,
  `detail` and field `errors`. Network failures become a distinct, retryable error.
- **ERR-21** User-facing messages are mapped from `code` in one place; field errors go to the
  matching form field.
- **ERR-22** A root error boundary and per-route error boundaries render an accessible fallback with
  a way to recover instead of a blank page.
- **ERR-23** `window` `error` and `unhandledrejection` events, and errors caught by boundaries, go to
  a frontend `ErrorReporter` with the same interface as the backend (console by default).
