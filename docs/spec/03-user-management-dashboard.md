# 03. User management dashboard (Part 2)

The signed-in user is an administrator and manages every user in the platform. The dashboard
replaces the welcome page from Part 1.

## Layout and access

- **DASH-01** `/` shows the dashboard for signed-in users only (UI-AUTH-02 redirects everyone else).
  The page header keeps the `Hello <first_name>` greeting, the theme switcher (THEME-01) and the
  Log out button (UI-AUTH-11).
- **DASH-02** Landmarks: `header`, `main` (with the page `h1`), and a skip link to the main content.

## Listing and pagination

- **DASH-10** Users are shown in a table with a caption and these columns: name, email, status,
  logins, created, last updated, actions. The current user's row is marked with a "You" badge.
- **DASH-11** The table shows **6 users per page**, requested from the API with `pageSize=6`
  (server-side pagination, USR-03).
- **DASH-12** The page number is part of the URL (`/?page=2`), so reload, back/forward and sharing
  keep the page. A missing or invalid `page` shows page 1.
- **DASH-13** Pagination controls sit in a `nav` labelled "Pagination", with previous/next and page
  buttons; the current page has `aria-current="page"`. Controls are hidden when there is one page.
- **DASH-14** If the requested page is beyond the last page (for example after deleting the last
  user on it), the app moves to the last existing page.
- **DASH-15** While the next page loads, the previous rows stay visible with a busy indicator, so the
  layout does not jump. Loading, empty ("No users yet") and error (with a Retry button) states exist.
- **DASH-16** Dates are shown in the viewer's locale, with the full timestamp available on hover and
  to assistive technology (`<time datetime>`).

## Create a user

- **DASH-20** A "Create user" button opens a modal dialog with first name, last name, email,
  password and confirm password (same validation as UI-AUTH-04 and UI-AUTH-05). No avatar.
- **DASH-21** On success the dialog closes, a success notification is announced, and the list is
  refreshed (the new user appears on page 1, USR-05). `409 EMAIL_ALREADY_REGISTERED` is shown on the
  email field and the dialog stays open.

## Edit a user

- **DASH-30** Each row has an "Edit" action that opens a dialog with first and last name prefilled.
  No avatar.
- **DASH-31** For an inactive user the name fields are read-only and the dialog explains that the
  user must be activated first (USR-09). Status is not part of this dialog.
- **DASH-32** On success the dialog closes, a notification is announced and the row updates.

## Activate or deactivate

- **DASH-40** Each row has a status switch, labelled with the user's name, that calls
  `PUT /api/users/:id/status` immediately (USR-10). It is separate from the edit dialog, so profile
  and status are never changed in one request.
- **DASH-41** The switch is disabled on the current user's own row, with an explanation (AUTH-30).
- **DASH-42** On failure the switch returns to its previous state and an error is announced.

## Delete a user

- **DASH-50** Each row has a "Delete" action that opens a confirmation dialog naming the user. The
  destructive button is visually distinct; Cancel is the default focus.
- **DASH-51** On success the dialog closes, a notification is announced and the list refreshes
  (DASH-14 applies). The action is disabled on the current user's own row (AUTH-30).

## Common behaviour

- **DASH-60** Dialogs trap focus, close with Escape, and return focus to the control that opened
  them.
- **DASH-61** Notifications are announced through a polite live region and do not steal focus.
- **DASH-62** After any successful mutation the affected list data is refetched; there is no stale
  data after create, edit, status change or delete.
