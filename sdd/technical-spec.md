# Technical Specifications — WordCounter

## 1. System Architecture

```
+-------------------------------------------------------------+
|                      Client Browser                         |
|  +---------------------------+  +------------------------+  |
|  | Passive Words View/Island |  | Active Words Island    |  |
|  | - CSV / Textarea Importer |  | - Textarea Submitter   |  |
|  | - Search & Filter Table   |  | - Live Analysis Table  |  |
|  +---------------------------+  +------------------------+  |
+------------------------------+------------------------------+
                               | (JSON / FormData via fetch)
                               v
+-------------------------------------------------------------+
|               Astro SSR Server (Node Adapter)               |
|  +-------------------------------------------------------+  |
|  | SSR Pages: / (Dashboard), /passive, /active           |  |
|  +-------------------------------------------------------+  |
|  | API Routes:                                           |  |
|  | - POST /api/passive/import-text                       |  |
|  | - POST /api/passive/import-csv                        |  |
|  | - GET  /api/passive/words                             |  |
|  | - POST /api/active/analyze-text                       |  |
|  | - GET  /api/active/words                              |  |
|  | - GET  /api/stats                                     |  |
|  +-------------------------------------------------------+  |
|  | Domain Services:                                      |  |
|  | - TokenizerService (Regex / Intl.Segmenter)           |  |
|  | - PassiveVocabService (Batch insert with ignore)      |  |
|  | - ActiveVocabService (Upsert + sum occurrences)       |  |
|  +-------------------------------------------------------+  |
|  | Drizzle ORM (better-sqlite3)                          |  |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                     SQLite Database                         |
|  - passive_words                                            |
|  - active_words                                             |
+-------------------------------------------------------------+
```

---

## 2. Database Schema Design (Drizzle ORM)

### 2.1 Table: `passive_words`
Stores individual recognized words.
```typescript
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
```

### 2.2 Table: `active_words`
Stores cumulative usage metrics per word.
```typescript
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
```

---

## 3. Core Algorithms & Services

### 3.1 Tokenizer Service (`src/services/tokenizer.ts`)
- Utilizes `Intl.Segmenter` (supported in Node 24+) with fallback to regex `\p{L}+` (Unicode aware).
- Trims punctuation, transforms to lowercase (or preserves language-specific case rules).
- Outputs an array of clean word tokens and computes a frequency map `Map<string, number>`.

### 3.2 Ingestion & Upsert Strategy
- **Passive Import**:
  Uses SQLite batch `INSERT OR IGNORE INTO passive_words (word, language, added_at) VALUES (...)`.
- **Active Submission**:
  Executes an atomic transaction where each token in the batch does:
  ```sql
  INSERT INTO active_words (word, language, occurrences, first_used_at, last_used_at)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(word, language) DO UPDATE SET
    occurrences = active_words.occurrences + excluded.occurrences,
    last_used_at = excluded.last_used_at;
  ```

---

## 4. API Endpoints Contract

### `POST /api/passive/import-text`
- **Body**: `{ text: string, language?: string }`
- **Response**: `{ success: true, countInserted: number, countSkipped: number }`

### `POST /api/passive/import-csv`
- **Body**: `FormData` with `file: File`, `language?: string`
- **Response**: `{ success: true, countInserted: number, countSkipped: number }`

### `GET /api/passive/words`
- **Query**: `?language=es&q=query&page=1&limit=50&sort=date_desc`
- **Response**: `{ items: Array<PassiveWord>, total: number, page: number }`

### `POST /api/active/analyze-text`
- **Body**: `{ text: string, language?: string }`
- **Response**:
  ```json
  {
    "success": true,
    "tokensAnalyzed": 142,
    "uniqueWords": 68,
    "newWordsCount": 12,
    "updatedWordsCount": 56
  }
  ```

### `GET /api/active/words`
- **Query**: `?language=es&q=query&page=1&limit=50&sort=occurrences_desc`
- **Response**: `{ items: Array<ActiveWord>, total: number, page: number }`
