# Hamad AI

Hamad AI is a lightweight, local-first Python assistant starter that runs in the terminal without external dependencies.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- `python3 -m hamad_ai` — run Hamad AI locally

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Python 3.11+ with the standard library
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `hamad_ai/` — Python assistant package and CLI
- `pyproject.toml` — Python project metadata and executable entry point
- `artifacts/api-server/` — existing shared API service
- `artifacts/mockup-sandbox/` — existing component preview workspace

## Architecture decisions

- The first version is dependency-free and local-first so it runs immediately without an API key.
- `Assistant.respond` is the extension point for connecting a future model provider.

## Product

The current product is an interactive terminal assistant with built-in help, about, time, clear, and exit commands.

## Gotchas

- Run Python from the repository root so the `hamad_ai` package is importable.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
