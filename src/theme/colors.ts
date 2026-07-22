/**
 * Typed access to the brand palette and the set of color tokens a block may use.
 *
 * The palette itself lives in palette.js (CommonJS) so Tailwind can read it too.
 * This module adds the TypeScript layer: a literal-union `ColorToken` derived
 * from a single source array, so the type and the runtime list never drift.
 */
import { colors as palette } from "./palette";

export { palette };

/**
 * Vivid hues a category (and, per block, an override) can use. Deliberately a
 * fixed, small set rather than a free color picker — fewer decisions when
 * creating a block. `stone` is the neutral fallback for uncategorized blocks,
 * not really a "category color". `terracotta` is intentionally excluded: it
 * is reserved for the now-indicator only, see palette.js.
 */
export const BLOCK_COLOR_TOKENS = [
  "sky",
  "mint",
  "amber",
  "violet",
  "rose",
  "stone",
] as const;

/** e.g. 'sky' | 'mint' | ... — one literal per allowed token. */
export type ColorToken = (typeof BLOCK_COLOR_TOKENS)[number];

/** Runtime type guard: narrows an unknown string to a valid `ColorToken`. */
export function isColorToken(value: string): value is ColorToken {
  return (BLOCK_COLOR_TOKENS as readonly string[]).includes(value);
}
