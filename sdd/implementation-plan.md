# Implementation Plan — WordCounter MVP

## Phase Breakdown & Acceptance Criteria

### Phase 1: Project Scaffolding & Environment Setup
- **Goal**: Initialize clean Astro project with SSR Node adapter, React integration, Drizzle ORM, better-sqlite3, Tailwind CSS, and Vitest.
- **Tasks**:
  1. Clean old express-only boilerplate.
  2. Configure `package.json` with scripts (`dev`, `build`, `preview`, `test`, `db:push`).
  3. Set up `pnpm-workspace.yaml` with required `allowBuilds` (`better-sqlite3`, `esbuild`).
  4. Create `astro.config.mjs` with `output: 'server'`, `@astrojs/node`, `@astrojs/react`, and `@astrojs/tailwind`.
  5. Set up `tsconfig.json` and `vitest.config.ts`.
- **Verification Gate**: `pnpm build` and `pnpm test` succeed on empty setup.

---

### Phase 2: Database Layer & Drizzle Schema
- **Goal**: Establish SQLite connection, define schemas, and prepare atomic query helpers.
- **Tasks**:
  1. Define Drizzle schema for `passive_words` and `active_words` in `src/db/schema.ts`.
  2. Implement SQLite connection & singleton in `src/db/index.ts`.
  3. Create migration/push helper scripts.
  4. Unit test schema constraints (unique indexes, timestamp defaults).
- **Verification Gate**: Vitest tests verifying unique constraint on `(word, language)` and default timestamps.

---

### Phase 3: Core Domain Services
- **Goal**: Implement tokenizer and ingestion services with unit test coverage.
- **Tasks**:
  1. `TokenizerService`: Unicode-compliant word extraction and frequency mapping (`src/services/tokenizer.ts`).
  2. `CsvParserService`: Parse CSV with date column extraction (`src/services/csv-parser.ts`).
  3. `PassiveVocabService`: Multiline and CSV batch ingestion (`src/services/passive.service.ts`).
  4. `ActiveVocabService`: Text analysis and cumulative occurrence upserts (`src/services/active.service.ts`).
- **Verification Gate**: 100% pass on service unit tests (tokenization accuracy, idempotent imports, accumulation logic).

---

### Phase 4: API Endpoints (Astro SSR Node Endpoints)
- **Goal**: Expose REST endpoints for ingestion and queries.
- **Tasks**:
  1. `src/pages/api/passive/import-text.ts`
  2. `src/pages/api/passive/import-csv.ts`
  3. `src/pages/api/passive/words.ts`
  4. `src/pages/api/active/analyze-text.ts`
  5. `src/pages/api/active/words.ts`
  6. `src/pages/api/stats.ts`
- **Verification Gate**: Supertest / fetch integration tests covering all HTTP status codes (200, 400, 500).

---

### Phase 5: UI Shell, Navigation & Layout
- **Goal**: Create responsive, dark-mode Astro layout with navigation between sections.
- **Tasks**:
  1. Base layout `src/layouts/Layout.astro` with navbar, footer, and active tab highlights.
  2. Landing page `src/pages/index.astro` (Overview & Global stats).
  3. Passive view `src/pages/passive.astro`.
  4. Active view `src/pages/active.astro`.
- **Verification Gate**: All pages render cleanly with 0 console/runtime errors.

---

### Phase 6: React Interactive Islands
- **Goal**: Build rich client-side interactive islands for both sections.
- **Tasks**:
  1. `PassiveWordsManager.tsx`: Multiline textarea modal/panel, CSV file dropper, searchable data table with sorting.
  2. `ActiveWordsManager.tsx`: Text input analysis box, live submission metrics, frequency-ranked data table with search.
  3. Search & filter bar with debounce.
- **Verification Gate**: Full end-to-end interactive flow test (import passive words, submit active text, verify live updates).

---

### Phase 7: Date-Aware Active Vocabulary Ingestion & Historical Timeline
- **Goal**: Support historical and backdated text ingestion by adding a date picker in the active tokenizer, updating active words with bidirectional boundary tracking (`first_used_at` as earliest date seen, `last_used_at` as latest date seen), and adding earliest-usage sorting.
- **Tasks**:
  1. Update `ActiveVocabService.analyzeAndIngestText` to accept an optional custom `date` (timestamp or Date object, defaulting to current time).
  2. Modify atomic upsert SQL statement in `ActiveVocabService` to enforce temporal boundaries:
     - `first_used_at = MIN(active_words.first_used_at, excluded.first_used_at)`
     - `last_used_at = MAX(active_words.last_used_at, excluded.last_used_at)`
  3. Support `first_used_desc` in `ActiveVocabService.getActiveWords` and the `GET /api/active/words` endpoint.
  4. Update `POST /api/active/analyze-text` route to parse, validate, and pass optional `date` payload to the domain service.
  5. Update `ActiveWordsManager.tsx` UI:
     - Add date input field (`<input type="date" />`) in the text submission card, defaulting to today's date.
     - Include selected date in analysis payload.
     - Add '1° uso' sort button to sort by earliest historical usage.
  6. Add unit and integration tests in `tests/services.test.ts` & `tests/api.test.ts`:
     - Ingesting text with an older date updates `first_used_at` and preserves `last_used_at`.
     - Ingesting text with a newer date updates `last_used_at` and preserves `first_used_at`.
     - Ingesting text with an intermediate date preserves both boundaries while accumulating `occurrences`.
     - Sorting by `first_used_desc` returns words ordered by earliest usage.
