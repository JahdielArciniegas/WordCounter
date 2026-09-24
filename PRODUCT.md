# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Language learners tracking their vocabulary evolution. Primary user today is the author (Jahdiel Arciniegas), who plans to share it with other learners. The product must be usable by anyone learning any language, not only the author.

## Product Purpose

WordCounter quantitatively measures a learner's vocabulary by separating passively recognized words from actively produced words, tracking frequency and temporal bounds across authored texts. It exists because existing tools (Anki, Lute, LingQ, Duolingo) focus on *acquisition* (teaching new words) but none measure *production* — what you actually use and how often. Success means the learner sees a clear, evolving picture of their vocabulary output over time.

## Positioning

A vocabulary measurement instrument, not a teaching tool. The mechanism no acquisition platform can truthfully claim: cumulative production frequency tracking across real authored texts with bidirectional temporal boundaries (first use / last use). Future integrations with learning tools are planned but measurement is the core identity.

## Operating Context

- Local-first: SQLite database, runs on the user's machine.
- Text ingestion workflow: paste authored text → tokenize → accumulate frequencies.
- Passive import workflow: paste word lists or upload CSV with historical dates.
- Users may ingest historical texts with backdated authoring dates.
- The product is used alongside language learning platforms, not instead of them.

## Capabilities and Constraints

### Confirmed capabilities
- Active vocabulary: text ingestion, in-memory tokenization, cumulative occurrence tracking, bidirectional temporal bounds (MIN first_used_at, MAX last_used_at), date-aware historical ingestion.
- Passive vocabulary: multiline text import, CSV import with date parsing, idempotent duplicate handling.
- Both: search, sorting (frequency, date, alphabetical, first-use), individual and bulk deletion.
- Privacy: raw text processed in-memory and discarded; only token metrics stored.

### Constraints
- Single-language per ingestion (currently defaults to Spanish; multi-language support is structural but not exposed in UI).
- No translation, no spaced repetition, no teaching features (yet).

### Undecided
- Future integrations with learning platforms (scope and timeline TBD).
- Multi-language UI (app runs in Spanish; English is not ruled out).

## Brand Commitments

Category standard (canon): Modern minimalist dark-themed dashboard inspired by clean toolcraft (Linear / Raycast / Readwise Reader). Zinc surfaces (#09090b ground, #18181b cards, #27272a borders), high typographic contrast, subtle status accents (emerald for active production, amber for passive recognition, indigo for frequency totals), clean data density with zero decorative clutter.

## Evidence on Hand

- Working application with 7 completed implementation phases.
- 32+ passing tests (Vitest).
- No user testimonials, case studies, or external content.
- No logo, wordmark, or brand assets beyond the current code.

## Product Principles

1. **Measure, don't teach** — The product's value is showing what you produce, not drilling what you should learn.
2. **Your data, your machine** — Local-first, no accounts, no cloud dependency. Privacy by architecture.
3. **Accumulate, never lose** — Every text ingested adds to a growing picture. Data flows in, never out without intent.
4. **Honest numbers** — No gamification, no streaks, no inflated metrics. What you see is what you wrote.
5. **Minimalist by design** — Show only what matters. Every element earns its place.

## Accessibility & Inclusion

No specific requirements established beyond standard web accessibility best practices (semantic HTML, keyboard navigation, sufficient contrast).
