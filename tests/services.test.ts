import { describe, it, expect, beforeEach } from 'vitest';
import { getDatabase } from '../src/db';
import { tokenizeText } from '../src/services/tokenizer';
import { parseWordsCsv } from '../src/services/csv-parser';
import { PassiveVocabService } from '../src/services/passive.service';
import { ActiveVocabService } from '../src/services/active.service';

describe('Core Domain Services (Phase 3)', () => {
  let conn: ReturnType<typeof getDatabase>;
  let passiveService: PassiveVocabService;
  let activeService: ActiveVocabService;

  beforeEach(() => {
    conn = getDatabase(':memory:');
    passiveService = new PassiveVocabService();
    activeService = new ActiveVocabService();
  });

  describe('TokenizerService', () => {
    it('should tokenize text into normalized tokens with frequencies', () => {
      const text = 'Hola mundo, hola programación! El mundo es fascinante.';
      const res = tokenizeText(text, 'es');

      expect(res.totalTokens).toBe(8);
      expect(res.uniqueTokens).toBe(6);

      const hola = res.frequencies.find((f) => f.word === 'hola');
      const mundo = res.frequencies.find((f) => f.word === 'mundo');

      expect(hola?.count).toBe(2);
      expect(mundo?.count).toBe(2);
    });

    it('should preserve unicode letters like accents and ñ', () => {
      const text = 'El pingüino soñó con un ñandú en otoño.';
      const res = tokenizeText(text, 'es');

      const words = res.tokens;
      expect(words).toContain('pingüino');
      expect(words).toContain('soñó');
      expect(words).toContain('ñandú');
      expect(words).toContain('otoño');
    });

    it('should handle empty or whitespace string cleanly', () => {
      const res = tokenizeText('   \n\t  ', 'es');
      expect(res.totalTokens).toBe(0);
      expect(res.uniqueTokens).toBe(0);
      expect(res.tokens).toEqual([]);
    });
  });

  describe('CsvParserService', () => {
    it('should parse simple list of words without header', () => {
      const csv = `perro\ngato\ncaballo`;
      const res = parseWordsCsv(csv);

      expect(res.length).toBe(3);
      expect(res.map((r) => r.word)).toEqual(['perro', 'gato', 'caballo']);
      expect(res[0].date).toBeUndefined();
    });

    it('should parse CSV with headers and date column', () => {
      const csv = `word,date\nresiliencia,2026-01-15\nepifanía,2026-02-20T10:00:00Z\nataraxia,`;
      const res = parseWordsCsv(csv);

      expect(res.length).toBe(3);
      expect(res.map((r) => r.word)).toEqual(['resiliencia', 'epifanía', 'ataraxia']);
      expect(res[0].date).toBeInstanceOf(Date);
      expect(res[0].date?.toISOString().startsWith('2026-01-15')).toBe(true);

      expect(res[1].date).toBeInstanceOf(Date);
      expect(res[2].date).toBeUndefined();
    });
  });

  describe('PassiveVocabService', () => {
    it('should import multiline words and ignore duplicates idempotently', () => {
      const text = `
        árbol
        casa
        árbol
        flor
      `;
      const summary1 = passiveService.importFromText(text, 'es', conn);
      expect(summary1.totalProcessed).toBe(4); // 4 raw lines submitted
      expect(summary1.insertedCount).toBe(3); // árbol, casa, flor
      expect(summary1.skippedCount).toBe(1); // 1 duplicate skipped

      // Second import with overlapping words
      const text2 = `
        casa
        sol
      `;
      const summary2 = passiveService.importFromText(text2, 'es', conn);
      expect(summary2.totalProcessed).toBe(2);
      expect(summary2.insertedCount).toBe(1); // 'sol'
      expect(summary2.skippedCount).toBe(1); // 'casa' skipped

      const { items, total } = passiveService.getPassiveWords({ language: 'es' }, conn);
      expect(total).toBe(4);
      expect(items.map((i) => i.word).sort()).toEqual(['casa', 'flor', 'sol', 'árbol']);
    });

    it('should import CSV with custom dates and support search', () => {
      const csv = `palabra,fecha\npensamiento,2025-10-01\nsentimiento,2025-11-01`;
      const summary = passiveService.importFromCsv(csv, 'es', conn);

      expect(summary.insertedCount).toBe(2);

      const searchRes = passiveService.getPassiveWords({ query: 'pensa', language: 'es' }, conn);
      expect(searchRes.total).toBe(1);
      expect(searchRes.items[0].word).toBe('pensamiento');
    });
  });

  describe('ActiveVocabService', () => {
    it('should ingest text and calculate cumulative frequencies across sessions', () => {
      const text1 = 'Aprender arquitectura es genial. La arquitectura requiere práctica.';
      const summary1 = activeService.analyzeAndIngestText(text1, 'es', conn);

      expect(summary1.tokensAnalyzed).toBe(8);
      expect(summary1.uniqueWords).toBe(7);
      expect(summary1.newWordsCount).toBe(7);
      expect(summary1.updatedWordsCount).toBe(0);

      // Verify 'arquitectura' occurrences = 2
      let words = activeService.getActiveWords({ language: 'es' }, conn);
      const arq1 = words.items.find((w) => w.word === 'arquitectura');
      expect(arq1?.occurrences).toBe(2);

      // Ingest second text where 'arquitectura' is used 3 more times:
      // "La (1) arquitectura (2) de (3) software (4) y (5) la (6) arquitectura (7) limpia (8) forman (9) la (10) mejor (11) arquitectura (12)."
      const text2 = 'La arquitectura de software y la arquitectura limpia forman la mejor arquitectura.';
      const summary2 = activeService.analyzeAndIngestText(text2, 'es', conn);

      expect(summary2.tokensAnalyzed).toBe(12);
      expect(summary2.newWordsCount).toBe(6); // de, software, y, limpia, forman, mejor (wait, let's verify new vs updated)
      expect(summary2.updatedWordsCount).toBe(2); // 'la', 'arquitectura' were already in db

      words = activeService.getActiveWords({ sort: 'occurrences_desc', language: 'es' }, conn);
      const arq2 = words.items.find((w) => w.word === 'arquitectura');
      expect(arq2?.occurrences).toBe(5); // 2 + 3 = 5

      // Stats check
      const stats = activeService.getStats('es', conn);
      expect(stats.activeCount).toBe(13); // 7 from text1 + 6 new from text2 (de, software, y, limpia, forman, mejor = 6 new)
      expect(stats.totalActiveOccurrences).toBe(20); // 8 + 12 = 20
    });

    it('should filter active words by search query', () => {
      activeService.analyzeAndIngestText('computadora sistema computación algoritmos', 'es', conn);

      const search = activeService.getActiveWords({ query: 'comput', language: 'es' }, conn);
      expect(search.total).toBe(2);
      expect(search.items.map((i) => i.word).sort()).toEqual(['computación', 'computadora']);
    });

    it('should maintain bidirectional temporal boundaries (first_used_at and last_used_at) on historical text ingestion', () => {
      // 1. Initial ingestion with baseline date: 2024-06-01
      const initialDate = '2024-06-01T12:00:00Z';
      activeService.analyzeAndIngestText('resiliencia', 'es', initialDate, conn);

      let items = activeService.getActiveWords({ language: 'es' }, conn).items;
      let word = items.find((w) => w.word === 'resiliencia');
      expect(word).toBeDefined();
      expect(word?.occurrences).toBe(1);
      const initialTime = new Date(word!.firstUsedAt).getTime();
      expect(new Date(word!.lastUsedAt).getTime()).toBe(initialTime);

      // 2. Ingest newer date: 2025-01-01
      const newerDate = '2025-01-01T12:00:00Z';
      activeService.analyzeAndIngestText('resiliencia', 'es', newerDate, conn);

      items = activeService.getActiveWords({ language: 'es' }, conn).items;
      word = items.find((w) => w.word === 'resiliencia');
      expect(word?.occurrences).toBe(2);
      // firstUsedAt must stay at 2024-06-01
      expect(new Date(word!.firstUsedAt).getTime()).toBe(initialTime);
      // lastUsedAt must advance to 2025-01-01
      expect(new Date(word!.lastUsedAt).getTime()).toBe(new Date(newerDate).getTime());

      // 3. Ingest older/historical date: 2022-03-15
      const olderDate = '2022-03-15T10:00:00Z';
      activeService.analyzeAndIngestText('resiliencia', 'es', olderDate, conn);

      items = activeService.getActiveWords({ language: 'es' }, conn).items;
      word = items.find((w) => w.word === 'resiliencia');
      expect(word?.occurrences).toBe(3);
      // firstUsedAt must expand backwards to older date 2022-03-15
      expect(new Date(word!.firstUsedAt).getTime()).toBe(new Date(olderDate).getTime());
      // lastUsedAt must still be 2025-01-01
      expect(new Date(word!.lastUsedAt).getTime()).toBe(new Date(newerDate).getTime());

      // 4. Ingest intermediate date: 2023-08-20
      const intermediateDate = '2023-08-20T10:00:00Z';
      activeService.analyzeAndIngestText('resiliencia', 'es', intermediateDate, conn);

      items = activeService.getActiveWords({ language: 'es' }, conn).items;
      word = items.find((w) => w.word === 'resiliencia');
      expect(word?.occurrences).toBe(4);
      // Both bounds must remain intact
      expect(new Date(word!.firstUsedAt).getTime()).toBe(new Date(olderDate).getTime());
      expect(new Date(word!.lastUsedAt).getTime()).toBe(new Date(newerDate).getTime());
    });

    it('should sort words by earliest usage (first_used_desc and first_used_asc)', () => {
      // Ingest 'antiguo' with 2021 date
      activeService.analyzeAndIngestText('antiguo', 'es', '2021-01-01T00:00:00Z', conn);
      // Ingest 'reciente' with 2025 date
      activeService.analyzeAndIngestText('reciente', 'es', '2025-01-01T00:00:00Z', conn);

      const descRes = activeService.getActiveWords({ sort: 'first_used_desc', language: 'es' }, conn);
      expect(descRes.items[0].word).toBe('reciente');
      expect(descRes.items[1].word).toBe('antiguo');

      const ascRes = activeService.getActiveWords({ sort: 'first_used_asc', language: 'es' }, conn);
      expect(ascRes.items[0].word).toBe('antiguo');
      expect(ascRes.items[1].word).toBe('reciente');
    });

    it('should anchor date-only strings (YYYY-MM-DD) to midday to prevent timezone day shift', () => {
      activeService.analyzeAndIngestText('verano', 'es', '2026-07-20', conn);

      const items = activeService.getActiveWords({ language: 'es' }, conn).items;
      const word = items.find((w) => w.word === 'verano');
      expect(word).toBeDefined();

      // Ensure the timestamp is anchored to 12:00:00 UTC
      const date = new Date(word!.firstUsedAt);
      expect(date.toISOString()).toBe('2026-07-20T12:00:00.000Z');
      expect(date.getUTCFullYear()).toBe(2026);
      expect(date.getUTCMonth()).toBe(6); // 0-indexed: 6 = July
      expect(date.getUTCDate()).toBe(20);
    });
  });
});
