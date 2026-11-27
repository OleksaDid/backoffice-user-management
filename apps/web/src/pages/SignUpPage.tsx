import { signUpFormSchema, type SignUpForm } from '@backoffice/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { Anchor, Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import type { z } from 'zod';

import { authApi } from '../api/auth';
import { messageFor } from '../api/error-messages';
import { isApiError } from '../api/errors';
import { useStoreSession } from '../auth/session';
import { FormAlert } from '../components/FormAlert';
import { PasswordField } from '../components/PasswordField';
import { PageHeading } from '../components/PageHeading';
import { AuthCard } from './AuthCard';

type SignUpValues = z.output<typeof signUpFormSchema>;

/** UI-AUTH-04 to UI-AUTH-07, UI-AUTH-09: registration. */
export function SignUpPage() {
  const navigate = useNavigate();
  const storeSession = useStoreSession();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignUpForm, unknown, SignUpValues>({ resolver: zodResolver(signUpFormSchema) });

  const signUp = useMutation({
    mutationFn: authApi.signUp,
    onSuccess: async (auth) => {
      storeSession(auth);
      await navigate('/', { replace: true });
    },
    onError: (error) => {
      if (isApiError(error, 'EMAIL_ALREADY_REGISTERED')) {
        setError('email', { message: messageFor(error) }, { shouldFocus: true });
      } else if (isApiError(error, 'VALIDATION_FAILED') && error.fieldErrors.length > 0) {
        for (const field of error.fieldErrors) {
          setError(field.path as keyof SignUpForm, { message: field.message });
        }
      } else {
        setFormError(messageFor(error));
      }
    },
  });

  // The confirmation is checked by the schema before this runs (UI-AUTH-04).
  const onSubmit: SubmitHandler<SignUpValues> = ({ confirmPassword: _confirm, ...body }) => {
    setFormError(null);
    signUp.mutate(body);
  };

  return (
    <AuthCard>
      <PageHeading>Create your account</PageHeading>
      <FormAlert message={formError} />
      <form noValidate onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
        <Stack gap="sm">
          <Group grow align="flex-start">
            <TextInput
              label="First name"
              autoComplete="given-name"
              withAsterisk
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <TextInput
              label="Last name"
              autoComplete="family-name"
              withAsterisk
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </Group>
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
            description="At least 8 characters"
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
          <Button type="submit" loading={signUp.isPending} mt="xs">
            Sign up
          </Button>
        </Stack>
      </form>
      <Text size="sm">
        Already have an account?{' '}
        <Anchor component={Link} to="/sign-in">
          Sign in
        </Anchor>
      </Text>
    </AuthCard>
  );
}
