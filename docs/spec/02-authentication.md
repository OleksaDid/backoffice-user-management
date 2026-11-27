# 02. Authentication (Part 1)

Users register and sign in with an email and a password. A successful sign-up or sign-in creates a
session whose id is the session credential. The backend sets it in an httpOnly cookie, so the
browser sends it with every further request and page scripts cannot read it.

## Credentials

- **AUTH-10** A user has an `email`: required, valid format, at most 254 characters, stored
  lower-cased, unique regardless of case. `email` is part of the user DTO.
- **AUTH-11** A password is 8 to 128 characters with no composition rules. It is stored only as a
  salted, memory-hard hash in a separate credentials record, and never returned by any endpoint or
  written to logs.
- **AUTH-12** `POST /api/users` (USR-01) additionally requires `email` and an initial `password`,
  so every user can sign in. A duplicate email returns `409 EMAIL_ALREADY_REGISTERED`.

## Sign-up

- **AUTH-01** `POST /api/auth/sign-up` with `firstName`, `lastName`, `email`, `password` creates an
  active user, their credentials and a session in one transaction. It returns `201` with
  `{ user, session }` and sets the session cookie (AUTH-20). The new user's `loginsCount` is 1.
- **AUTH-02** A duplicate email returns `409 EMAIL_ALREADY_REGISTERED`; nothing is created. The
  password confirmation is a client-side check (UI-AUTH-04); the API receives one password.

## Sign-in

- **AUTH-03** `POST /api/auth/sign-in` with `email` and `password` creates a session for an active
  user, returns `200` with `{ user, session }`, sets the session cookie and increments
  `loginsCount` (SES-03).
- **AUTH-04** An unknown email or a wrong password returns `401 INVALID_CREDENTIALS` with the same
  message and comparable response time, so the response does not reveal which part was wrong.
- **AUTH-05** Correct credentials for an inactive user return `403 USER_INACTIVE` (USR rule: inactive
  users cannot create sessions). The status is revealed only after the password was verified.

## Session lifecycle

- **AUTH-06** `POST /api/auth/sign-out` terminates the current session (SES-04), clears the cookie
  and returns `204`. Without a valid session it still clears the cookie and returns `204`.
- **AUTH-07** `GET /api/auth/me` returns `200` with `{ user, session }` for an active session.
- **AUTH-08** Every endpoint except sign-up, sign-in, sign-out, health and API docs requires an
  active session. A missing, unknown, terminated or expired session returns `401 UNAUTHENTICATED`.
- **AUTH-09** `POST /api/sessions` (SES-01) is removed: creating a session for an arbitrary user id
  would let any signed-in user impersonate another. `DELETE /api/sessions/:id` remains, requires
  authentication, and terminating one's own current session has the same effect as signing out.

## Cookie and CSRF

- **AUTH-20** The session cookie is `sid=<session id>` with `HttpOnly`, `Secure`, `SameSite=Strict`,
  `Path=/api` and `Max-Age` equal to the remaining session lifetime. `Secure` can be disabled by
  configuration only for local plain-HTTP development.
- **AUTH-21** State-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) are rejected with
  `403 CSRF_REJECTED` when the `Origin` header is present and is not the configured public origin,
  or when `Sec-Fetch-Site` is `cross-site`.
- **AUTH-22** The response body of sign-up and sign-in includes the `session` object (with its id),
  as the original requirements describe. The web app does not read or store it.

## Self-management

- **AUTH-30** A user cannot deactivate (USR-10) or delete (USR-13) their own account: `409
SELF_MODIFICATION_FORBIDDEN`. This prevents locking oneself out mid-action. (Assumption, asked to
  the challenge authors; see the decision log.)

## Abuse protection

- **AUTH-40** Sign-up and sign-in are rate limited per client IP (default 10 requests per minute);
  excess requests return `429 RATE_LIMITED` with `Retry-After`.

---

## Web: sign-up, sign-in and welcome (UI-AUTH)

### Routing

- **UI-AUTH-01** Routes: `/sign-up`, `/sign-in`, `/` (protected). On load the app asks
  `GET /api/auth/me` to learn whether a session is active, showing a loading state meanwhile.
- **UI-AUTH-02** Without an active session, `/` and unknown routes redirect to `/sign-up` (the
  sign-up page is presented by default). With an active session, `/sign-up` and `/sign-in` redirect
  to `/`.
- **UI-AUTH-03** Sign-up and sign-in link to each other. Switching is client-side, without a full
  page reload, and moves focus to the new page's heading.

### Sign-up form

- **UI-AUTH-04** Fields: first name, last name, email, password, confirm password. If the passwords
  do not match, the form shows an error on the confirmation field and **does not call the API**.
- **UI-AUTH-05** Fields are validated with the shared schemas before submit; errors are shown next to
  the field, linked with `aria-describedby`, and focus moves to the first invalid field.
- **UI-AUTH-06** `409 EMAIL_ALREADY_REGISTERED` is shown on the email field. Other errors are shown
  as a form-level alert.
- **UI-AUTH-07** While a request is in flight the submit button shows a loading state and repeated
  submission is not possible.

### Sign-in form

- **UI-AUTH-08** Fields: email, password. `401` shows "Invalid email or password." and `403` shows
  that the account is inactive, as a form-level alert.

### After authentication

- **UI-AUTH-09** After a successful sign-up or sign-in the user is forwarded to `/`.
- **UI-AUTH-10** `/` shows `Hello <first_name>` as the page heading. (Part 2 replaces this page with
  the dashboard and keeps the greeting, see DASH-01.)
- **UI-AUTH-11** A **Log out** button is visible on every authenticated page. It calls sign-out and
  navigates to `/sign-in`, also when the request fails.
- **UI-AUTH-12** When any API call returns `401` (session expired or terminated elsewhere), the app
  drops its session state and navigates to `/sign-in` with a notice that the session has ended.
