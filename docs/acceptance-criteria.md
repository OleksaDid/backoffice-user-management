# Acceptance criteria

The original challenge requirements, paraphrased, with the spec IDs that implement them. The README's
traceability matrix links each spec ID further to its tests.

## Part 0: Backend

| Requirement                                                                                              | Spec                               |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Node.js service exposing REST APIs for users and sessions                                                | 01, API-01                         |
| User: id, first name, last name, status (active/inactive), logins counter, creation and last update time | 01 User, DATA                      |
| Session: id, user id, creation time, termination time                                                    | 01 Session, DATA                   |
| Create a user                                                                                            | USR-01, USR-02, AUTH-12            |
| Fetch all users                                                                                          | USR-03 to USR-06                   |
| Update a user's info                                                                                     | USR-07, USR-08, USR-10             |
| Remove a user                                                                                            | USR-13                             |
| Create a session                                                                                         | SES-01 to SES-03, AUTH-01, AUTH-03 |
| Terminate a session                                                                                      | SES-04 to SES-06, AUTH-06          |
| Creation time cannot be updated; last update time must always be updated                                 | USR-02, USR-08, USR-12, DATA-10    |
| First and last name cannot be updated while the user is inactive                                         | USR-09, DASH-31                    |
| Inactive users cannot create sessions                                                                    | SES-02, AUTH-05, USR-11            |

## Part 1: Sign-up and sign-in

| Requirement                                                                                         | Spec                         |
| --------------------------------------------------------------------------------------------------- | ---------------------------- |
| React app to register and log in                                                                    | 02                           |
| Active session: forward to a welcome page showing `Hello <first_name>`                              | UI-AUTH-02, UI-AUTH-10       |
| No active session: the sign-up page is presented                                                    | UI-AUTH-02                   |
| Seamless navigation between sign-up and sign-in                                                     | UI-AUTH-03                   |
| Password entered twice and checked by the app before calling sign-up                                | UI-AUTH-04                   |
| After sign-in or sign-up, a session is established and the user forwarded to the welcome page       | AUTH-01, AUTH-03, UI-AUTH-09 |
| Log Out button ends the session and navigates to the login page                                     | AUTH-06, UI-AUTH-11          |
| The id from the sign-in/sign-up response is the session identifier included in all further requests | AUTH-08, AUTH-20, AUTH-22    |

## Part 2: User management dashboard

| Requirement                                                             | Spec                                   |
| ----------------------------------------------------------------------- | -------------------------------------- |
| The logged-in user is an administrator managing all users               | 03, AUTH-30                            |
| List all users, 6 per page, with pagination                             | DASH-10 to DASH-16                     |
| Update a user's information (no avatar)                                 | DASH-30 to DASH-32, DASH-40 to DASH-42 |
| Create a user (no avatar)                                               | DASH-20, DASH-21                       |
| Delete a user                                                           | DASH-50, DASH-51                       |
| Dashboard replaces the welcome page; only logged-in users can access it | DASH-01, UI-AUTH-02, AUTH-08           |

## Part 3: Themes

| Requirement                                                     | Spec               |
| --------------------------------------------------------------- | ------------------ |
| Theme selection, for example dark or light                      | THEME-01, THEME-02 |
| The selected theme persists after closing and reopening the app | THEME-03, THEME-04 |

## Part 4: Testing

| Requirement                                       | Spec             |
| ------------------------------------------------- | ---------------- |
| Automated tests guarantee the described behaviour | NFR-50 to NFR-52 |

## General acceptance criteria

| Requirement                                              | Spec / location          |
| -------------------------------------------------------- | ------------------------ |
| Reasonable test coverage                                 | NFR-50, NFR-51           |
| Containerized                                            | NFR-02, NFR-16           |
| Delivered as a git repository                            | this repository          |
| README with all necessary documentation and instructions | README.md                |
| Node.js 22+, TypeScript 5+, React 18+, Playwright 1.50+  | NFR-01                   |
| Granular changes with explanations                       | CONTRIBUTING.md, history |
| Future improvements and known limitations documented     | README.md                |
| English throughout; no third-party brand references      | whole repository         |
