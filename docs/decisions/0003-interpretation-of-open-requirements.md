# 0003. Interpretation of open requirements

- Status: Accepted (items marked "asked" await confirmation from the challenge authors)
- Date: 2026-11-27

## Context

Some requirements leave room for interpretation or are silent on behaviour the implementation has
to define. Clarifying questions were sent to the challenge authors on 2026-11-27. Work continues on
the assumptions below so the timeline is not affected; answers that differ lead to a new record.

## Decisions

| #   | Question                                                                     | Decision                                                                                                                                                                                                  | Spec                   |
| --- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 1   | The User domain has no credentials, but sign-in needs a password. **Asked.** | Add `email` to the user; keep the password hash in a separate `user_credentials` table (see 0004).                                                                                                        | AUTH-10, AUTH-11       |
| 2   | Can users created from the dashboard sign in?                                | Yes. The administrator sets an initial password.                                                                                                                                                          | AUTH-12                |
| 3   | When does the logins counter increase?                                       | On every session creation, including the one created by sign-up.                                                                                                                                          | SES-03, AUTH-01        |
| 4   | Does a counter increment refresh the last update time? **Asked.**            | Yes: "last update time must always be updated" is read literally for every write to the user.                                                                                                             | USR-12                 |
| 5   | Name rule when a request reactivates a user and renames them                 | Not possible by design: profile and status have separate endpoints and separate UI controls, so one request never does both.                                                                              | USR-08, DASH-40        |
| 6   | What happens to open sessions when a user is deactivated?                    | They are terminated in the same transaction; otherwise an existing session would bypass "inactive users cannot create sessions".                                                                          | USR-11                 |
| 7   | Roles: is every signed-in user an administrator?                             | Yes, no roles. Role-based access control is a future improvement.                                                                                                                                         | 03                     |
| 8   | Can users deactivate or delete themselves? **Asked.**                        | No, to prevent locking oneself out mid-action.                                                                                                                                                            | AUTH-30                |
| 9   | Session lifetime is unspecified.                                             | Absolute TTL, 7 days by default, configurable; expired equals terminated.                                                                                                                                 | 01 Session             |
| 10  | How is the session id sent with further requests?                            | In an httpOnly cookie set by the backend (see 0005). The id is still returned in the response body.                                                                                                       | AUTH-20, AUTH-22       |
| 11  | "Fetch all users" vs 6 users per page                                        | Server-side pagination; the web app requests 6 per page.                                                                                                                                                  | USR-03, DASH-11        |
| 12  | Hard or soft delete?                                                         | Hard delete; sessions and credentials cascade. Terminated sessions are kept while the user exists.                                                                                                        | USR-13                 |
| 13  | Which fields are editable?                                                   | First and last name (profile) and status. Changing email or password is a future improvement.                                                                                                             | USR-07, USR-10         |
| 14  | No session shows sign-up, but log out goes to the "Login page"               | Implemented literally: unauthenticated visits land on sign-up; log out lands on sign-in.                                                                                                                  | UI-AUTH-02, UI-AUTH-11 |
| 15  | Theme persistence scope                                                      | Per browser (`localStorage`); works before signing in.                                                                                                                                                    | THEME-03               |
| 16  | Password policy                                                              | 8 to 128 characters, no composition rules (NIST SP 800-63B).                                                                                                                                              | AUTH-11                |
| 17  | Status code for duplicates and rule conflicts                                | `409 Conflict`: the request is valid but conflicts with the resource state. `400` only for invalid requests.                                                                                              | 05                     |
| 18  | What happens when a user signs in on another device?                         | Sessions are independent: a new sign-in adds a session and keeps the others (the common default, e.g. most web platforms). Single-session or capped sessions were rejected as friction for a back-office. | AUTH-23                |

## Consequences

- The API in Part 0 (no authentication) differs from Part 1: `POST /api/users` gains required
  fields and `POST /api/sessions` is removed. The API is pre-1.0, and the change is documented in
  the changelog.
- If the authors answer differently on items 1, 4 or 8, only the listed spec IDs and their tests
  change.
