# 0007. The session probe answers `null`s instead of 401

- Status: Accepted
- Date: 2026-11-28

## Context

On every load the web app calls `GET /api/auth/me` to learn whether a session is active
(UI-AUTH-01). For a visitor without a session the API answered `401 UNAUTHENTICATED`. The app
handled it correctly, but browsers log every failed request in the developer console, so the very
first page a new visitor opens showed a red error.

Two established conventions exist:

- **401**: the HTTP reading (RFC 9110) that `/me` is a protected resource. Token-based public
  APIs do this, for example GitHub `GET /user` and the OpenID Connect `userinfo` endpoint.
- **200 with an empty value**: `/me` is a probe asking "is there a session?", and "no" is a
  valid answer, not a failure. Libraries that serve a cookie session to their own front end do
  this, for example Auth.js `GET /api/auth/session`.

## Decision

`GET /api/auth/me` answers `200 { "user": null, "session": null }` when there is no active
session, and clears a cookie that no longer opens one (AUTH-07). Every other protected endpoint
keeps answering `401` (AUTH-08), and a 401 there still signs the user out in the app (UI-AUTH-12).

This API serves its own single-page app through an httpOnly cookie, and `/me` is only used as the
session probe, so the second convention fits.

## Alternatives

- Keep 401 and accept the console entry: correct, but every first visit looks like a failure.
- A separate always-200 `GET /api/auth/session` next to a 401 `/me`: the cleanest split, but two
  endpoints doing the same job in an application with a single client.
- Skip the request with a script-readable "signed in" hint cookie: avoids the call, but the hint
  can go stale and adds state that has to be kept in sync.

## Consequences

- No error in the console on a first visit (covered by an e2e test).
- `/me` is the one protected-looking endpoint without a 401; this record and AUTH-07/08 explain
  why. The web client still treats a 401 from `/me` as "signed out", so it also works against an
  API version from before this change.
