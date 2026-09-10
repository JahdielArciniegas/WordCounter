import { describe, it, expect, beforeEach } from 'vitest';
import { POST as importTextRoute } from '../src/pages/api/passive/import-text';
import { POST as importCsvRoute } from '../src/pages/api/passive/import-csv';
import { GET as getPassiveWordsRoute } from '../src/pages/api/passive/words';
import { POST as analyzeTextRoute } from '../src/pages/api/active/analyze-text';
import { GET as getActiveWordsRoute } from '../src/pages/api/active/words';
import { GET as getStatsRoute } from '../src/pages/api/stats';
import { getDatabase } from '../src/db';

// Helper to create Astro API context mock
function createAstroContext(req: Request, urlStr: string) {
  const url = new URL(urlStr);
  return {
    request: req,
    url,
    params: {},
    props: {},
    site: undefined,
    generator: 'astro',
    cookies: {} as any,
    clientAddress: '127.0.0.1',
    locals: {},
    redirect: () => new Response(null, { status: 302 }),
  } as any;
}

describe('Astro SSR API Routes (Phase 4)', () => {
  beforeEach(() => {
    // Clear in-memory / local tables for clean test state
    const { sqlite } = getDatabase();
    sqlite.exec(`
      DELETE FROM passive_words;
      DELETE FROM active_words;
    `);
  });

  describe('POST /api/passive/import-text', () => {
    it('should return 400 when Content-Type is missing or not JSON', async () => {
      const req = new Request('http://localhost:4321/api/passive/import-text', {
        method: 'POST',
        body: 'árbol',
      });
      const ctx = createAstroContext(req, 'http://localhost:4321/api/passive/import-text');
      const res = await importTextRoute(ctx);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toContain('Content-Type');
    });

    it('should return 400 when text is empty', async () => {
      const req = new Request('http://localhost:4321/api/passive/import-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '   ' }),
      });
      const ctx = createAstroContext(req, 'http://localhost:4321/api/passive/import-text');
      const res = await importTextRoute(ctx);
      expect(res.status).toBe(400);
    });

    it('should import multiline words successfully (200)', async () => {
      const req = new Request('http://localhost:4321/api/passive/import-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: "sol\nluna\nestralla\nsol", language: 'es' }),
      });
      const ctx = createAstroContext(req, 'http://localhost:4321/api/passive/import-text');
      const res = await importTextRoute(ctx);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.insertedCount).toBe(3);
      expect(json.skippedCount).toBe(1);
    });
  });

  describe('POST /api/passive/import-csv', () => {
    it('should return 400 on empty CSV body', async () => {
      const req = new Request('http://localhost:4321/api/passive/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent: '' }),
      });
      const ctx = createAstroContext(req, 'http://localhost:4321/api/passive/import-csv');
      const res = await importCsvRoute(ctx);
      expect(res.status).toBe(400);
    });

    it('should import CSV payload successfully (200)', async () => {
      const req = new Request('http://localhost:4321/api/passive/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvContent: "palabra,fecha\nesperanza,2026-03-01\nvalentía,2026-03-02",
          language: 'es',
        }),
      });
      const ctx = createAstroContext(req, 'http://localhost:4321/api/passive/import-csv');
      const res = await importCsvRoute(ctx);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.insertedCount).toBe(2);
    });
  });

  describe('GET /api/passive/words', () => {
    it('should return paginated list and filter by search query', async () => {
      // Seed data
      const reqSeed = new Request('http://localhost:4321/api/passive/import-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: "alegría\ntristeza\nalborozo" }),
      });
      await importTextRoute(createAstroContext(reqSeed, 'http://localhost:4321/api/passive/import-text'));

      const req = new Request('http://localhost:4321/api/passive/words?q=al&limit=10');
      const ctx = createAstroContext(req, 'http://localhost:4321/api/passive/words?q=al&limit=10');
      const res = await getPassiveWordsRoute(ctx);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.total).toBe(2);
      expect(json.items.map((i: any) => i.word).sort()).toEqual(['alborozo', 'alegría']);
    });
  });

  describe('POST /api/active/analyze-text', () => {
    it('should return 400 when text is empty', async () => {
      const req = new Request('http://localhost:4321/api/active/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '' }),
      });
      const ctx = createAstroContext(req, 'http://localhost:4321/api/active/analyze-text');
      const res = await analyzeTextRoute(ctx);
      expect(res.status).toBe(400);
    });

    it('should analyze text, accumulate counts, and return summary (200)', async () => {
      const text = 'Práctica deliberada. La práctica constante genera excelencia.';
      const req = new Request('http://localhost:4321/api/active/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: 'es' }),
      });
      const ctx = createAstroContext(req, 'http://localhost:4321/api/active/analyze-text');
      const res = await analyzeTextRoute(ctx);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.tokensAnalyzed).toBe(7);
      expect(json.uniqueWords).toBe(6);
      expect(json.newWordsCount).toBe(6);
    });

    it('should ingest text with custom historical date and update boundaries', async () => {
      const date1 = '2023-05-10T00:00:00Z';
      const req1 = new Request('http://localhost:4321/api/active/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'disciplina constancia', language: 'es', date: date1 }),
      });
      await analyzeTextRoute(createAstroContext(req1, 'http://localhost:4321/api/active/analyze-text'));

      // Check date recorded
      const wordsReq1 = new Request('http://localhost:4321/api/active/words');
      const wordsRes1 = await getActiveWordsRoute(createAstroContext(wordsReq1, 'http://localhost:4321/api/active/words'));
      const wordsJson1 = await wordsRes1.json();
      const disc = wordsJson1.items.find((i: any) => i.word === 'disciplina');
      expect(new Date(disc.firstUsedAt).toISOString().startsWith('2023-05-10')).toBe(true);

      // Ingest older date 2021-02-01
      const dateOlder = '2021-02-01T00:00:00Z';
      const req2 = new Request('http://localhost:4321/api/active/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'disciplina', language: 'es', date: dateOlder }),
      });
      await analyzeTextRoute(createAstroContext(req2, 'http://localhost:4321/api/active/analyze-text'));

      const wordsRes2 = await getActiveWordsRoute(createAstroContext(wordsReq1, 'http://localhost:4321/api/active/words'));
      const wordsJson2 = await wordsRes2.json();
      const discUpdated = wordsJson2.items.find((i: any) => i.word === 'disciplina');
      expect(discUpdated.occurrences).toBe(2);
      expect(new Date(discUpdated.firstUsedAt).toISOString().startsWith('2021-02-01')).toBe(true);
      expect(new Date(discUpdated.lastUsedAt).toISOString().startsWith('2023-05-10')).toBe(true);
    });
  });

  describe('GET /api/active/words', () => {
    it('should return active words sorted by occurrences', async () => {
      const seedReq = new Request('http://localhost:4321/api/active/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'código limpio código limpio código reutilizable' }),
      });
      await analyzeTextRoute(createAstroContext(seedReq, 'http://localhost:4321/api/active/analyze-text'));

      const req = new Request('http://localhost:4321/api/active/words?sort=occurrences_desc');
      const ctx = createAstroContext(req, 'http://localhost:4321/api/active/words?sort=occurrences_desc');
      const res = await getActiveWordsRoute(ctx);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.total).toBe(3);
      expect(json.items[0].word).toBe('código');
      expect(json.items[0].occurrences).toBe(3);
      expect(json.items[1].word).toBe('limpio');
      expect(json.items[1].occurrences).toBe(2);
    });

    it('should return active words sorted by first_used_desc', async () => {
      await analyzeTextRoute(createAstroContext(
        new Request('http://localhost:4321/api/active/analyze-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'remoto', language: 'es', date: '2020-01-01T00:00:00Z' }),
        }),
        'http://localhost:4321/api/active/analyze-text'
      ));

      await analyzeTextRoute(createAstroContext(
        new Request('http://localhost:4321/api/active/analyze-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'presente', language: 'es', date: '2025-01-01T00:00:00Z' }),
        }),
        'http://localhost:4321/api/active/analyze-text'
      ));

      const req = new Request('http://localhost:4321/api/active/words?sort=first_used_desc');
      const res = await getActiveWordsRoute(createAstroContext(req, 'http://localhost:4321/api/active/words?sort=first_used_desc'));
      const json = await res.json();
      expect(json.items[0].word).toBe('presente');
      expect(json.items[1].word).toBe('remoto');
    });
  });

  describe('GET /api/stats', () => {
    it('should return global counts for active and passive words', async () => {
      // Seed passive
      await importTextRoute(createAstroContext(
        new Request('http://localhost:4321/api/passive/import-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: "uno\ndos\ntres" }),
        }),
        'http://localhost:4321/api/passive/import-text'
      ));

      // Seed active
      await analyzeTextRoute(createAstroContext(
        new Request('http://localhost:4321/api/active/analyze-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: "alfa alfa beta" }),
        }),
        'http://localhost:4321/api/active/analyze-text'
      ));

      const req = new Request('http://localhost:4321/api/stats?language=es');
      const ctx = createAstroContext(req, 'http://localhost:4321/api/stats?language=es');
      const res = await getStatsRoute(ctx);
      expect(res.status).toBe(200);

      const stats = await res.json();
      expect(stats.passiveCount).toBe(3);
      expect(stats.activeCount).toBe(2);
      expect(stats.totalActiveOccurrences).toBe(3);
    });
  });
});
