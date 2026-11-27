import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Imported through Vite as text, so the test works from any working directory.
import themeInitScript from '../../public/theme-init.js?raw';
import { THEME_STORAGE_KEY } from '../app/theme-preference';
import { fakeUsersApi } from '../test/fake-users-api';
import { mockSession, renderApp } from '../test/render-app';
import { setupMockServer } from '../test/server';

setupMockServer();

beforeEach(() => {
  fakeUsersApi();
  mockSession(null);
});

afterEach(() => {
  window.localStorage.clear();
});

function scheme() {
  return document.documentElement.getAttribute('data-mantine-color-scheme');
}

describe('theme switcher', () => {
  it('THEME-01 is a labelled radio group with Light, Dark and System', async () => {
    renderApp('/sign-up');
    const group = await screen.findByRole('radiogroup', { name: 'Theme' });
    for (const name of ['Light', 'Dark', 'System']) {
      expect(screen.getByRole('radio', { name })).toBeInTheDocument();
    }
    expect(group).toBeVisible();
  });

  it('THEME-02 System is the default', async () => {
    renderApp('/sign-up');
    expect(await screen.findByRole('radio', { name: 'System' })).toBeChecked();
  });

  it('THEME-03 the choice is applied and stored', async () => {
    const { user } = renderApp('/sign-up');
    await user.click(await screen.findByRole('radio', { name: 'Dark' }));

    await waitFor(() => {
      expect(scheme()).toBe('dark');
    });
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('THEME-03 a stored choice is restored when the app opens again', async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    renderApp('/sign-up');

    expect(await screen.findByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(scheme()).toBe('dark');
  });

  it('THEME-07 works when storage is unavailable', async () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('SecurityError: storage disabled');
      },
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      const { user } = renderApp('/sign-up');
      await user.click(await screen.findByRole('radio', { name: 'Dark' }));
      await waitFor(() => {
        expect(scheme()).toBe('dark');
      });
      // Mantine reports the failed write instead of throwing.
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('unable to save color scheme'),
        expect.anything(),
      );
    } finally {
      warn.mockRestore();
      if (original) {
        Object.defineProperty(window, 'localStorage', original);
      }
    }
  });
});

describe('theme init script', () => {
  it('THEME-04 reads the same storage key as the app', () => {
    expect(themeInitScript).toContain(`'${THEME_STORAGE_KEY}'`);
  });
});
