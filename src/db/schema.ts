import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const passiveWords = sqliteTable(
  'passive_words',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    word: text('word').notNull(),
    language: text('language').notNull().default('es'),
    addedAt: integer('added_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => ({
    wordLangIdx: uniqueIndex('passive_word_lang_idx').on(table.word, table.language),
  })
);

export const activeWords = sqliteTable(
  'active_words',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    word: text('word').notNull(),
    language: text('language').notNull().default('es'),
    occurrences: integer('occurrences').notNull().default(1),
    firstUsedAt: integer('first_used_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    lastUsedAt: integer('last_used_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => ({
    wordLangIdx: uniqueIndex('active_word_lang_idx').on(table.word, table.language),
  })
);

export type PassiveWord = typeof passiveWords.$inferSelect;
export type NewPassiveWord = typeof passiveWords.$inferInsert;

export type ActiveWord = typeof activeWords.$inferSelect;
export type NewActiveWord = typeof activeWords.$inferInsert;
