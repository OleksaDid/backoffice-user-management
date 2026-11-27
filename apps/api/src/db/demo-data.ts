import type { PasswordHasher } from '../security/password-hasher.js';
import type { Database } from './client.js';
import { sessions, userCredentials, users } from './schema.js';

/** Every demo user signs in with this password (documented in the README). */
export const DEMO_PASSWORD = 'demo-password';

const NAMES: [string, string][] = [
  ['Ada', 'Lovelace'],
  ['Alan', 'Turing'],
  ['Grace', 'Hopper'],
  ['Edsger', 'Dijkstra'],
  ['Barbara', 'Liskov'],
  ['Donald', 'Knuth'],
  ['Margaret', 'Hamilton'],
  ['Linus', 'Torvalds'],
  ['Frances', 'Allen'],
  ['Dennis', 'Ritchie'],
  ['Radia', 'Perlman'],
  ['Ken', 'Thompson'],
  ['Katherine', 'Johnson'],
  ['Tim', 'Berners-Lee'],
  ['Hedy', 'Lamarr'],
  ['John', 'McCarthy'],
  ['Annie', 'Easley'],
  ['Niklaus', 'Wirth'],
  ['Joan', 'Clarke'],
  ['Bjarne', 'Stroustrup'],
];

/** Fixed demo users: enough for several pages, some inactive, varied login counts. */
export function demoUsers(now: Date) {
  return NAMES.map(([firstName, lastName], index) => {
    // Oldest first, one hour apart, so the newest-first list is predictable.
    const createdAt = new Date(now.getTime() - (NAMES.length - index) * 60 * 60 * 1000);
    return {
      firstName,
      lastName,
      email: `${firstName}.${lastName}@example.com`.toLowerCase(),
      status: index % 5 === 4 ? ('inactive' as const) : ('active' as const),
      loginsCount: (index * 7) % 23,
      createdAt,
      updatedAt: createdAt,
    };
  });
}

/**
 * NFR-34: replaces all users and sessions with the demo set, atomically. Used by the
 * nightly reset on public environments; never touches the schema.
 */
export async function resetDemoData(
  db: Database,
  hasher: PasswordHasher,
  now = new Date(),
): Promise<number> {
  const rows = demoUsers(now);
  // One salted hash per user, computed before the transaction opens.
  const hashes = await Promise.all(rows.map(() => hasher.hash(DEMO_PASSWORD)));
  return db.transaction(async (tx) => {
    await tx.delete(sessions);
    await tx.delete(users);
    const inserted = await tx.insert(users).values(rows).returning({ id: users.id });
    await tx.insert(userCredentials).values(
      inserted.map(({ id }, index) => ({
        userId: id,
        passwordHash: hashes[index] ?? '',
        passwordUpdatedAt: now,
      })),
    );
    return inserted.length;
  });
}
