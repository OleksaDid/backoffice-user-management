// THEME-04: applies the stored colour scheme before the first paint, so the page never
// flashes the other theme. Loaded as a blocking same-origin script (the CSP forbids
// inline scripts). Must stay in sync with THEME_STORAGE_KEY in src/app/theme-preference.ts.
(function () {
  var stored = null;
  try {
    stored = window.localStorage.getItem('backoffice-color-scheme');
  } catch {
    // THEME-07: storage unavailable (privacy mode, blocked cookies): fall back to system.
  }
  var preference = stored === 'light' || stored === 'dark' ? stored : 'auto';
  var dark =
    preference === 'dark' ||
    (preference === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-mantine-color-scheme', dark ? 'dark' : 'light');
})();
