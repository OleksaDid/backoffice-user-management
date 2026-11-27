import { localStorageColorSchemeManager } from '@mantine/core';

/** Storage key of the theme choice; public/theme-init.js reads the same key. */
export const THEME_STORAGE_KEY = 'backoffice-color-scheme';

/**
 * THEME-03, THEME-07: the choice ('light', 'dark' or 'auto' for System) is kept in
 * localStorage; Mantine's manager tolerates unavailable storage and syncs other tabs.
 */
export const colorSchemeManager = localStorageColorSchemeManager({ key: THEME_STORAGE_KEY });
