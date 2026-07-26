# 12. Free-form block colors as hex, resolved at runtime

- **Status:** Accepted
- **Date:** 2026-07-25
- **Amends:** [ADR 6](0006-vivid-category-colors-on-warm-black.md)

## Context

[ADR 6](0006-vivid-category-colors-on-warm-black.md) fixed block colors to six
tokens, deliberately: "a fixed set of six hues, not a free color picker — fewer
decisions when creating a block". Two things eroded that.

**The user asked for a color wheel.** Colors are the only thing making a day
scannable, and six of them means two blocks that matter differently to their
owner cannot look different. The constraint that was saving a decision was also
preventing one.

**The implementation had a structural tax.** NativeWind extracts class names
statically, so a class built from a variable is silently dropped. Every
combination of token and treatment therefore had to appear literally in source,
which is what `theme/category-styles.ts` was: a hand-written 6 × 5 table of
Tailwind strings. Adding a seventh color meant five more lines of string
literals. Adding a *treatment* meant six. The table was not incidental
complexity around the constraint — it was the constraint, made expensive.

## Decision

**Store block colors as free-form `#RRGGBB` and derive every treatment at
runtime.**

1. **Schema.** `Block.color` and `Category.color` go from `z.enum(TOKENS)` to a
   `#RRGGBB` pattern. The six tokens become the first six entries of
   `BLOCK_COLOR_PRESETS`, which is a UI convenience with no type authority.

2. **`theme/block-color.ts` replaces `theme/category-styles.ts`.** Pure
   functions — no React, no theme lookup, `isDark` passed in — turning one hex
   into the set of colors a block needs: `solid`, `onSolid`, `soft`, `border`,
   `pill`, `onPill`, `text`. Block colors are applied through inline `style`;
   they can no longer be expressed as classes at all.

3. **Contrast is computed, not assumed.** The old palette could hardcode
   `text-white` because all six tokens were hand-picked dark solids. A picker
   produces pale yellow. `readableTextOn` chooses black or white by WCAG
   contrast ratio, and `ensureContrast` nudges a color toward or away from the
   page until it clears 3:1 — needed for a navy block used as a label on a
   black page, which is legible as a fill and invisible as text.

4. **The rail pill stays opaque.** It is painted over the spine, so it blends
   toward the page color rather than using alpha. This was already true of the
   old `pillBg` and is preserved as `blend(hex, page, 0.72)`.

5. **Store version 3**, mapping each retired token to its hex. Tokens map to
   their old *soft* shade, not `solid`: the darker solids were tuned to sit
   behind white text on a warm near-black page, and on the true black of
   [ADR 11](0011-structured-visual-language.md) they read as muddy.

### A bug this surfaced

`sanitize()` filtered on `safeParse().success` and then kept the **raw** object,
so Zod's `.default()` values were computed and discarded. That was harmless
while every field was required; with `subtasks`, `alerts` and `soundEnabled`
added in the same version, every block written before them would have hydrated
with those fields undefined and every read site would have needed its own
fallback. It now keeps the parsed result.

## Consequences

- The six-color constraint of ADR 6 is gone. What survives is its *reason*:
  presets are still offered first and are still what most blocks will use.
- `category-styles.ts` is deleted. There is no longer any table to grow.
- Any component rendering a block color must use `style`, not `className`. A
  class will be dropped, and dropping it means an uncolored block.
- The color resolver is fully unit-testable, which the class table was not —
  `__tests__/block-color.test.ts` asserts the contrast guarantees directly.
- Restoring a backup made before v3 works: `sanitize` parses through the
  current schema, and pre-v3 token values simply fail validation and are
  dropped, leaving the block to fall back to its category color.
