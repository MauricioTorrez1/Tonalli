/**
 * Typed access to the brand palette, plus the preset block colors.
 *
 * The palette itself lives in palette.js (CommonJS) so Tailwind can read it too.
 * This module adds the TypeScript layer.
 *
 * Block colors are free-form hex, not a closed token union — see
 * docs/adr/0012-free-form-block-colors.md. The presets below are the quick
 * choices offered in the picker, not the only legal values, so nothing here is
 * a type constraint.
 */
import { colors as palette } from "./palette";

export { palette };

/** `#RRGGBB`, the only shape a block color is ever stored in. */
export const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

/** Fallback for a block with neither its own color nor a category. */
export const NEUTRAL_BLOCK_COLOR = "#8C8478";

export interface ColorPreset {
  /** Stable id, used as a React key and in accessibility labels. */
  name: string;
  hex: string;
}

/**
 * The one-tap color choices, ordered as they appear in the picker's grid. The
 * first six are the hues the app shipped with as fixed tokens, so a block
 * created before free-form color still matches a preset exactly.
 */
export const BLOCK_COLOR_PRESETS: readonly ColorPreset[] = [
  { name: "azul", hex: "#5B8DEF" },
  { name: "verde", hex: "#4FB286" },
  { name: "ámbar", hex: "#E5A64B" },
  { name: "violeta", hex: "#A78BFA" },
  { name: "rosa", hex: "#E8739A" },
  { name: "piedra", hex: "#8C8478" },
  { name: "coral", hex: "#FF8A80" },
  { name: "menta", hex: "#5FE3A1" },
  { name: "naranja", hex: "#FF8C42" },
  { name: "oliva", hex: "#8BC34A" },
  { name: "rojo", hex: "#E5533D" },
  { name: "índigo", hex: "#4B7BEC" },
  { name: "fucsia", hex: "#FF4FA3" },
  { name: "hueso", hex: "#E8E4DC" },
];

/**
 * The retired v2 color tokens and the hex each becomes. Used only by the store
 * migration; nothing in the running app should reach for it.
 *
 * These map to the tokens' *soft* shade rather than their solid one. Solid was
 * tuned to sit behind white text on a warm near-black page; on the true-black
 * page of ADR 0011 those darker fills read as muddy, and the runtime resolver
 * now derives its own contrast-safe text color anyway.
 */
export const LEGACY_TOKEN_TO_HEX: Record<string, string> = {
  sky: "#5B8DEF",
  mint: "#4FB286",
  amber: "#E5A64B",
  violet: "#A78BFA",
  rose: "#E8739A",
  stone: "#8C8478",
};

/** Runtime guard: is this string a storable block color? */
export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR_PATTERN.test(value);
}
