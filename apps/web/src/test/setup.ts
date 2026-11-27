import '@testing-library/jest-dom/vitest';

import { notifications } from '@mantine/notifications';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
  // The notifications store is global: without this, earlier tests fill the visible
  // limit and later notifications wait in the queue.
  notifications.clean();
  notifications.cleanQueue();
});

// jsdom lacks these browser APIs; Mantine uses them for color scheme and layout.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  // Reduced motion: Mantine then skips transitions, so dialogs are visible immediately.
  value: (query: string) => ({
    matches: query.includes('prefers-reduced-motion: reduce'),
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

window.ResizeObserver = class {
  observe = () => undefined;
  unobserve = () => undefined;
  disconnect = () => undefined;
};
