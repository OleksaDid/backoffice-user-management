import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';
import { theme } from './theme';

function renderApp() {
  return render(
    <MantineProvider theme={theme}>
      <App />
    </MantineProvider>,
  );
}

describe('App shell', () => {
  it('DASH-02 renders header and main landmarks with a single page heading', () => {
    renderApp();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('DASH-02 offers a skip link that targets the main content', () => {
    renderApp();
    const link = screen.getByRole('link', { name: 'Skip to main content' });
    expect(link).toHaveAttribute('href', '#main');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
  });
});