- **Verification Gate**: Vitest test suite passes with 100% of new temporal boundary and sorting tests passing cleanly.

---

### Phase 8: Dockerization & Containerized Environments (Dev & Prod)
- **Goal**: Provide containerized workflows for both local development (hot-reload, volume mounts) and production testing (multi-stage build, lightweight runtime, persistent SQLite storage) allowing anyone to run WordCounter locally without configuring host Node or toolchains.
- **Tasks**:
  1. Create `.dockerignore` excluding `node_modules`, `dist`, `.astro`, `*.db*`, and local caches.
  2. Create `Dockerfile` (multi-stage production image: build stage with native compile tools for `better-sqlite3`, slim production runner executing standalone Astro server).
  3. Create `Dockerfile.dev` (development image with pnpm and live dev server on `0.0.0.0:4321`).
  4. Create `docker-compose.yml` (production service definition with persistent volume for `/data/wordcounter.db` and port 4321).
  5. Create `docker-compose.dev.yml` (development service definition with source bind mount, node_modules volume, and hot reload).
- **Verification Gate**: Container builds cleanly, serves application on port 4321, and SQLite database persists across container restarts.

---

### Phase 9: Comprehensive Project Documentation & README
- **Goal**: Author a complete, professional `README.md` that introduces WordCounter, documents the linguistic acquisition model (active vs. passive vocabulary), and provides clear step-by-step instructions for running locally (pnpm) and containerized (Docker).
- **Tasks**:
  1. Project Overview & Philosophy: Quantitative linguistic measurement, active vs. passive vocabulary theory, local-first privacy.
  2. Tech Stack Summary: Astro SSR, React islands, Drizzle ORM, better-sqlite3, Tailwind CSS v4, Vitest.
  3. Prerequisites & Native Setup: Instructions for Node 24+, pnpm, installation, running tests, dev server, and build.
  4. Docker Usage Guide: Explicit commands for development (`docker compose -f docker-compose.dev.yml up`) and production (`docker compose up -d`).
  5. Feature Guide: Text tokenization with date tracking, CSV format specifications, ratio analytics.
  6. Project Structure & Architecture overview.
- **Verification Gate**: Markdown renders cleanly, all documented commands execute without errors, and setup steps tested.

---

### Phase 10: Local Morphological Lexical Validation (ES & EN)
- **Goal**: Provide offline, high-performance lexical validation using Hunspell-compatible morphological dictionaries (`n-spell` with `dictionary-es` and `dictionary-en`) to verify word existence before committing words to active or passive vocabulary, discarding invalid non-words, OCR noise, and typos while supporting natural inflections (conjugations, plurals, clitics).
- **Tasks**:
  1. Add dependencies: `n-spell`, `dictionary-es`, `dictionary-en` (and types if needed).
  2. Implement `LexicalValidatorService` (`src/services/lexical-validator.service.ts`):
     - Lazy-load and cache in-memory dictionary instances per language (`es` default, `en` supported).
     - Provide `isValidWord(word: string, language?: string): boolean` method.
     - Support batch filtering via `filterValidWords(words: string[], language?: string): { valid: string[]; discarded: string[] }`.
  3. Integrate with Active Vocabulary ingestion:
     - Update `ActiveVocabService.analyzeAndIngestText` to filter tokenized words through `LexicalValidatorService` before SQLite atomic upsert.
     - Include discarded tokens in analysis response metadata (`discardedCount`, `discardedWords`).
  4. Integrate with Passive Vocabulary ingestion:
     - Update `PassiveVocabService.addWord` and `PassiveVocabService.importWords` to validate inputs before insertion.
     - Idempotently discard invalid non-words and report counts in API responses.
  5. UI Transparency & Feedback:
     - Update `ActiveWordsManager.tsx` and `PassiveWordsManager.tsx` to display feedback when invalid tokens are discarded during text analysis or CSV batch import.
  6. Automated Test Suite (`tests/services.test.ts`, `tests/api.test.ts`):
     - Validate Spanish verb conjugations, irregular verbs, and plurals pass validation.
     - Validate English inflections and plurals pass validation.
     - Validate non-existent gibberish and typos are rejected.
     - Validate end-to-end active analysis and passive import filter out invalid words.
- **Verification Gate**: 100% of Vitest test suite passes, zero external network calls, in-memory validation throughput exceeds 50,000 words/second.


