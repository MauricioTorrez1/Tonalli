# TonalliBlock

> *Tonalli* — "day / vital energy" in Náhuatl.

A calm, offline-first time-blocking app for iPhone, iPad, and Android. Your day
is a vertical timeline of connected nodes; the block happening *now* is the only
one that stands out, so your attention has one place to land.

TonalliBlock is designed **focus-first**, for people with ADHD or anyone who
finds it hard to hold attention: earthy low-arousal colors, at most two purposeful
animations per screen, and full respect for the system "reduce motion" setting.

## Status

**Phase 0 — foundation.** The day timeline renders from seeded sample data and
persists locally. Creating and editing blocks arrives in Phase 1.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | React Native + Expo (SDK 54) | One codebase for iOS/iPad/Android; runs in Expo Go today |
| Language | TypeScript (strict) | Type-safe, portfolio-grade |
| State + persistence | Zustand + `persist` over AsyncStorage | In-memory reads, offline by default; fast at this scale |
| Validation | Zod | One source of truth for types and runtime shape |
| Styling | NativeWind (Tailwind for RN) | Semantic color tokens, theme-driven |
| Animation | React Native Reanimated | 60 fps, purposeful motion only |
| Routing | Expo Router | File-based |
| Tests | Jest + React Native Testing Library | Domain and data covered |

## Architecture

```
UI (app/, features/*/components)
  → Domain (features/*/utils, hooks)   pure, testable, no React
    → Store (store/block-store.ts)     Zustand + persist
      → Storage (AsyncStorage)         validated with Zod at the boundary
```

Business logic lives in pure functions, not components. Time is stored as
**wall-clock** (`day` + minute offsets), never as an absolute UTC instant, so a
block at 09:00 stays at 9am wherever you are. Decisions are recorded as ADRs in
[`docs/adr/`](docs/adr).

## Run it

Requires Node 20+ and the Expo Go app (SDK 54) on your device.

```bash
npm install
npm start        # scan the QR code with Expo Go
```

Quality gates:

```bash
npm run lint
npm run typecheck
npm test
```

## Roadmap

- **Phase 1 — MVP:** create/edit/complete blocks, categories, recurrence, local
  notifications, light/dark theme.
- **Phase 2 — v1:** week view, drag to reschedule, stats, JSON backup/restore.
- **Phase 3 — Distribution:** PWA on Cloudflare Pages, or EAS Build → TestFlight.

## License

[MIT](LICENSE)
