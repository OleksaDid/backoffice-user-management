import type { User } from '@backoffice/contracts';
import { Badge, Button, Group, Table } from '@mantine/core';

import { formatDateTime, formatFullDateTime, fullName } from '../../lib/format';
import { UserStatusSwitch } from './UserStatusSwitch';

function DateCell({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} title={formatFullDateTime(iso)}>
      {formatDateTime(iso)}
    </time>
  );
}

interface UsersTableProps {
  users: User[];
  currentUserId: string;
  busy: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

/** DASH-10, DASH-16: a real table with a caption, column headers and per-row actions. */
export function UsersTable({ users, currentUserId, busy, onEdit, onDelete }: UsersTableProps) {
  return (
    <Table.ScrollContainer minWidth={860}>
      <Table striped highlightOnHover verticalSpacing="sm" aria-busy={busy}>
        <Table.Caption>Users, newest first</Table.Caption>
        <Table.Thead>
          <Table.Tr>
            <Table.Th scope="col">Name</Table.Th>
            <Table.Th scope="col">Email</Table.Th>
            <Table.Th scope="col">Status</Table.Th>
            <Table.Th scope="col">Logins</Table.Th>
            <Table.Th scope="col">Created</Table.Th>
            <Table.Th scope="col">Last updated</Table.Th>
            <Table.Th scope="col">Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            const name = fullName(user);
            return (
              <Table.Tr key={user.id}>
                <Table.Th scope="row" fw={500}>
                  <Group gap="xs" wrap="nowrap">
                    {name}
                    {isSelf ? (
                      <Badge variant="light" size="sm">
                        You
                      </Badge>
                    ) : null}
                  </Group>
                </Table.Th>
                <Table.Td>{user.email}</Table.Td>
                <Table.Td>
                  <UserStatusSwitch user={user} isSelf={isSelf} />
                </Table.Td>
                <Table.Td>{user.loginsCount}</Table.Td>
                <Table.Td>
                  <DateCell iso={user.createdAt} />
                </Table.Td>
                <Table.Td>
                  <DateCell iso={user.updatedAt} />
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" wrap="nowrap">
                    <Button
                      size="xs"
                      variant="default"
                      aria-label={`Edit ${name}`}
                      onClick={() => {
                        onEdit(user);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      aria-label={`Delete ${name}`}
                      disabled={isSelf}
                      title={isSelf ? 'You cannot delete your own account' : undefined}
                      onClick={() => {
                        onDelete(user);
                      }}
                    >
                      Delete
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
