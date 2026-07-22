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
 * Accent tokens a user can assign to a time block. Declared `as const` so the
 * union type is inferred from the values instead of widening to `string`.
 */
export const BLOCK_COLOR_TOKENS = ["sage", "terracotta", "sand"] as const;

/** e.g. 'sage' | 'terracotta' | 'sand' — one literal per allowed token. */
export type ColorToken = (typeof BLOCK_COLOR_TOKENS)[number];

/** Runtime type guard: narrows an unknown string to a valid `ColorToken`. */
export function isColorToken(value: string): value is ColorToken {
  return (BLOCK_COLOR_TOKENS as readonly string[]).includes(value);
}
