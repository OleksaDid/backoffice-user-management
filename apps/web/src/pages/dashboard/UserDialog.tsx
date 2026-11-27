import type { User } from '@backoffice/contracts';
import { Modal } from '@mantine/core';
import type { ReactNode } from 'react';

/**
 * A dialog about one user. It stays mounted while closed so Mantine can return focus to
 * the button that opened it (DASH-60); the content remounts for each user.
 */
export function UserDialog(props: {
  user: User | null;
  title: (user: User) => string;
  onClose: () => void;
  children: (user: User) => ReactNode;
}) {
  const { user } = props;
  return (
    <Modal
      opened={user !== null}
      onClose={props.onClose}
      title={user ? props.title(user) : ''}
      centered
    >
      {user ? <div key={user.id}>{props.children(user)}</div> : null}
    </Modal>
  );
}
