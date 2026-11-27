# Behaviour specification

This folder is the single source of truth for **what** the system does. Code and tests follow it;
when they disagree, either the spec or the code is wrong, and the pull request says which.

## Documents

| Document                                                        | Scope                                             | Delivered in |
| --------------------------------------------------------------- | ------------------------------------------------- | ------------ |
| [01 Users and sessions API](01-users-and-sessions-api.md)       | User and Session domains, REST API                | Part 0       |
| [02 Authentication](02-authentication.md)                       | Credentials, cookie sessions, sign-up/in UI       | Part 1       |
| [03 User management dashboard](03-user-management-dashboard.md) | Listing, pagination, create, edit, status, delete | Part 2       |
| [04 Themes](04-themes.md)                                       | Light, dark and system themes, persistence        | Part 3       |
| [05 Errors](05-errors.md)                                       | Error model and catalog                           | all          |
| [06 Data model](06-data-model.md)                               | Tables and how they evolve through migrations     | all          |
| [07 Non-functional](07-non-functional.md)                       | Security, accessibility, operations, performance  | all          |

How the original challenge requirements map to these IDs: [acceptance criteria](../acceptance-criteria.md).
Assumptions behind interpretations: [decision log](../decisions/README.md).

## Conventions

- Every requirement has a stable **ID**: `<AREA>-<NN>`, for example `USR-07`. IDs are never reused;
  a removed requirement is struck through and marked as removed.
- Scenarios use **Given / When / Then** where behaviour has several paths.
- Tests reference IDs in their titles, for example `it('USR-07 rejects name changes for inactive users')`.
  The README's traceability matrix is generated from those titles.
- "Must" is a requirement. "Should" is a strong default that may be revisited with a decision record.

| Area      | Meaning                            |
| --------- | ---------------------------------- |
| `USR`     | users API                          |
| `SES`     | sessions API                       |
| `AUTH`    | authentication API                 |
| `UI-AUTH` | sign-up, sign-in and welcome pages |
| `DASH`    | user management dashboard          |
| `THEME`   | theming                            |
| `ERR`     | error handling                     |
| `HLT`     | health checks                      |
| `API`     | API documentation                  |
| `DATA`    | data model and migrations          |
| `NFR`     | non-functional requirements        |

## Glossary

| Term           | Meaning                                                                            |
| -------------- | ---------------------------------------------------------------------------------- |
| User           | A person who can sign in. Every signed-in user acts as an administrator.           |
| Active user    | A user with status `active`. Only active users can have sessions.                  |
| Session        | A sign-in of one user. Identified by its id, which is also the session credential. |
| Active session | A session with no termination time whose expiry time is in the future.             |
| Terminate      | End a session by setting its termination time. The session record is kept.         |
| Profile        | A user's first and last name.                                                      |
| Current user   | The user who owns the session of the request.                                      |
