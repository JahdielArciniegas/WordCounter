# -----------------------------------------------------------------------------
# Stage 1: Dependencies & Native Compilation
# -----------------------------------------------------------------------------
FROM node:22-bookworm-slim AS deps

WORKDIR /app

# Install build dependencies for better-sqlite3 native C++ addon
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@11.24.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* .npmrc* ./
RUN pnpm install --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:22-bookworm-slim AS builder

WORKDIR /app

RUN npm install -g pnpm@11.24.0

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Astro standalone server output
RUN pnpm build

# Prune devDependencies to keep the production runtime lean
RUN pnpm prune --prod

# -----------------------------------------------------------------------------
# Stage 3: Production Runner
# -----------------------------------------------------------------------------
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
ENV DB_PATH=/data/wordcounter.db

# Ensure directory exists for persistent SQLite database
RUN mkdir -p /data

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 4321
VOLUME ["/data"]

CMD ["node", "./dist/server/entry.mjs"]
