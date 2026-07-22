# 5. Recurrence: virtual expansion, not materialized rows

- **Status:** Accepted
- **Date:** 2026-07-22

## Context

Phase 0 deferred this decision explicitly (see `docs/architecture.md`'s "Deferred to later phases" section): should a recurring block be stored as one row per occurrence (materialized), or as a single rule that gets projected onto whichever day is being viewed (virtual expansion)?

## Decision

**Virtual expansion.** A recurring block is stored once — a normal `Block` row (the "template") with `recurrenceId` set, anchored to the day it was created on — plus a `Recurrence` rule (`daily` / `weekdays` / `weekly`, with an optional end date). `blocksForDay` (in `features/timeline/utils/recurrence.ts`) projects the template onto any viewed day whose rule matches, producing a `Block`-shaped object with `day` swapped to that day, never written to storage.

Completion is tracked separately, as a `(blockId, day)` pair (`types/completion.ts`), which is what makes each *occurrence* of a recurring block completable independently without needing a stored row per occurrence.

## Consequences

- Storage stays O(1) per recurring series regardless of how far into the future the user scrolls — nothing to backfill, nothing to keep in sync.
- **Scope limit, deliberate:** editing or deleting a recurring block always acts on the *whole series*. There is no per-occurrence override yet (e.g., "skip just this Tuesday" or "make this one instance longer"). The block-form UI states this plainly when editing a recurring block. Revisit if/when that becomes a real need — the model doesn't preclude adding exceptions later, it just doesn't have them now.
- Local notifications lean on `expo-notifications`' own repeating calendar triggers (daily/weekly) rather than re-scheduling per virtual occurrence — see `features/notifications/triggers.ts`. Known limitation: Expo's repeating triggers have no built-in end date, so a recurrence's `endsOn` is not enforced for already-scheduled notifications. Acceptable for Phase 1; would need periodic cleanup to fix properly.
- A projected occurrence keeps the template's `id` (completions match by `(blockId, day)`, not a unique per-occurrence id) — UI list keys must use `${block.id}-${block.day}`, not `block.id` alone.
