import type { User } from '@backoffice/contracts';
import { Button, Group, Stack, Text } from '@mantine/core';

import { messageFor } from '../../api/error-messages';
import { fullName } from '../../lib/format';
import { notifyError, notifySuccess } from '../../users/notify';
import { useDeleteUser } from '../../users/queries';
import { UserDialog } from './UserDialog';

/** DASH-50, DASH-51: confirmation naming the user; Cancel has the initial focus. */
export function DeleteUserModal({ user, onClose }: { user: User | null; onClose: () => void }) {
  return (
    <UserDialog user={user} title={(u) => `Delete ${fullName(u)}?`} onClose={onClose}>
      {(u) => <DeleteConfirmation user={u} onClose={onClose} />}
    </UserDialog>
  );
}

function DeleteConfirmation({ user, onClose }: { user: User; onClose: () => void }) {
  const deleteUser = useDeleteUser();
  const name = fullName(user);

  return (
    <Stack gap="md">
      <Text>
        {name} ({user.email}) and all of their sessions will be deleted. This cannot be undone.
      </Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose} data-autofocus>
          Cancel
        </Button>
        <Button
          color="red"
          loading={deleteUser.isPending}
          onClick={() => {
            // mutateAsync always settles; mutate() callbacks can be dropped when the
            // list refetch triggered by the failure re-renders the page.
            deleteUser.mutateAsync(user.id).then(
              () => {
                notifySuccess(`${name} was deleted.`);
                onClose();
              },
              (error: unknown) => {
                notifyError(messageFor(error));
              },
            );
          }}
        >
          Delete user
        </Button>
      </Group>
    </Stack>
  );
}
