import { PasswordInput, type PasswordInputProps } from '@mantine/core';

/**
 * Mantine's PasswordInput marks only its wrapper as invalid; screen readers need
 * aria-invalid on the input itself (UI-AUTH-05). Use this instead of PasswordInput.
 */
export function PasswordField({ error, ...props }: PasswordInputProps) {
  return <PasswordInput error={error} aria-invalid={error ? true : undefined} {...props} />;
}
