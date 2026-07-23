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

**Phase 3 — distribution.** Everything from Phase 2 (CRUD, categories,
recurrence, notifications, theme, week navigation, reschedule shortcut, stats,
backup/restore), plus an installable, offline-capable PWA, live at
**https://tonalliblock.maurixio-torrez.workers.dev**. Native-only APIs
(scheduled notifications, the file system) are guarded to behave sanely on
web instead of throwing — see
[ADR 9](docs/adr/0009-pwa-on-cloudflare-pages.md).

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
| Backup | expo-file-system, expo-sharing, expo-document-picker | Export/import a JSON backup, no server |
| Web/PWA | Expo web static export + a hand-written service worker | Installable, works offline after first visit |
| Hosting | Cloudflare Pages | Large edge network, unlimited free bandwidth |
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
cp .env.example .env   # optional: set EXPO_PUBLIC_DONATION_URL to show the support link
npm start               # scan the QR code with Expo Go
```

Quality gates:

```bash
npm run lint
npm run typecheck
npm test
```

## Deploy the web build

Live at **https://tonalliblock.maurixio-torrez.workers.dev**.

```bash
npm run build:web    # expo export --platform web, then fixes up dist/404.html
npm run deploy:web   # the above, then `wrangler deploy`
```

Deployed on Cloudflare's Workers static-assets platform (the modern
successor to Cloudflare Pages — `wrangler pages deploy` now auto-delegates
there and fails without an `assets` block, so `wrangler.jsonc` uses
`assets.directory` + `not_found_handling: "404-page"`, not the older
`pages_build_output_dir`). `deploy:web` needs `wrangler login` once (not
committed — it's a local credential). Change `name` in `wrangler.jsonc` to
deploy under a different project. Alternatively, connect the repo in the
Cloudflare dashboard (Workers & Pages → Create → Connect to Git) with build
command `npm run build:web` and output directory `dist` for auto-deploy on
push — no local `wrangler` needed either way.

Regenerate the placeholder app icon (a geometric "T" monogram — real artwork
is still owed, see [ADR 9](docs/adr/0009-pwa-on-cloudflare-pages.md)) with:

```bash
npm run generate-icons
```

## Roadmap

### Deferred, not forgotten

- **A side-by-side week grid.** Phase 2 shipped day *navigation* (a week strip
  to jump between days) rather than a week-at-a-glance grid — it's what was
  actually needed to verify recurrence, and simpler. A real grid view is a
  natural future addition once/if it's wanted.
- **Free-form drag to reschedule.** Replaced with a long-press quick-shift
  shortcut — see [ADR 7](docs/adr/0007-reschedule-shortcut-not-drag.md) for why.
- **A real app icon.** The current one is a generated placeholder monogram —
  see [ADR 9](docs/adr/0009-pwa-on-cloudflare-pages.md).
- **Native builds (EAS Build → TestFlight/Play Store).** The PWA path was
  built first; a native store build is a separate future track and needs an
  Apple Developer account for TestFlight.

## License

[MIT](LICENSE)
