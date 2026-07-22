# TonalliBlock

> *Tonalli* — "day / vital energy" in Náhuatl.

A calm, offline-first time-blocking app for iPhone, iPad, and Android. Your day
is a vertical timeline of connected nodes on a warm near-black background; the
block happening *now* is the only one that renders as a solid color fill —
everything else stays a quiet, translucent outline of its own category color.

TonalliBlock is designed **focus-first**, for people with ADHD or anyone who
finds it hard to hold attention: a curated set of vivid category colors (not a
free color picker), at most two purposeful animations per screen, and full
respect for the system "reduce motion" setting. See
[ADR 4](docs/adr/0004-focus-first-design-for-attention.md) and
[ADR 6](docs/adr/0006-vivid-category-colors-on-warm-black.md).

## Status

**Phase 1 — MVP.** Create, edit, complete, and delete blocks; a fixed set of
built-in categories; daily/weekdays/weekly recurrence; local notifications at
each block's start time; light/dark/system theme (dark by default).

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | React Native + Expo (SDK 54) | One codebase for iOS/iPad/Android; runs in Expo Go today |
| Language | TypeScript (strict) | Type-safe, portfolio-grade |
| State + persistence | Zustand + `persist` over AsyncStorage | In-memory reads, offline by default; fast at this scale |
| Validation | Zod | One source of truth for types and runtime shape |
| Styling | NativeWind (Tailwind for RN) | Semantic color tokens, light/dark theme-driven |
| Animation | React Native Reanimated | 60 fps, purposeful motion only |
| Routing | Expo Router | File-based, modal screens for forms/settings |
| Notifications | expo-notifications | Local reminders at each block's start time |
| Icons | @expo/vector-icons | SVG icons for UI controls (emoji stays user-facing content only) |
| Time picker | @react-native-community/datetimepicker | Native start/end time selection |
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

- **Phase 2 — v1:** week view, drag to reschedule, stats, JSON backup/restore,
  donation button.
- **Phase 3 — Distribution:** PWA on Cloudflare Pages, or EAS Build → TestFlight.

## License

[MIT](LICENSE)
