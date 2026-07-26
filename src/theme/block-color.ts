/**
 * Runtime color derivation for blocks.
 *
 * This replaces the old `category-styles.ts`, which was a hand-written table of
 * literal Tailwind classes — one row per allowed color token. That table only
 * existed because NativeWind extracts class names statically, so a class built
 * from a variable is silently dropped; enumerating them was the workaround. It
 * also capped the app at six colors forever.
 *
 * Now that a block's color is arbitrary hex, classes cannot express it at all,
 * so every block color is applied through inline `style` and derived here. Pure
 * functions, no React, no theme lookup — the caller passes `isDark` in, which
 * keeps the whole module unit-testable.
 */
import { NEUTRAL_BLOCK_COLOR } from "./colors";

interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** WCAG AA for large text / UI components. */
const MIN_CONTRAST = 3;

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

/**
 * Parse `#RRGGBB` into channel values.
 *
 * @param hex - A six-digit hex color, with leading `#`.
 * @returns The red, green and blue channels, 0–255. Falls back to the neutral
 *   block color when the input is malformed, so a corrupt stored value renders
 *   gray instead of crashing the timeline.
 */
export function hexToRgb(hex: string): Rgb {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  const digits = match ? match[1] : NEUTRAL_BLOCK_COLOR.slice(1);
  const value = parseInt(digits, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

/** Format channel values back into `#RRGGBB`, uppercase. */
export function rgbToHex({ r, g, b }: Rgb): string {
  const hex = ((clampByte(r) << 16) | (clampByte(g) << 8) | clampByte(b))
    .toString(16)
    .padStart(6, "0");
  return `#${hex.toUpperCase()}`;
}

/**
 * The same color at partial opacity, as an `rgba()` string.
 *
 * Used for tints that must let the page show through. Anything painted *over*
 * another element — the rail pill sits on top of the spine — has to use
 * `blend` instead, or the line ghosts through it.
 *
 * @param hex - Base color.
 * @param alpha - Opacity, 0 to 1.
 */
export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Mix two colors, returning an opaque hex.
 *
 * @param hex - The color to keep.
 * @param towards - The color to move toward.
 * @param amount - How far to move, 0 (unchanged) to 1 (fully `towards`).
 */
export function blend(hex: string, towards: string, amount: number): string {
  const from = hexToRgb(hex);
  const to = hexToRgb(towards);
  const t = Math.max(0, Math.min(1, amount));
  return rgbToHex({
    r: from.r + (to.r - from.r) * t,
    g: from.g + (to.g - from.g) * t,
    b: from.b + (to.b - from.b) * t,
  });
}

/** Hue 0–360, saturation and lightness 0–1. */
export interface Hsl {
  h: number;
  s: number;
  l: number;
}

/**
 * Convert HSL to `#RRGGBB`.
 *
 * The color picker works in HSL rather than RGB because that is the space its
 * two sliders live in: one moves hue along the rainbow, the other moves
 * lightness from dark to pale. Doing the same with RGB sliders would mean
 * three controls and no intuition about any of them.
 *
 * @param hsl - Hue in degrees, saturation and lightness as fractions.
 */
export function hslToHex({ h, s, l }: Hsl): string {
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const hue = ((h % 360) + 360) % 360;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - chroma / 2;
  const sector = Math.floor(hue / 60) % 6;
  const [r, g, b] = (
    [
      [chroma, x, 0],
      [x, chroma, 0],
      [0, chroma, x],
      [0, x, chroma],
      [x, 0, chroma],
      [chroma, 0, x],
    ] as const
  )[sector];
  return rgbToHex({ r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 });
}

/**
 * Convert `#RRGGBB` to HSL, so an existing color can position the sliders.
 *
 * @param hex - The color to decompose.
 */
export function hexToHsl(hex: string): Hsl {
  const { r, g, b } = hexToRgb(hex);
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const l = (max + min) / 2;

  if (delta === 0) {
    return { h: 0, s: 0, l };
  }

  const s = delta / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === red) {
    h = 60 * (((green - blue) / delta) % 6);
  } else if (max === green) {
    h = 60 * ((blue - red) / delta + 2);
  } else {
    h = 60 * ((red - green) / delta + 4);
  }
  return { h: (h + 360) % 360, s, l };
}

function channelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/**
 * Relative luminance per WCAG 2.1, 0 (black) to 1 (white).
 *
 * @param hex - The color to measure.
 */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

/**
 * WCAG contrast ratio between two colors, 1 (identical) to 21 (black/white).
 *
 * @param a - First color.
 * @param b - Second color.
 */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

/**
 * Black or white, whichever is legible on the given fill.
 *
 * The old palette could hardcode `text-white` because every token was a dark,
 * hand-picked solid. A free color picker will happily produce pale yellow, and
 * white on pale yellow is unreadable — so the text color is now derived from
 * the fill instead of assumed.
 *
 * @param hex - The background the text sits on.
 */
export function readableTextOn(hex: string): string {
  return contrastRatio(hex, "#FFFFFF") >= contrastRatio(hex, "#000000")
    ? "#FFFFFF"
    : "#000000";
}

/**
 * Nudge a color toward white or away from it until it is legible on `against`.
 *
 * Needed for the block color used as *text* (the rail glyph, the accent on a
 * quiet card): a dark navy block is fine as a fill but invisible as a label on
 * a black page, and a pale one disappears on a white page.
 *
 * @param hex - The color to adjust.
 * @param against - The background it must be readable on.
 * @param minRatio - Contrast ratio to reach. Defaults to WCAG AA for UI, 3:1.
 * @returns The nearest adjusted color that clears the threshold, or the closest
 *   it could get after exhausting the range.
 */
export function ensureContrast(
  hex: string,
  against: string,
  minRatio: number = MIN_CONTRAST,
): string {
  if (contrastRatio(hex, against) >= minRatio) {
    return hex;
  }
  // Move away from the background: lighten on a dark page, darken on a light
  // one. Twenty steps of 5% covers the full range at a granularity no one can
  // see, and stopping at the first passing step keeps the hue recognisable.
  const target = relativeLuminance(against) < 0.5 ? "#FFFFFF" : "#000000";
  let candidate = hex;
  for (let step = 1; step <= 20; step += 1) {
    candidate = blend(hex, target, step * 0.05);
    if (contrastRatio(candidate, against) >= minRatio) {
      return candidate;
    }
  }
  return candidate;
}

/** Every color a block needs, already resolved for the current scheme. */
export interface BlockColorStyles {
  /** Full-strength fill. Only the block happening now wears this. */
  solid: string;
  /** Text and glyphs drawn on `solid`. */
  onSolid: string;
  /** Translucent tint for a resting card. */
  soft: string;
  /** Border for a card wearing `soft`. */
  border: string;
  /** Opaque rail-pill fill — opaque so the spine cannot ghost through it. */
  pill: string;
  /** The glyph on the rail pill, legible against `pill`. */
  onPill: string;
  /** The color used as text on the page background. */
  text: string;
}

/**
 * Derive the full set of styles for one block color.
 *
 * @param hex - The block's resolved color.
 * @param isDark - Whether the app is in dark mode.
 */
export function resolveBlockColorStyles(
  hex: string,
  isDark: boolean,
): BlockColorStyles {
  const page = isDark ? "#000000" : "#FFFFFF";
  // A muted, opaque version of the color: enough of the hue to identify the
  // block, dark (or light) enough that the icon on top stays readable.
  const pill = blend(hex, page, isDark ? 0.72 : 0.82);
  return {
    solid: hex,
    onSolid: readableTextOn(hex),
    soft: withAlpha(hex, isDark ? 0.22 : 0.12),
    border: withAlpha(hex, isDark ? 0.4 : 0.28),
    pill,
    onPill: ensureContrast(hex, pill),
    text: ensureContrast(hex, page),
  };
}
