import { getDatabase } from "../db";
import { passiveWords, type PassiveWord } from "../db/schema";
import { parseWordsCsv } from "./csv-parser";
import { like, eq, and, desc, asc, sql } from "drizzle-orm";
import type Database from "better-sqlite3";

export interface ImportSummary {
  totalProcessed: number;
  insertedCount: number;
  skippedCount: number;
}

export interface GetPassiveOptions {
  query?: string;
  language?: string;
  limit?: number;
  offset?: number;
  sort?: "date_desc" | "date_asc" | "alpha";
}

export class PassiveVocabService {
  private getDb(customConn?: { db: any; sqlite: Database.Database }) {
    return customConn || getDatabase();
  }

  /**
   * Bulk import passive words from a multiline text string.
   * Each non-empty newline is treated as a word.
   * Duplicates are ignored idempotently (INSERT OR IGNORE).
   */
  importFromText(
    text: string,
    language: string = "es",
    conn?: { db: any; sqlite: Database.Database },
  ): ImportSummary {
    const { sqlite } = this.getDb(conn);

    if (!text || typeof text !== "string") {
      return { totalProcessed: 0, insertedCount: 0, skippedCount: 0 };
    }

    const lines = text
      .split(/\r?\n/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length > 0);

    if (lines.length === 0) {
      return { totalProcessed: 0, insertedCount: 0, skippedCount: 0 };
    }

    const insertStmt = sqlite.prepare(`
      INSERT OR IGNORE INTO passive_words (word, language, added_at)
      VALUES (?, ?, strftime('%s', 'now'))
    `);

    let inserted = 0;
    const runTransaction = sqlite.transaction((words: string[]) => {
      for (const word of words) {
        const info = insertStmt.run(word, language);
        if (info.changes > 0) {
          inserted++;
        }
      }
    });

    runTransaction(lines);

    return {
      totalProcessed: lines.length,
      insertedCount: inserted,
      skippedCount: lines.length - inserted,
    };
  }

  /**
   * Bulk import passive words from CSV content.
   * Extracts word and optional date column.
   */
  importFromCsv(
    csvContent: string,
    language: string = "es",
    conn?: { db: any; sqlite: Database.Database },
  ): ImportSummary {
    const { sqlite } = this.getDb(conn);
    const parsed = parseWordsCsv(csvContent);

    if (parsed.length === 0) {
      return { totalProcessed: 0, insertedCount: 0, skippedCount: 0 };
    }

    const insertWithDateStmt = sqlite.prepare(`
      INSERT OR IGNORE INTO passive_words (word, language, added_at)
      VALUES (?, ?, ?)
    `);

    const insertWithNowStmt = sqlite.prepare(`
      INSERT OR IGNORE INTO passive_words (word, language, added_at)
      VALUES (?, ?, strftime('%s', 'now'))
    `);

    let inserted = 0;
    const runTransaction = sqlite.transaction((items: typeof parsed) => {
      for (const item of items) {
        let info;
        if (item.date) {
          const epochSeconds = Math.floor(item.date.getTime() / 1000);
          info = insertWithDateStmt.run(item.word, language, epochSeconds);
        } else {
          info = insertWithNowStmt.run(item.word, language);
        }
        if (info.changes > 0) {
          inserted++;
        }
      }
    });

    runTransaction(parsed);

    return {
      totalProcessed: parsed.length,
      insertedCount: inserted,
      skippedCount: parsed.length - inserted,
    };
  }

  /**
   * Query passive words with search, language filter, and pagination.
   */
  getPassiveWords(
    options: GetPassiveOptions = {},
    conn?: { db: any; sqlite: Database.Database },
  ): { items: PassiveWord[]; total: number } {
    const { db } = this.getDb(conn);
    const language = options.language || "es";
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    const sort = options.sort || "date_desc";

    const conditions = [eq(passiveWords.language, language)];

    if (options.query && options.query.trim()) {
      conditions.push(
        like(passiveWords.word, `%${options.query.trim().toLowerCase()}%`),
      );
    }

    const whereClause = and(...conditions);

    let orderBy;
    switch (sort) {
      case "date_asc":
        orderBy = asc(passiveWords.addedAt);
        break;
      case "alpha":
        orderBy = asc(passiveWords.word);
        break;
      case "date_desc":
      default:
        orderBy = desc(passiveWords.addedAt);
        break;
    }

    const items = db
      .select()
      .from(passiveWords)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset)
      .all();

    const countResult = db
      .select({ count: sql<number>`count(*)` })
      .from(passiveWords)
      .where(whereClause)
      .get();

    return {
      items,
      total: countResult ? Number(countResult.count) : 0,
    };
  }

  removeWord(id: number, conn?: { db: any; sqlite: Database.Database }): void {
    const { db } = this.getDb(conn);
    db.delete(passiveWords).where(eq(passiveWords.id, id)).run();
  }
}

export const passiveVocabService = new PassiveVocabService();
