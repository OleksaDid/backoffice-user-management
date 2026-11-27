import { Anchor, AppShell, Container, Group, Stack, Text, Title } from '@mantine/core';

import classes from './App.module.css';

/** Application shell: landmarks and skip link are in place before any feature (DASH-02). */
export function App() {
  return (
    <AppShell header={{ height: 60 }} padding="md">
      <a href="#main" className={classes.skipLink}>
        Skip to main content
      </a>
      <AppShell.Header component="header">
        <Container size="lg" h="100%">
          <Group h="100%" justify="space-between">
            <Text component="span" fw={700} size="lg">
              Back-office
            </Text>
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Main id="main" tabIndex={-1}>
        <Container size="lg">
          <Stack gap="sm" py="xl">
            <Title order={1}>User management</Title>
            <Text>
              The service is up. Sign-up and sign-in arrive with the next release; meanwhile the{' '}
              <Anchor href="/api/docs">API documentation</Anchor> is available.
            </Text>
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
