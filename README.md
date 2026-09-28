# WordCounter

> **Quantitative lexical measurement and vocabulary acquisition tracker.**  
> Distinguish passive recognition from active lexical production with clinical precision.

[![Node Version](https://img.shields.io/badge/node-22%2B%20(LTS)-brightgreen.svg)](https://nodejs.org/)
[![Astro Version](https://img.shields.io/badge/astro-7.3-purple.svg)](https://astro.build/)
[![TypeScript](https://img.shields.io/badge/typescript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## Overview & Philosophy

In Second Language Acquisition (SLA), there is a fundamental divide between two lexical categories:

- **Passive Vocabulary**: Words you recognize when reading or listening, but do not spontaneously produce.
- **Active Vocabulary**: Words you have internalized and can actively retrieve during spontaneous speech or writing.

Most language platforms (Anki, Duolingo, LingQ) focus primarily on passive recognition through flashcards or reading comprehension. **WordCounter** addresses the missing half of the equation: measuring **linguistic production**.

WordCounter treats your vocabulary as an auditable, quantifiable system:
- **Active Lexical Accounting**: Submit original compositions, essays, or journal entries to extract unique lemmas, track cumulative usage volume, and monitor temporal boundaries (`first_used_at` and `last_used_at`).
- **Passive Inventory**: Maintain a catalog of words you recognize (via manual entry or CSV imports from Anki/LingQ).
- **Linguistic Ratio**: Instantly see your active-to-passive conversion ratio, showing how effectively passive knowledge transforms into active expression.
- **Local-First & Private**: Powered by an embedded SQLite database running with Write-Ahead Logging (WAL). Zero third-party analytics, zero cloud dependencies, and zero subscription lock-in.

---

## Tech Stack

- **Framework**: [Astro 7](https://astro.build/) (Server-Side Rendering with `@astrojs/node` standalone adapter)
- **Interactive Islands**: [React 19](https://react.dev/) + [Lucide Icons](https://lucide.dev/)
- **Database & ORM**: [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) + [Drizzle ORM](https://orm.drizzle.team/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (Zero-runtime Vite plugin)
- **Testing**: [Vitest](https://vitest.dev/) (Unit, API integration, and schema constraint tests)
- **Containerization**: [Docker](https://www.docker.com/) & Docker Compose (Development & Production environments)

---

## Getting Started (Native / Local)

### Prerequisites

- **Node.js**: `v22.0.0` or higher (Active LTS recommended for native SQLite stability)
- **pnpm**: `v11.0.0` or higher
- C++ build tools (required by `better-sqlite3` native bindings):
  - Linux: `python3`, `make`, `g++` (`build-essential`)
  - macOS: Xcode Command Line Tools (`xcode-select --install`)
  - Windows: Visual Studio Build Tools or Windows Subsystem for Linux (WSL2)

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/JahdielArciniegas/WordCounter.git
cd wordcounter
pnpm install
```

### 2. Development Server

Start the local development server with hot-module reloading:

```bash
pnpm dev
```

Open your browser at `http://localhost:4321`.

### 3. Running Tests

Execute the full Vitest suite:

```bash
pnpm test
```

Or run tests in watch mode:

```bash
pnpm test:watch
```

### 4. Production Build

Build the standalone server bundle and run it locally:

```bash
pnpm build
pnpm start
```

---

## Docker Workflows

WordCounter includes pre-configured Docker configurations for both zero-friction development and production deployment.

### Development with Live Reload (`docker-compose.dev.yml`)

Run WordCounter in an isolated container with host source code mounting and hot reload:

```bash
docker compose -f docker-compose.dev.yml up
```

- **Features**:
  - Source code changes reflect immediately without rebuilding the image.
  - Container-isolated `node_modules` prevents host-OS binary compatibility conflicts.
  - Development database persists in a dedicated named volume (`wordcounter-dev-data`).
  - Accessible at `http://localhost:4321`.

To stop the development container:

```bash
docker compose -f docker-compose.dev.yml down
```

### Production Deployment (`docker-compose.yml`)

Deploy the multi-stage, optimized production image:

```bash
docker compose up -d --build
```

- **Features**:
  - Multi-stage build isolates build toolchains (`python3`, `make`, `g++`) from the final runtime image.
  - Automatic `pnpm prune --prod` keeps the runtime footprint minimal.
  - Standalone Node SSR server with internal port `4321` mapped to host `4321`.
  - SQLite database persists in a named volume (`wordcounter-data`) mounted at `/data/wordcounter.db`.

To inspect running container logs:

```bash
docker compose logs -f
```

To stop the production service:

```bash
docker compose down
```

---

## Key Features & Usage

### 1. Text Ingestion & Active Tokenizer
- Navigate to the **Dashboard** or **Active Vocabulary** section (`/active`).
- Paste text from your journal, essay, or conversation practice.
- **Date-Aware Ingestion**: Select any historical date to backdate texts. The system accurately sets or expands temporal boundaries (`first_used_at` as the earliest date seen, `last_used_at` as the latest date seen).
- The engine tokenizes, strips punctuation, and atomically upserts occurrences into SQLite.

### 2. Passive Vocabulary Catalog
- Navigate to **Passive Vocabulary** (`/passive`).
- Add single words or paste a list of words separated by commas or line breaks.
- Upload standard CSV files exported from Anki or language apps.
- All imports use idempotent `INSERT OR IGNORE` operations to avoid duplicate entries.

### 3. Analytical Dashboard
- View total unique active words vs. passive words.
- Monitor your **Active/Passive Lexical Ratio**.
- Sort active words by:
  - **Frecuencia**: Most frequently produced words.
  - **Reciente**: Most recently used words (`last_used_at`).
  - **1° uso**: Earliest historical first encounter (`first_used_at`).
  - **Alfabético**: Alphabetical index.

---

## Project Structure

```text
wordcounter/
├── src/
│   ├── components/         # Interactive React 19 islands
│   │   ├── ActiveWordsManager.tsx
│   │   └── PassiveWordsManager.tsx
│   ├── db/                 # Drizzle ORM & SQLite setup
│   │   ├── index.ts        # Database connection & automated schema init
│   │   └── schema.ts       # Table schemas (active_words, passive_words)
│   ├── layouts/            # Astro layout shells
│   │   └── Layout.astro
│   ├── pages/              # Astro SSR routes & REST API endpoints
│   │   ├── api/
│   │   │   ├── active/     # /api/active/words, /api/active/analyze-text
│   │   │   └── passive/    # /api/passive/words, /api/passive/import
│   │   ├── active.astro    # Active vocabulary view
│   │   ├── index.astro     # Main dashboard & ratio analytics
│   │   └── passive.astro   # Passive vocabulary catalog
│   ├── services/           # Domain business logic
│   │   ├── active-vocab.service.ts
│   │   ├── passive-vocab.service.ts
│   │   └── tokenizer.service.ts
│   └── styles/             # Global styles and Tailwind CSS v4 setup
├── tests/                  # Automated Vitest test suite
│   ├── api.test.ts         # REST API contract and endpoint tests
│   ├── db.test.ts          # Database schema and constraint tests
│   ├── services.test.ts    # Tokenizer & domain service unit tests
│   └── smoke.test.ts       # Page routing smoke tests
├── docker-compose.yml      # Production container orchestration
├── docker-compose.dev.yml  # Development orchestration with live reload
├── Dockerfile              # Multi-stage production container build
├── Dockerfile.dev          # Development container build
├── astro.config.mjs        # Astro configuration with Node SSR adapter
└── package.json            # Project dependencies and scripts
```

---

## Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `development` | Runtime environment (`development` or `production`). |
| `HOST` | `0.0.0.0` | Network interface to bind server. |
| `PORT` | `4321` | HTTP port for Astro application. |
| `DB_PATH` | `wordcounter.db` | Path to the SQLite database file (e.g. `/data/wordcounter.db`). |

---

## License

This project is licensed under the MIT License.
