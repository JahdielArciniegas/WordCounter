import { getDatabase } from "../db";
import { activeWords, passiveWords, type ActiveWord } from "../db/schema";
import { tokenizeText, type TokenFrequency } from "./tokenizer";
import { like, eq, and, desc, asc, sql } from "drizzle-orm";
import type Database from "better-sqlite3";

export interface ActiveAnalysisSummary {
  tokensAnalyzed: number;
  uniqueWords: number;
  newWordsCount: number;
  updatedWordsCount: number;
  topWords: TokenFrequency[];
}

export interface GetActiveOptions {
  query?: string;
  language?: string;
  limit?: number;
  offset?: number;
  sort?:
    | "occurrences_desc"
    | "date_desc"
    | "first_used_desc"
    | "first_used_asc"
    | "alpha";
}

export interface OverallStats {
  passiveCount: number;
  activeCount: number;
  totalActiveOccurrences: number;
}

export class ActiveVocabService {
  private getDb(customConn?: { db: any; sqlite: Database.Database }) {
    return customConn || getDatabase();
  }

  /**
   * Analyze an authored text block:
   * - Tokenizes into clean words & counts frequencies in memory.
   * - Raw text is discarded.
   * - Atomically upserts each token into active_words, accumulating occurrences.
   */
  analyzeAndIngestText(
    text: string,
    language: string = "es",
    customDateOrConn?:
      | Date
      | string
      | number
      | { db: any; sqlite: Database.Database },
    customConn?: { db: any; sqlite: Database.Database },
  ): ActiveAnalysisSummary {
    let customDate: Date | string | number | undefined;
    let conn = customConn;

    if (
      customDateOrConn &&
      typeof customDateOrConn === "object" &&
      "sqlite" in customDateOrConn
    ) {
      conn = customDateOrConn;
      customDate = undefined;
    } else {
      customDate = customDateOrConn as Date | string | number | undefined;
    }

    const { sqlite } = this.getDb(conn);

    const tokenized = tokenizeText(text, language);
    if (tokenized.totalTokens === 0) {
      return {
        tokensAnalyzed: 0,
        uniqueWords: 0,
        newWordsCount: 0,
        updatedWordsCount: 0,
        topWords: [],
      };
    }

    let timestampInSeconds: number;
    if (!customDate) {
      timestampInSeconds = Math.floor(Date.now() / 1000);
    } else if (typeof customDate === "number") {
      timestampInSeconds =
        customDate > 1e11
          ? Math.floor(customDate / 1000)
          : Math.floor(customDate);
    } else if (typeof customDate === "string") {
      let dateToParse = customDate.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateToParse)) {
        dateToParse = `${dateToParse}T12:00:00Z`;
      } else if (/^\d{4}-\d{2}-\d{2}T00:00:00(\.000)?Z?$/i.test(dateToParse)) {
        dateToParse = dateToParse.replace(/T00:00:00(\.000)?Z?$/i, "T12:00:00Z");
      }
      const parsed = new Date(dateToParse);
      timestampInSeconds = isNaN(parsed.getTime())
        ? Math.floor(Date.now() / 1000)
        : Math.floor(parsed.getTime() / 1000);
    } else if (customDate instanceof Date) {
      timestampInSeconds = isNaN(customDate.getTime())
        ? Math.floor(Date.now() / 1000)
        : Math.floor(customDate.getTime() / 1000);
    } else {
      timestampInSeconds = Math.floor(Date.now() / 1000);
    }

    const checkStmt = sqlite.prepare(`
      SELECT 1 FROM active_words WHERE word = ? AND language = ?
    `);

    const upsertStmt = sqlite.prepare(`
      INSERT INTO active_words (word, language, occurrences, first_used_at, last_used_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(word, language) DO UPDATE SET
        occurrences = active_words.occurrences + excluded.occurrences,
        first_used_at = MIN(active_words.first_used_at, excluded.first_used_at),
        last_used_at = MAX(active_words.last_used_at, excluded.last_used_at)
    `);

    let newCount = 0;
    let updatedCount = 0;

    const runTransaction = sqlite.transaction(
      (frequencies: TokenFrequency[]) => {
        for (const item of frequencies) {
          const exists = checkStmt.get(item.word, language);
          if (exists) {
            updatedCount++;
          } else {
            newCount++;
          }
          upsertStmt.run(
            item.word,
            language,
            item.count,
            timestampInSeconds,
            timestampInSeconds,
          );
        }
      },
    );

    runTransaction(tokenized.frequencies);

    return {
      tokensAnalyzed: tokenized.totalTokens,
      uniqueWords: tokenized.uniqueTokens,
      newWordsCount: newCount,
      updatedWordsCount: updatedCount,
      topWords: tokenized.frequencies.slice(0, 10),
    };
  }

  /**
   * Query active words with search, sorting, and pagination.
   */
  getActiveWords(
    options: GetActiveOptions = {},
    conn?: { db: any; sqlite: Database.Database },
  ): { items: ActiveWord[]; total: number } {
    const { db } = this.getDb(conn);
    const language = options.language || "es";
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    const sort = options.sort || "occurrences_desc";

    const conditions = [eq(activeWords.language, language)];

    if (options.query && options.query.trim()) {
      conditions.push(
        like(activeWords.word, `%${options.query.trim().toLowerCase()}%`),
      );
    }

    const whereClause = and(...conditions);

    let orderBy;
    switch (sort) {
      case "first_used_desc":
        orderBy = desc(activeWords.firstUsedAt);
        break;
      case "first_used_asc":
        orderBy = asc(activeWords.firstUsedAt);
        break;
      case "date_desc":
        orderBy = desc(activeWords.lastUsedAt);
        break;
      case "alpha":
        orderBy = asc(activeWords.word);
        break;
      case "occurrences_desc":
      default:
        orderBy = desc(activeWords.occurrences);
        break;
    }

    const items = db
      .select()
      .from(activeWords)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset)
      .all();

    const countResult = db
      .select({ count: sql<number>`count(*)` })
      .from(activeWords)
      .where(whereClause)
      .get();

    return {
      items,
      total: countResult ? Number(countResult.count) : 0,
    };
  }

  /**
   * Get global counts and stats for active vs passive vocabulary.
   */
  getStats(
    language: string = "es",
    conn?: { db: any; sqlite: Database.Database },
  ): OverallStats {
    const { db } = this.getDb(conn);

    const passiveRes = db
      .select({ count: sql<number>`count(*)` })
      .from(passiveWords)
      .where(eq(passiveWords.language, language))
      .get();

    const activeRes = db
      .select({
        count: sql<number>`count(*)`,
        totalOccurrences: sql<number>`COALESCE(SUM(${activeWords.occurrences}), 0)`,
      })
      .from(activeWords)
      .where(eq(activeWords.language, language))
      .get();

    return {
      passiveCount: passiveRes ? Number(passiveRes.count) : 0,
      activeCount: activeRes ? Number(activeRes.count) : 0,
      totalActiveOccurrences: activeRes
        ? Number(activeRes.totalOccurrences)
        : 0,
    };
  }

  removeWord(id: number, conn?: { db: any; sqlite: Database.Database }): void {
    const { db } = this.getDb(conn);
    db.delete(activeWords).where(eq(activeWords.id, id)).run();
  }

  clearAll(conn?: { db: any; sqlite: Database.Database }): void {
    const { db } = this.getDb(conn);
    db.delete(activeWords).run();
  }
}

export const activeVocabService = new ActiveVocabService();
