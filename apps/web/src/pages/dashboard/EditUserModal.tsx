import {
  type UpdateUserProfileBody,
  updateUserProfileBodySchema,
  type User,
} from '@backoffice/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Group, Stack, TextInput } from '@mantine/core';
import { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import type { z } from 'zod';

import { messageFor } from '../../api/error-messages';
import { FormAlert } from '../../components/FormAlert';
import { fullName } from '../../lib/format';
import { notifySuccess } from '../../users/notify';
import { useUpdateProfile } from '../../users/queries';
import { UserDialog } from './UserDialog';

/** DASH-30 to DASH-32: edit dialog (stays mounted, see UserDialog). */
export function EditUserModal({ user, onClose }: { user: User | null; onClose: () => void }) {
  return (
    <UserDialog user={user} title={(u) => `Edit ${fullName(u)}`} onClose={onClose}>
      {(u) => <EditUserForm user={u} onClose={onClose} />}
    </UserDialog>
  );
}

/** Edit first and last name; locked while the user is inactive. */
function EditUserForm({ user, onClose }: { user: User; onClose: () => void }) {
  const updateProfile = useUpdateProfile();
  const [formError, setFormError] = useState<string | null>(null);
  const locked = user.status === 'inactive';
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof updateUserProfileBodySchema>, unknown, UpdateUserProfileBody>({
    resolver: zodResolver(updateUserProfileBodySchema),
    defaultValues: { firstName: user.firstName, lastName: user.lastName },
  });

  const onSubmit: SubmitHandler<UpdateUserProfileBody> = (body) => {
    setFormError(null);
    updateProfile.mutate(
      { id: user.id, body },
      {
        onSuccess: (updated) => {
          notifySuccess(`${fullName(updated)} was updated.`);
          onClose();
        },
        onError: (error) => {
          setFormError(messageFor(error));
        },
      },
    );
  };

  return (
    <form noValidate onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
      <Stack gap="sm">
        {locked ? (
          <Alert color="blue" variant="light">
            This user is inactive. Activate them first to change their name.
          </Alert>
        ) : null}
        <FormAlert message={formError} />
        <TextInput
          label="First name"
          withAsterisk
          readOnly={locked}
          data-autofocus
          error={errors.firstName?.message}
          {...register('firstName')}
        />
        <TextInput
          label="Last name"
          withAsterisk
          readOnly={locked}
          error={errors.lastName?.message}
          {...register('lastName')}
        />
        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={locked} loading={updateProfile.isPending}>
            Save changes
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
