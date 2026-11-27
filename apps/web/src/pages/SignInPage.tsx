import { type SignInBody, signInBodySchema } from '@backoffice/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Anchor, Button, Stack, Text, TextInput } from '@mantine/core';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';
import type { z } from 'zod';

import { authApi } from '../api/auth';
import { messageFor } from '../api/error-messages';
import { useStoreSession } from '../auth/session';
import { FormAlert } from '../components/FormAlert';
import { PasswordField } from '../components/PasswordField';
import { PageHeading } from '../components/PageHeading';
import { AuthCard } from './AuthCard';

/** Navigation state used to explain why the user landed on sign-in (UI-AUTH-12). */
export interface SignInState {
  notice?: 'session-ended';
}

/** UI-AUTH-08, UI-AUTH-09, UI-AUTH-12: sign-in. */
export function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const storeSession = useStoreSession();
  const [formError, setFormError] = useState<string | null>(null);
  const notice = (location.state as SignInState | null)?.notice;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof signInBodySchema>, unknown, SignInBody>({
    resolver: zodResolver(signInBodySchema),
  });

  const signIn = useMutation({
    mutationFn: authApi.signIn,
    onSuccess: async (auth) => {
      storeSession(auth);
      await navigate('/', { replace: true });
    },
    onError: (error) => {
      setFormError(messageFor(error));
    },
  });

  const onSubmit: SubmitHandler<SignInBody> = (body) => {
    setFormError(null);
    signIn.mutate(body);
  };

  return (
    <AuthCard>
      <PageHeading>Sign in</PageHeading>
      {notice === 'session-ended' && !formError ? (
        <Alert color="blue" variant="light" role="status">
          Your session has ended. Please sign in again.
        </Alert>
      ) : null}
      <FormAlert message={formError} />
      <form noValidate onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
        <Stack gap="sm">
          <TextInput
            label="Email"
            type="email"
            autoComplete="email"
            withAsterisk
            error={errors.email?.message}
            {...register('email')}
          />
          <PasswordField
            label="Password"
            autoComplete="current-password"
            withAsterisk
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" loading={signIn.isPending} mt="xs">
            Sign in
          </Button>
        </Stack>
      </form>
      <Text size="sm">
        New here?{' '}
        <Anchor component={Link} to="/sign-up">
          Create an account
        </Anchor>
      </Text>
    </AuthCard>
  );
}
