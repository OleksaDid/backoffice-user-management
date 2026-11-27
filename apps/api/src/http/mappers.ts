import type { Session, User } from '@backoffice/contracts';

import type { SessionEntity } from '../domain/session.js';
import type { UserEntity } from '../domain/user.js';

/** Domain entity → API DTO. Explicit mapping: nothing leaks that the contract does not list. */
export function toUserDto(user: UserEntity): User {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    status: user.status,
    loginsCount: user.loginsCount,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function toSessionDto(session: SessionEntity): Session {
  return {
    id: session.id,
    userId: session.userId,
    createdAt: session.createdAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    terminatedAt: session.terminatedAt?.toISOString() ?? null,
  };
}
