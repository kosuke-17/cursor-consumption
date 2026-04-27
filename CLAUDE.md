# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**cursor-consumption** is a tool for tracking and analyzing Cursor AI editor token consumption and costs. It captures usage events via Cursor's Hooks feature, stores them in PostgreSQL, and provides a Next.js Web dashboard for cost analysis.

## Architecture

Monorepo: Next.js app at the **repository root** (App Router, `src/`) plus a shared package:
- `packages/core` — Shared business logic: cost calculation, Prisma storage
- Root `src/app/api/**/route.ts` — Route Handlers for data ingestion

Data flow: Cursor Hooks (`hooks.json` + `.cursor/hooks/audit.mjs`) → Next.js Route Handler (POST) → PostgreSQL

Key design decisions:
- **PostgreSQL backend**: Usage data stored in local PostgreSQL (Docker Compose)
- **Prisma ORM**: Type-safe queries, migration management via `prisma/schema.prisma`
- **Pricing table externalized**: `pricing/models.json` for easy updates when Cursor changes rates

## Tech Stack

TypeScript (strict), Node.js 20 LTS, pnpm workspaces + turborepo, PostgreSQL + Prisma, Vitest, Next.js (App Router), shadcn/ui + Tailwind, Recharts

## Key Documents

- `docs/requirements.md` — Full requirements definition (Japanese)
- `docs/system-design.md` — System design with architecture, DB schema, API routes (Japanese)

## Development

```bash
docker compose up -d       # Start PostgreSQL
pnpm install               # Install dependencies
npx prisma generate        # Generate Prisma Client
npx prisma migrate dev     # Run DB migrations
pnpm build                 # Build core (Turbo) + Next.js
pnpm test                  # Run tests (Vitest)
pnpm dev                   # Run Next.js dev server (port 3000)
```

Requires `DATABASE_URL` in `.env` (e.g. `postgresql://user:password@localhost:5432/cursor_consumption`).
