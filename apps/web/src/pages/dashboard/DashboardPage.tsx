import type { User } from '@backoffice/contracts';
import { Alert, Button, Group, Loader, Stack, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

import { messageFor } from '../../api/error-messages';
import { useSession } from '../../auth/session';
import { LoadingScreen } from '../../components/LoadingScreen';
import { PageHeading } from '../../components/PageHeading';
import { useUsersPage } from '../../users/queries';
import { CreateUserModal } from './CreateUserModal';
import { DeleteUserModal } from './DeleteUserModal';
import { EditUserModal } from './EditUserModal';
import { UsersPagination } from './UsersPagination';
import { UsersTable } from './UsersTable';

/** DASH-12: a missing or invalid page parameter means page 1. */
export function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

/** Part 2: the user management dashboard; replaces the welcome page (DASH-01). */
export function DashboardPage() {
  const { data: session } = useSession();
  const [params, setParams] = useSearchParams();
  const page = parsePage(params.get('page'));
  const users = useUsersPage(page);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  const goToPage = (next: number) => {
    setParams(next > 1 ? { page: String(next) } : {});
  };

  // DASH-14: after deleting the last user of the last page, move to the new last page.
  // Only real data for this page counts, not the previous page shown while loading.
  const totalPages = users.isPlaceholderData ? undefined : users.data?.totalPages;
  useEffect(() => {
    if (totalPages !== undefined && page > Math.max(totalPages, 1)) {
      setParams(totalPages > 1 ? { page: String(totalPages) } : {}, { replace: true });
    }
  }, [page, totalPages, setParams]);

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <div>
          <PageHeading>Hello {session?.user.firstName}</PageHeading>
          <Text c="dimmed">Manage the users of the platform.</Text>
        </div>
        <Button
          onClick={() => {
            setCreating(true);
          }}
        >
          Create user
        </Button>
      </Group>

      {users.isPending ? <LoadingScreen label="Loading users" /> : null}

      {users.isError && !users.data ? (
        <Stack gap="sm" align="flex-start">
          <Alert color="red" variant="light" role="alert" title="Users could not be loaded">
            {messageFor(users.error)}
          </Alert>
          <Button variant="default" onClick={() => void users.refetch()}>
            Retry
          </Button>
        </Stack>
      ) : null}

      {users.data?.totalItems === 0 ? <Text>No users yet.</Text> : null}

      {users.data && users.data.items.length > 0 ? (
        <Stack gap="md">
          <UsersTable
            users={users.data.items}
            currentUserId={session?.user.id ?? ''}
            busy={users.isPlaceholderData}
            onEdit={setEditing}
            onDelete={setDeleting}
          />
          <Group justify="space-between">
            <Text size="sm" c="dimmed" aria-live="polite">
              {users.isPlaceholderData ? (
                <Group gap="xs" component="span">
                  <Loader size="xs" aria-hidden /> Loading page {page}
                </Group>
              ) : (
                `Page ${users.data.page} of ${users.data.totalPages}, ${users.data.totalItems} users`
              )}
            </Text>
            <UsersPagination page={page} totalPages={users.data.totalPages} onChange={goToPage} />
          </Group>
        </Stack>
      ) : null}

      <CreateUserModal
        opened={creating}
        onClose={() => {
          setCreating(false);
        }}
        onCreated={() => {
          // DASH-21: new users appear first, on page 1.
          goToPage(1);
        }}
      />
      <EditUserModal
        user={editing}
        onClose={() => {
          setEditing(null);
        }}
      />
      <DeleteUserModal
        user={deleting}
        onClose={() => {
          setDeleting(null);
        }}
      />
    </Stack>
  );
}
