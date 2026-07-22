# 3. Zod validation at the boundary

- **Status:** Accepted
- **Date:** 2026-07-22

## Context

Data read back from AsyncStorage is an untrusted string. It may have been written
by an older version of the app or be corrupt. TypeScript types vanish at runtime,
so a bare `JSON.parse` gives a value the compiler *believes* is a `Block` but
that may not be.

## Decision

Define the `Block` model once as a **Zod schema** and derive the TypeScript type
with `z.infer`. Validate every read from storage against the schema at the
boundary (`store/storage.ts`). On any failure — malformed JSON or a schema
mismatch — return `null` and let the caller start clean, never crash.

## Consequences

- One source of truth: the static type and the runtime check cannot drift.
- Corrupt or outdated stored data degrades gracefully instead of throwing.
- A small runtime cost on read, negligible against the safety it buys.
- Tested directly in `__tests__/storage.test.ts` (corrupt JSON, schema
  violations, round-trips).
