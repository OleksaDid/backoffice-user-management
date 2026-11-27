import { AppShell, Button, Container, Group, Text } from '@mantine/core';
import { Outlet } from 'react-router';

import { useSession, useSignOut } from '../auth/session';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import classes from './AppLayout.module.css';

/**
 * Application shell (DASH-02): skip link, header and main landmarks. The Log out button
 * is on every authenticated page (UI-AUTH-11).
 */
export function AppLayout() {
  const session = useSession();
  const signOut = useSignOut();

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <a href="#main" className={classes.skipLink}>
        Skip to main content
      </a>
      <AppShell.Header component="header">
        <Container size="lg" h="100%">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Text component="span" fw={700} size="lg" style={{ whiteSpace: 'nowrap' }}>
              Back-office
            </Text>
            <Group gap="sm" wrap="nowrap">
              <ThemeSwitcher />
              {session.data ? (
                <Button
                  variant="default"
                  onClick={() => {
                    signOut.mutate();
                  }}
                  loading={signOut.isPending}
                >
                  Log out
                </Button>
              ) : null}
            </Group>
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Main id="main" tabIndex={-1}>
        <Container size="lg" py="xl">
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
