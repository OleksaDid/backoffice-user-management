# 0005. Session id in an httpOnly cookie

- Status: Accepted
- Date: 2026-11-27

## Context

The requirements treat the id returned by sign-in/sign-up as the session identifier that every
further request must include. The client could hold it (for example in `localStorage`, sent as an
`Authorization: Bearer` header), or the server could set it as a cookie.

## Decision

The API sets `sid=<session id>` as an `HttpOnly; Secure; SameSite=Strict; Path=/api` cookie on
sign-up and sign-in. The browser includes it in every API request automatically. The web app never
reads or stores the id. The response body still contains the session object, as the requirements
describe. CSRF is covered by `SameSite=Strict`, a same-origin deployment (the web server proxies
`/api`) and an `Origin` / `Sec-Fetch-Site` check on state-changing requests.

## Alternatives

- `localStorage` + bearer header: simple, but any XSS can read and exfiltrate the credential.
- In-memory token + refresh cookie: more moving parts than this application needs.

## Consequences

- Script injection cannot read the cookie. The id is exposed only in the sign-up and sign-in
  responses (AUTH-22); `GET /api/auth/me` deliberately omits it, otherwise any injected script
  could fetch it (found in review). A remaining window is an injected script that observes the
  sign-in response itself; tokens separate from the session id would close it.
- The web app learns whether a session is active from `GET /api/auth/me`.
- The session id doubles as the database key, so a database leak would expose live sessions.
  Storing only a hash of a separate random token is listed as a future improvement.
