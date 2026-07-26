# 6. Vivid category colors on warm-black, current-block-only solid fill

- **Status:** Accepted, partially superseded by [ADR 11](0011-structured-visual-language.md) and [ADR 12](0012-free-form-block-colors.md)
- **Date:** 2026-07-22

> **Clarification (2026-07-24):** the timeline node's rail pill carries its
> category color at all times, using the opaque *soft* shade. The *solid*
> shade stays reserved for the current block, so §3 below holds: the pill is a
> category landmark, the solid fill is still what marks "now". See
> [ADR 10](0010-animation-allowlist.md).

> **Amendment (2026-07-25):** two of this ADR's three pillars have been
> replaced. The warm-black surround is now true black
> ([ADR 11](0011-structured-visual-language.md)), and the fixed set of six
> hues is now free-form hex resolved at runtime
> ([ADR 12](0012-free-form-block-colors.md)) — `category-styles.ts`, described
> below, no longer exists. What still holds, and is the part worth keeping, is
> §3: only the *current* block is rendered in a solid fill, and `terracotta`
> remains reserved for the now-indicator.

## Context

Phase 0 shipped a single warm, muted palette (sand / terracotta / sage) and didn't actually use a block's `color` field for anything visible — every node's dot color came from its status, not its category. The user asked for a visual direction closer to Structured — dark background, more color — while keeping the ADHD-oriented focus-first goal from [ADR 4](0004-focus-first-design-for-attention.md) intact. Those two asks are in tension: more color risks more visual noise, which is exactly what focus-first design tries to avoid.

## Decision

**Reconcile "more color" with "one clear focus" by making color mean something, and reserving intensity for "now".**

1. **Vivid, curated category colors** (`sky`, `mint`, `amber`, `violet`, `rose`, `stone`): a fixed set of six hues, not a free color picker — fewer decisions when creating a block, consistent with the reduced-choice principle already in ADR 4. Each ships two shades: `solid` (darker, passes AA with white text) and `soft` (lighter, used for tints/dots on every other state).
2. **`terracotta` is retired as a category color and reserved for the "now" indicator only** — a single, predictable landmark color the eye learns to find, never reused for anything else. This removes the ambiguity Phase 0 had (terracotta meaning both "current" and, incidentally, nothing in particular for category).
3. **Only the current block renders as a solid fill** of its category color; every other state (upcoming, past, completed) is a quiet, translucent outline of that same color. One glance answers two questions at once — *what kind of block is this* and *is it happening now* — without every block on the screen shouting for attention simultaneously.
4. **Warm near-black backgrounds** (`night` #121110, `nightSurface` #1D1B19, `nightRaised` #28241F) rather than pure `#000000` — softer on the eyes, on-brand with the "never pure black/white" rule already in the Phase 0 palette, while still reading unambiguously as dark mode.
5. **Dark is the new default** for fresh installs (`theme-store.ts`), matching the Structured-inspired direction the user asked for; light mode is fully supported and one tap away in Settings, not removed.

## Consequences

- Retiring the old tokens is a breaking change to already-persisted data: a
  device that ran Phase 0 has real blocks stored with `color: "sage"` etc.
  `store/block-store.ts`'s `migrateV1ToV2` drops any color that no longer
  matches `isColorToken` (falling back to the neutral default) instead of
  letting `sanitize`'s schema check silently discard the whole block.
- `theme/category-styles.ts` enumerates every token's Tailwind classes literally (no `` `bg-category-${token}` `` template strings) — NativeWind requires static, source-literal class names to extract styles; dynamic construction would silently fail.
- Icons (`@expo/vector-icons`) take a raw hex `color` prop, which `className` can't reach — `theme/useThemeColors.ts` resolves the handful of tokens icons need against the live color scheme.
- Contrast: solid fills use the darker `-solid` shade specifically so white text stays AA-compliant; the lighter `-soft` shade only ever sits behind normal ink-colored text, never colored text on colored background.
