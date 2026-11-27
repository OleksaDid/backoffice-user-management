# 04. Themes (Part 3)

- **THEME-01** A theme switcher with three options, **Light**, **Dark** and **System**, is available
  in the header of every page, including sign-up and sign-in. It is a labelled radio group, operable
  with the keyboard.
- **THEME-02** **System** follows the operating system preference (`prefers-color-scheme`) and
  reacts when it changes while the app is open. It is the default.
- **THEME-03** The chosen option is stored in the browser (`localStorage`) and restored when the app
  is reopened, in any tab, before and after signing in.
- **THEME-04** The stored theme is applied before the first paint, so there is no flash of the other
  theme on load.
- **THEME-05** Both themes meet WCAG 2.2 AA contrast; automated accessibility checks run in both.
- **THEME-06** Native controls and scrollbars follow the theme (`color-scheme`).
- **THEME-07** If browser storage is unavailable, the switcher still works for the current visit and
  the app falls back to System without errors.

The preference is per browser, not per account: it applies before signing in, and needs no API.
