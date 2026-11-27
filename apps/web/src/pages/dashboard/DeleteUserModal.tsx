import type { User } from '@backoffice/contracts';
import { Button, Group, Modal, Stack, Text } from '@mantine/core';

import { messageFor } from '../../api/error-messages';
import { fullName } from '../../lib/format';
import { notifyError, notifySuccess } from '../../users/notify';
import { useDeleteUser } from '../../users/queries';

/**
 * DASH-50, DASH-51: confirmation naming the user; Cancel has the initial focus. Stays
 * mounted so focus returns to the Delete button that opened it (DASH-60).
 */
export function DeleteUserModal({ user, onClose }: { user: User | null; onClose: () => void }) {
  return (
    <Modal
      opened={user !== null}
      onClose={onClose}
      title={user ? `Delete ${fullName(user)}?` : 'Delete user'}
      centered
    >
      {user ? <DeleteConfirmation user={user} onClose={onClose} /> : null}
    </Modal>
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
            deleteUser.mutate(user.id, {
              onSuccess: () => {
                notifySuccess(`${name} was deleted.`);
                onClose();
              },
              onError: (error) => {
                notifyError(messageFor(error));
              },
            });
          }}
        >
          Delete user
        </Button>
      </Group>
    </Stack>
  );
}
