# 11. Adopt the reference app's visual language

- **Status:** Accepted
- **Date:** 2026-07-25
- **Amends:** [ADR 4](0004-focus-first-design-for-attention.md), [ADR 6](0006-vivid-category-colors-on-warm-black.md)

## Context

TonalliBlock has borrowed from Structured since Phase 1 — [ADR 6](0006-vivid-category-colors-on-warm-black.md)
calls its palette "Structured-app inspired" — but only at the level of ideas.
The surfaces stayed the app's own: warm near-black rather than true black, a
serif display face, emoji icons, a single screen with a floating add button.

The owner reviewed eight screenshots of the reference app and asked for near
parity, not inspiration: same navigation shape, same colored detail header,
same grouped rows, same icon treatment. That is a bigger ask than a repaint,
because several of those choices contradict decisions already written down.

There is a real cost to acknowledge. This is a portfolio project, and a close
copy of a commercial app demonstrates less judgement than a design with its own
point of view. The owner was told this and chose parity anyway; that is their
call to make, and this ADR records it rather than quietly splitting the
difference.

## Decision

**Adopt the reference app's visual language, keeping the app's own type and its
focus-first behavior.**

### What changes

1. **True black surfaces.** `night` goes from `#121110` to `#000000`, with
   `#1C1C1E` and `#2C2C2E` above it; light mode becomes white over `#F2F2F7`.
   The warm near-black of ADR 6 was chosen to be softer on the eyes, and it
   was — but it also greyed out the vivid block colors it existed to showcase,
   and on OLED it renders a surround that is nearly-but-not-quite off.

2. **One accent, `#5FE3A1`.** Every selected control — chips, segmented
   controls, week strip, tab bar, add button — wears the same mint. Previously
   selection borrowed `category-sky-solid`, which meant the UI's "this is
   chosen" color was also a color a block could be, so a blue block sitting
   next to a selected chip read as related when it was not.

   Text on the accent is near-black (`#04301D`), not white: the accent is
   light enough that white on it fails contrast.

3. **Monochrome glyphs instead of emoji.** `Block.icon` stores a
   MaterialCommunityIcons name. Emoji are multi-color bitmaps the app cannot
   tint, so an icon could never take its block's color, and every platform
   draws them differently — the same block was a different picture on Android,
   iOS and the PWA. The set grows to ~80 with search keywords, since a set too
   large to scan needs a search field, which emoji never had.

4. **A floating tab bar with three tabs and a separate add button.** Stats and
   settings stop being modals. The reference has four tabs (Inbox / Timeline /
   AI / Settings); this app has no inbox and no AI, and shipping empty tabs to
   match a screenshot would be the worst kind of copying, so it ships
   Agenda / Progreso / Ajustes.

5. **A colored header on the block form.** The block's own color floods a band
   holding its icon, time and title. Text and glyph colors within it are
   *derived* from the fill via `readableTextOn`, not assumed to be white — see
   [ADR 12](0012-free-form-block-colors.md), which makes the fill arbitrary.

6. **Timeline rows instead of outlined cards.** A resting block is a row with
   a hairline separator; only the current block is a filled card. A day of
   outlined cards is a day of boxes, and the outline was carrying the block's
   color at a size where the color barely registered anyway.

### What does not change

- **Lora and Raleway stay.** The reference uses the system face. Type is the
  one part of this that is unambiguously the app's own, it costs nothing to
  keep, and it is what stops the result from being a pixel copy.
- **Focus-first behavior stays**, including the rule from ADR 6 that only the
  current block is rendered solid, and the whole of
  [ADR 10](0010-animation-allowlist.md).
- **Reserved role colors stay**: `terracotta` remains the now-indicator's and
  nothing else's.

## Consequences

- ADR 6's "warm-black backgrounds" and its six fixed `category.*` tokens are
  superseded. Its core rule — color means something, intensity is reserved for
  "now" — survives intact.
- ADR 4's reduced-choice principle takes a deliberate hit in two places: the
  icon set roughly doubles, and colors become unbounded (ADR 12). Both are
  mitigated by search and by presets-first ordering, but the honest summary is
  that this trades some of ADR 4's simplicity for expressiveness.
- The store gains a v2→v3 migration to translate emoji into glyph names.
- `app.json`'s splash and notification colors follow the new palette; the PWA
  service-worker cache name must be bumped or returning users get the old
  bundle.
- Every screen's bottom padding now has to clear a floating bar rather than
  ending at the safe-area inset. `features/navigation/tab-bar-metrics.ts`
  exists so screens can reserve that space without importing the bar itself.
