import { describe, it, expect, beforeEach } from 'vitest';
import { getDatabase } from '../src/db';
import { passiveWords, activeWords } from '../src/db/schema';
import { eq, sql } from 'drizzle-orm';

describe('Database Layer & Schema Constraints (Phase 2)', () => {
  let db: ReturnType<typeof getDatabase>['db'];
  let sqlite: ReturnType<typeof getDatabase>['sqlite'];

  beforeEach(() => {
    const conn = getDatabase(':memory:');
    db = conn.db;
    sqlite = conn.sqlite;
  });

  describe('passive_words', () => {
    it('should insert a passive word with default language and addedAt timestamp', () => {
      const inserted = db
        .insert(passiveWords)
        .values({ word: 'serendipia' })
        .returning()
        .get();

      expect(inserted).toBeDefined();
      expect(inserted.word).toBe('serendipia');
      expect(inserted.language).toBe('es');
      expect(inserted.addedAt).toBeInstanceOf(Date);
    });

    it('should enforce UNIQUE constraint on (word, language)', () => {
      db.insert(passiveWords).values({ word: 'efímero', language: 'es' }).run();

      expect(() => {
        db.insert(passiveWords).values({ word: 'efímero', language: 'es' }).run();
      }).toThrowError(/UNIQUE constraint failed/);
    });

    it('should allow same word in different languages', () => {
      const es = db.insert(passiveWords).values({ word: 'piano', language: 'es' }).returning().get();
      const it = db.insert(passiveWords).values({ word: 'piano', language: 'it' }).returning().get();

      expect(es.id).not.toBe(it.id);
      expect(es.language).toBe('es');
      expect(it.language).toBe('it');
    });

    it('should support INSERT OR IGNORE via SQLite for idempotent imports', () => {
      const stmt = sqlite.prepare(`
        INSERT OR IGNORE INTO passive_words (word, language)
        VALUES (?, ?)
      `);

      const res1 = stmt.run('resiliencia', 'es');
      expect(res1.changes).toBe(1);

      const res2 = stmt.run('resiliencia', 'es');
      expect(res2.changes).toBe(0); // Ignored duplicate

      const all = db.select().from(passiveWords).all();
      expect(all.length).toBe(1);
    });
  });

  describe('active_words', () => {
    it('should insert an active word with default occurrences and timestamps', () => {
      const inserted = db
        .insert(activeWords)
        .values({ word: 'desarrollo' })
        .returning()
        .get();

      expect(inserted).toBeDefined();
      expect(inserted.word).toBe('desarrollo');
      expect(inserted.language).toBe('es');
      expect(inserted.occurrences).toBe(1);
      expect(inserted.firstUsedAt).toBeInstanceOf(Date);
      expect(inserted.lastUsedAt).toBeInstanceOf(Date);
    });

    it('should enforce UNIQUE constraint on (word, language)', () => {
      db.insert(activeWords).values({ word: 'algoritmo', language: 'es' }).run();

      expect(() => {
        db.insert(activeWords).values({ word: 'algoritmo', language: 'es' }).run();
      }).toThrowError(/UNIQUE constraint failed/);
    });

    it('should support cumulative occurrence upserts with last_used_at update', () => {
      const upsertStmt = sqlite.prepare(`
        INSERT INTO active_words (word, language, occurrences, first_used_at, last_used_at)
        VALUES (?, ?, ?, strftime('%s', 'now'), strftime('%s', 'now'))
        ON CONFLICT(word, language) DO UPDATE SET
          occurrences = active_words.occurrences + excluded.occurrences,
          last_used_at = excluded.last_used_at
      `);

      // First text: word appears 3 times
      upsertStmt.run('arquitectura', 'es', 3);
      let word = db.select().from(activeWords).where(eq(activeWords.word, 'arquitectura')).get();
      expect(word?.occurrences).toBe(3);

      // Second text: word appears 2 times
      upsertStmt.run('arquitectura', 'es', 2);
      word = db.select().from(activeWords).where(eq(activeWords.word, 'arquitectura')).get();
      expect(word?.occurrences).toBe(5);
    });
  });
});
