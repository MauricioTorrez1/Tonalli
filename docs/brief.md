# Original brief & scope log

This file preserves the project's original vision and records how the scope
changed during planning. Rationale for each change lives in the ADRs.

## Original vision

**TonalliBlock** — an offline-first time-blocking / day-tracking app inspired by
Structured, built as a GitHub portfolio piece.

- **Offline-first**, cross-platform (iPhone / iPad / Android) from one codebase.
- **Minimalist design** around a **vertical timeline of nodes** connected by a
  spine; the active block is highlighted.
- **Tonalli** ("day / vital energy" in Náhuatl) — warm, serene visual identity.
- Universal + language-specific good practices, clean commits, README, docs.

The original spec proposed a monorepo with a Python/FastAPI sync backend, an
SQLite + Drizzle local database, and deployment as a PWA on Netlify.

## Scope changes made during planning

| # | Change | Why (see ADR) |
| --- | --- | --- |
| 1 | **Removed the Python/FastAPI backend** | Backend practice moves to a separate dedicated project. |
| 2 | **Removed the monorepo** | Its only purpose was to co-host TS + Python. With one JS project, a flat `src/` (like the author's other apps) is right. |
| 3 | **Removed SQL / SQLite / Drizzle** → AsyncStorage | Focus is TypeScript syntax; and at this scale in-memory reads are faster. See [ADR 1](adr/0001-offline-only-asyncstorage.md). |
| 4 | **Pinned Expo SDK 54** (not the latest) | Only SDK 54 Expo Go is installable from the App Store today; SDK 55+ has been stuck in Apple review since May 2026. |
| 5 | **Deploy target: Cloudflare Pages** (not Netlify) | Larger edge network, unlimited free bandwidth. Deferred to Phase 3. |
| 6 | **Added a focus-first / ADHD design mandate** | See [ADR 4](adr/0004-focus-first-design-for-attention.md). |

## What stayed

Vertical node timeline, warm Tonalli palette, offline-first, TypeScript strict,
Expo + Expo Router + NativeWind + Reanimated, Conventional Commits, CI, and a
layered architecture that keeps the door open to reintroducing SQLite later.

## Kept features roadmap

- **Phase 1 — MVP:** CRUD, complete, categories, recurrence, local notifications,
  light/dark theme.
- **Phase 2 — v1:** week view (FlashList), drag to reschedule, stats, JSON
  backup/restore, donation button (Ko-fi, URL in `.env`).
- **Phase 3 — Distribution:** PWA on Cloudflare Pages or EAS Build → TestFlight.
