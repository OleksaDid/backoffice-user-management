import { sessions, users } from './schema.js';
import type { Database } from './client.js';

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
export async function resetDemoData(db: Database, now = new Date()): Promise<number> {
  return db.transaction(async (tx) => {
    await tx.delete(sessions);
    await tx.delete(users);
    const inserted = await tx.insert(users).values(demoUsers(now)).returning({ id: users.id });
    return inserted.length;
  });
}
