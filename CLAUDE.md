# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**cursor-consumption** (`ccm`) is a tool for tracking and analyzing Cursor AI editor token consumption and costs. It retrieves usage data from Cursor's APIs, stores it locally, and provides CLI + Web dashboard interfaces for cost analysis.

## Architecture

Monorepo with three packages under `packages/`:
- `core` — Shared business logic: auth token resolution, Cursor API client, cost calculation, SQLite storage
- `cli` — CLI application (`ccm` command) using commander
- `web` — Next.js dashboard (Phase 2)

Key design decisions:
- **PostgreSQL backend**: Usage data stored in local PostgreSQL
- **Prisma ORM**: Type-safe queries, migration management via `prisma/schema.prisma`
- **Token resolution chain**: Tries SQLite (Cursor's state.vscdb) → env var → manual input
- **Pricing table externalized**: `pricing/models.json` for easy updates when Cursor changes rates

## Tech Stack

TypeScript (strict), Node.js 20 LTS, pnpm workspaces + turborepo, PostgreSQL + Prisma, sql.js (Cursor DB reader), Vitest, Next.js (App Router), shadcn/ui + Tailwind, Recharts

## Key Documents

- `docs/requirements.md` — Full requirements definition (Japanese)
- `docs/system-design.md` — System design with architecture, DB schema, CLI design, API routes (Japanese)

## Development

Project is pre-implementation. Start with Phase 1 steps defined in `docs/system-design.md` section 11.

```bash
# Once set up:
pnpm install              # Install dependencies
npx prisma migrate dev    # Run DB migrations
npx prisma generate       # Generate Prisma Client
pnpm build                # Build all packages
pnpm test                 # Run tests (Vitest)
pnpm --filter cli dev     # Run CLI in dev mode
pnpm --filter web dev     # Run web dashboard
```

Requires `DATABASE_URL` in `.env` (e.g. `postgresql://user:password@localhost:5432/cursor_consumption`).
