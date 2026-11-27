import { createUserFormSchema, type CreateUserForm } from '@backoffice/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Group, Modal, Stack, TextInput } from '@mantine/core';
import { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import type { z } from 'zod';

import { messageFor } from '../../api/error-messages';
import { isApiError } from '../../api/errors';
import { FormAlert } from '../../components/FormAlert';
import { PasswordField } from '../../components/PasswordField';
import { fullName } from '../../lib/format';
import { notifySuccess } from '../../users/notify';
import { useCreateUser } from '../../users/queries';

type CreateUserValues = z.output<typeof createUserFormSchema>;

/** DASH-20, DASH-21: create a user with an initial password; no avatar. */
export function CreateUserModal(props: {
  opened: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const createUser = useCreateUser();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<CreateUserForm, unknown, CreateUserValues>({
    resolver: zodResolver(createUserFormSchema),
  });

  const close = () => {
    reset();
    setFormError(null);
    props.onClose();
  };

  const onSubmit: SubmitHandler<CreateUserValues> = ({ confirmPassword: _confirm, ...body }) => {
    setFormError(null);
    createUser.mutate(body, {
      onSuccess: (user) => {
        notifySuccess(`${fullName(user)} was created.`);
        close();
        props.onCreated();
      },
      onError: (error) => {
        if (isApiError(error, 'EMAIL_ALREADY_REGISTERED')) {
          setError('email', { message: messageFor(error) }, { shouldFocus: true });
        } else {
          setFormError(messageFor(error));
        }
      },
    });
  };

  return (
    <Modal opened={props.opened} onClose={close} title="Create user" centered>
      <form noValidate onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
        <Stack gap="sm">
          <FormAlert message={formError} />
          <Group grow align="flex-start">
            <TextInput
              label="First name"
              withAsterisk
              data-autofocus
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <TextInput
              label="Last name"
              withAsterisk
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </Group>
          <TextInput
            label="Email"
            type="email"
            autoComplete="off"
            withAsterisk
            error={errors.email?.message}
            {...register('email')}
          />
          <PasswordField
            label="Initial password"
            description="At least 8 characters; share it with the user securely"
            autoComplete="new-password"
            withAsterisk
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordField
            label="Confirm password"
            autoComplete="new-password"
            withAsterisk
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" loading={createUser.isPending}>
              Create user
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
