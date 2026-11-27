import type { User } from '@backoffice/contracts';
import { Switch } from '@mantine/core';

import { messageFor } from '../../api/error-messages';
import { fullName } from '../../lib/format';
import { notifyError, notifySuccess } from '../../users/notify';
import { useSetStatus } from '../../users/queries';

/**
 * DASH-40 to DASH-42: activates or deactivates immediately, separate from the edit dialog.
 * The switch always shows the server state: on failure it simply stays where it was.
 *
 * Its name is stable ("Active: Ada Lovelace") and the on/off state carries the status, as
 * the ARIA switch pattern expects; the visible label is part of the name (WCAG 2.5.3).
 */
export function UserStatusSwitch({ user, isSelf }: { user: User; isSelf: boolean }) {
  const setStatus = useSetStatus();
  const name = fullName(user);

  return (
    <Switch
      checked={user.status === 'active'}
      disabled={isSelf || setStatus.isPending}
      label="Active"
      aria-label={`Active: ${name}`}
      description={isSelf ? 'Your own account' : undefined}
      onChange={(event) => {
        const status = event.currentTarget.checked ? 'active' : 'inactive';
        // mutateAsync always settles; mutate() callbacks are dropped when the list refetch
        // after the change re-renders or removes this row (same as the delete dialog).
        setStatus.mutateAsync({ id: user.id, status }).then(
          () => {
            notifySuccess(`${name} is now ${status}.`);
          },
          (error: unknown) => {
            notifyError(messageFor(error));
          },
        );
      }}
    />
  );
}
