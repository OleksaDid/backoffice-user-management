import type { User } from '@backoffice/contracts';
import { Switch } from '@mantine/core';

import { messageFor } from '../../api/error-messages';
import { fullName } from '../../lib/format';
import { notifyError, notifySuccess } from '../../users/notify';
import { useSetStatus } from '../../users/queries';

/**
 * DASH-40 to DASH-42: activates or deactivates immediately, separate from the edit dialog.
 * The switch always shows the server state: on failure it simply stays where it was.
 */
export function UserStatusSwitch({ user, isSelf }: { user: User; isSelf: boolean }) {
  const setStatus = useSetStatus();
  const active = user.status === 'active';
  const name = fullName(user);
  const label = active ? 'Active' : 'Inactive';

  return (
    <Switch
      checked={active}
      disabled={isSelf || setStatus.isPending}
      label={label}
      // The accessible name starts with the visible label (WCAG 2.5.3) and names the user.
      aria-label={`${label}: ${name}`}
      description={isSelf ? 'Your own account' : undefined}
      onChange={(event) => {
        const status = event.currentTarget.checked ? 'active' : 'inactive';
        setStatus.mutate(
          { id: user.id, status },
          {
            onSuccess: () => {
              notifySuccess(`${name} is now ${status}.`);
            },
            onError: (error) => {
              notifyError(messageFor(error));
            },
          },
        );
      }}
    />
  );
}
