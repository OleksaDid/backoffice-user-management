import type { Database } from '../db/client.js';
import type { Executor } from './executor.js';
import { SessionRepository } from './session-repository.js';
import { UserRepository } from './user-repository.js';

export interface Repositories {
  users: UserRepository;
  sessions: SessionRepository;
}

/**
 * Unit of Work: services read through `repositories` and wrap multi-step changes in
 * `transaction`, which hands them repositories bound to one database transaction.
 */
export interface UnitOfWork {
  repositories: Repositories;
  transaction<T>(work: (repositories: Repositories) => Promise<T>): Promise<T>;
}

function bind(executor: Executor): Repositories {
  return { users: new UserRepository(executor), sessions: new SessionRepository(executor) };
}

export function createUnitOfWork(db: Database): UnitOfWork {
  return {
    repositories: bind(db),
    transaction: (work) => db.transaction((tx) => work(bind(tx))),
  };
}
