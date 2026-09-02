---
name: Assistant persistence boundary
description: The current assistant data model and the boundary to revisit when accounts are introduced.
---

Hamad AI persistence is intentionally project-level while the product has no authentication. If accounts are added, every task, reminder, conversation, message, and settings query must gain an explicit user scope.

**Why:** The requested assistant needed durable data immediately, but introducing auth would have changed the product flow and was not part of the current request.

**How to apply:** Treat the current database as single-user only; do not expose it as a multi-user system without adding ownership constraints and migration coverage.