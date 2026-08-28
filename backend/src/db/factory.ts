import { Db } from './index';
import { MemoryDb } from './memory';
import { PostgresDb } from './postgres';
import { config } from '../config';

export let db: Db;

export function initDb(): Db {
  const type = config.dbType === 'auto' ? (config.databaseUrl ? 'postgres' : 'memory') : config.dbType;

  if (type === 'postgres') {
    if (!config.databaseUrl) {
      console.warn('[db] DATABASE_URL not set, falling back to in-memory database.');
      db = new MemoryDb();
    } else {
      try {
        const pg = new PostgresDb(config.databaseUrl);
        console.log('[db] Using PostgreSQL.');
        db = pg;
      } catch (e) {
        console.warn('[db] Could not initialize PostgreSQL, falling back to in-memory:', (e as Error).message);
        db = new MemoryDb();
      }
    }
  } else {
    console.log('[db] Using in-memory database (set DATABASE_URL for PostgreSQL).');
    db = new MemoryDb();
  }

  return db;
}

export async function initDbAndReady(): Promise<Db> {
  const d = initDb();
  try {
    await d.ready();
  } catch (e) {
    console.warn('[db] Database ready() failed, switching to in-memory:', (e as Error).message);
    db = new MemoryDb();
    await db.ready();
  }
  return db;
}
