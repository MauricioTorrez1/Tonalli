# 1. Offline-only persistence with AsyncStorage

- **Status:** Accepted
- **Date:** 2026-07-22

## Context

TonalliBlock is a personal time-blocking app. It must work fully offline. We
need local persistence, and we considered `expo-sqlite` (with Drizzle ORM) vs.
`AsyncStorage`.

## Decision

Use **AsyncStorage**, wrapped by Zustand's `persist` middleware, with the whole
block list held in memory.

The decision was made on **performance**, not just simplicity. At this app's
scale, reading blocks is a `.filter()` over an array already in RAM —
synchronous, microseconds — which SQLite cannot beat because a query engine
always has to be crossed. Writes rewrite the full JSON blob, but at a realistic
~9,000 blocks over three years (~1.4 MB) that is tens of milliseconds on a
native async module, debounced and imperceptible.

AsyncStorage is also the only option that runs in **Expo Go**: `react-native-mmkv`
is a native module requiring a development build.

## Consequences

- No migrations tooling, no babel/metro config for SQL — the setup is one
  dependency.
- The persisted shape carries a `version` field so Zustand `persist` migrations
  can transform old data when the model changes.
- **Revisit if:** saving a block feels slow on device, hydration exceeds ~200 ms,
  or history-wide stats get heavy. The exit is to reintroduce `expo-sqlite`
  *behind the same store*, leaving UI and domain untouched — which is why the
  layers are separated from day one.
