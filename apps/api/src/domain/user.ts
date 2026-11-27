import type { UserStatus } from '@backoffice/contracts';

import { AppError } from '../errors/app-error.js';

/** A user as the domain sees it; persistence maps to and from this shape. */
export interface UserEntity {
  id: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  loginsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfilePatch {
  firstName?: string;
  lastName?: string;
}

/** Changes written by an update. `createdAt` is deliberately not part of it (USR-12). */
export interface UserChanges extends ProfilePatch {
  status?: UserStatus;
  updatedAt: Date;
}

/**
 * USR-09: first and last name are locked while the user is inactive.
 * USR-12: every successful update refreshes `updatedAt`.
 */
export function profileChanges(user: UserEntity, patch: ProfilePatch, now: Date): UserChanges {
  if (user.status === 'inactive') {
    throw new AppError('USER_NAME_LOCKED');
  }
  return { ...patch, updatedAt: now };
}

/** USR-10, USR-12: setting a status (even the current one) is an update. */
export function statusChanges(status: UserStatus, now: Date): UserChanges {
  return { status, updatedAt: now };
}

/** USR-11: deactivation ends the user's sessions. */
export function endsSessions(changes: UserChanges): boolean {
  return changes.status === 'inactive';
}

/** SES-02: inactive users cannot create sessions. */
export function assertCanStartSession(user: UserEntity): void {
  if (user.status === 'inactive') {
    throw new AppError('USER_INACTIVE');
  }
}
