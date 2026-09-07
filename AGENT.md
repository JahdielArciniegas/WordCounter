# AGENT.md — WordCounter Developer & Agent Guide

## Project Overview
WordCounter is a local-first vocabulary tracking and analysis application designed to distinguish between **Passive Vocabulary** (recognition) and **Active Vocabulary** (production frequency across written texts).

## Tech Stack
- **Framework**: Astro v7.3+ (SSR mode with `@astrojs/node` standalone adapter)
- **Interactive Islands**: React 19.2+ (`@astrojs/react`)
- **Runtime**: Node.js v24+
- **Database & ORM**: SQLite (`better-sqlite3`) managed via **Drizzle ORM** (`drizzle-orm`, `drizzle-kit`)
- **Styling**: Tailwind CSS / Vanilla CSS (Dark theme first)
- **Package Manager**: `pnpm`
- **Testing**: Vitest for unit & integration testing

## Core Architecture Principles
1. **Separation of Concerns**: Business logic and database operations reside in dedicated services under `src/services/` and `src/db/`.
2. **Server-Side Rendering (SSR) by Default**: Astro pages render the structural shell, initial metadata, and server routes (`src/pages/api/`).
3. **Islands Architecture**: React components are mounted only where rich client-side interactivity is strictly required (e.g., search filtering, live text analysis, upload drag-and-drop).
4. **Data Integrity & Privacy**:
   - Duplicate passive words are ignored (`ON CONFLICT DO NOTHING`).
   - Active words accumulate frequency counts.
   - Raw submitted text for active word analysis is processed in-memory and immediately discarded (only token metrics are stored).

## Project Structure
```
wordcounter/
├── sdd/                        # Spec-Driven Development Artifacts
│   ├── functional-spec.md      # Functional specifications & requirements
│   ├── technical-spec.md       # Technical design & schema architecture
│   └── implementation-plan.md  # Phased execution tasks & verification
├── src/
│   ├── components/             # React islands & Astro layout components
│   ├── db/                     # Drizzle schema, migrations, connection
│   ├── layouts/                # Astro page layouts
│   ├── pages/                  # Astro SSR pages and API routes (/api/*)
│   ├── services/               # Tokenizer, vocabulary services, parsers
│   └── types/                  # Shared TypeScript interfaces
├── tests/                      # Vitest test suites
├── AGENT.md                    # This document
├── astro.config.mjs            # Astro configuration (SSR + Node adapter)
├── drizzle.config.ts           # Drizzle Kit configuration
└── package.json
```

## Development Workflow & Commands
- `pnpm dev`: Start local development server with HMR.
- `pnpm build`: Build production Astro SSR bundle.
- `pnpm preview`: Preview production build locally.
- `pnpm test`: Run full Vitest test suite.
- `pnpm db:generate`: Generate Drizzle SQL migrations.
- `pnpm db:push`: Push Drizzle schema to SQLite database.
