---
name: Toolchain compatibility
description: Compatibility constraints found while extending the Drizzle and OpenAPI-generated clients.
---

With the workspace's current Drizzle and Zod versions, identity-generated IDs are already excluded from Drizzle insert schemas, and OpenAPI integer fields can generate unsupported zod.int() calls. Prefer generated insert schemas without an id omit and numeric OpenAPI IDs unless the Zod toolchain is upgraded together.

**Why:** The database push and library typecheck exposed these version-specific incompatibilities during the assistant persistence work.

**How to apply:** Preserve this pairing when adding new tables or API resources; verify schema push and generated-client typecheck together after contract changes.