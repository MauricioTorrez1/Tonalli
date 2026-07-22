# Architecture

TonalliBlock is a **100% offline** React Native app. There is no backend and no
sync: every read and write is local. This keeps the app fast, private, and
simple, and it matches the reality that a personal planner does not need a
server.

## Layers

```
UI (app/, features/*/components)
  → Domain (features/*/utils, features/*/hooks)   pure logic, no React, no I/O
    → Store (store/block-store.ts)                Zustand + persist middleware
      → Storage (store/storage.ts → AsyncStorage) validated with Zod on read
```

The hard rule: **business logic lives in pure functions** under
`features/*/utils`, never in components or the store. Those functions take the
clock as an argument instead of reading it, so they are deterministic and fully
unit-tested (`__tests__/timeline-layout.test.ts`).

## Data flow

```mermaid
flowchart TD
    subgraph Devices["Dispositivos"]
        A[iPhone]
        B[iPad]
        C[Android]
    end

    subgraph App["TonalliBlock · React Native + Expo + TypeScript"]
        UI["UI<br/>Timeline de nodos"]
        DOM["Dominio<br/>funciones puras + hooks"]
        STORE["Store Zustand<br/>fuente de verdad en memoria"]
        STORAGE[("AsyncStorage<br/>validado con Zod")]
        UI --> DOM --> STORE --> STORAGE
    end

    Devices --> App
```

## Key decisions

Each is recorded as an ADR (Architecture Decision Record) in [`adr/`](adr):

1. [Offline-only with AsyncStorage](adr/0001-offline-only-asyncstorage.md) — why
   no SQL, and the performance reasoning behind it.
2. [Wall-clock time model](adr/0002-wall-clock-time-model.md) — why blocks store
   `day` + minute offsets, not UTC instants.
3. [Zod validation at the boundary](adr/0003-zod-validation-at-the-boundary.md) —
   why storage reads are always validated.
4. [Focus-first design for attention](adr/0004-focus-first-design-for-attention.md)
   — the ADHD-oriented UI rules that govern layout and motion.
5. [Recurrence: virtual expansion](adr/0005-recurrence-virtual-expansion.md) — a
   recurring block is stored once and projected onto each matching day.
6. [Vivid category colors on warm-black](adr/0006-vivid-category-colors-on-warm-black.md)
   — how "more color" and "one clear focus" coexist.

## Domain model (Phase 1)

```
Block ──categoryId──> Category (fixed, built-in set)
  │
  ├──recurrenceId──> Recurrence (daily / weekdays / weekly)
  │
  └──(id, day) pair──> Completion[]  (done/not-done, independent per occurrence)
```

Completion lives outside `Block` specifically so a *recurring* block can be
completed on one day and not another — see ADR 5.

## Deferred to later phases

- **Per-occurrence overrides for recurring blocks** (skip one day, edit just one
  instance) — editing/deleting always acts on the whole series for now. See ADR 5.
- **List virtualization** (FlashList) — the day view holds ~30 blocks, below the
  point where it pays off. Introduced with the week view (Phase 2).
- **A live-updating clock** — the "now" indicator reflects the time as of the
  last render, not a ticking timer; it updates whenever the screen re-renders
  for another reason (e.g. returning to it). A `setInterval` tick can be added
  if this proves annoying in practice.
- **The separate `TimelineSpine` component** from the original plan was dropped:
  the spine is composed from per-node segments in `TimelineNode`, which
  guarantees continuity without measuring total height.
