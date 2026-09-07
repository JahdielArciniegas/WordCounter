import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

let sqliteDbInstance: Database.Database | null = null;
let drizzleDbInstance: BetterSQLite3Database<typeof schema> | null = null;

export const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS passive_words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'es',
    added_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );
  CREATE UNIQUE INDEX IF NOT EXISTS passive_word_lang_idx ON passive_words (word, language);

  CREATE TABLE IF NOT EXISTS active_words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'es',
    occurrences INTEGER NOT NULL DEFAULT 1,
    first_used_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    last_used_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );
  CREATE UNIQUE INDEX IF NOT EXISTS active_word_lang_idx ON active_words (word, language);
`;

export function getDatabase(dbPath?: string): {
  db: BetterSQLite3Database<typeof schema>;
  sqlite: Database.Database;
} {
  const targetPath = dbPath || process.env.DB_PATH || 'wordcounter.db';

  if (targetPath === ':memory:') {
    const sqlite = new Database(':memory:');
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');
    sqlite.exec(SCHEMA_SQL);
    const db = drizzle(sqlite, { schema });
    return { db, sqlite };
  }

  if (!sqliteDbInstance) {
    sqliteDbInstance = new Database(targetPath);
    sqliteDbInstance.pragma('journal_mode = WAL');
    sqliteDbInstance.pragma('foreign_keys = ON');
    sqliteDbInstance.exec(SCHEMA_SQL);
    drizzleDbInstance = drizzle(sqliteDbInstance, { schema });
  }

  return { db: drizzleDbInstance!, sqlite: sqliteDbInstance! };
}

export const { db, sqlite } = getDatabase();
