import { Stack, Text } from '@mantine/core';

import { useSession } from '../auth/session';
import { PageHeading } from '../components/PageHeading';

/** UI-AUTH-10: greets the signed-in user. Replaced by the dashboard in Part 2. */
export function WelcomePage() {
  const { data } = useSession();
  return (
    <Stack gap="sm">
      <PageHeading>Hello {data?.user.firstName}</PageHeading>
      <Text>You are signed in as {data?.user.email}.</Text>
    </Stack>
  );
}
