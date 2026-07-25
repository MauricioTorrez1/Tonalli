/**
 * Static, literal Tailwind class strings per `ColorToken`.
 *
 * NativeWind extracts class names statically, so building them with template
 * strings (e.g. `` `bg-category-${token}-solid` ``) would not reliably work —
 * every combination has to appear literally in source. This lookup table is
 * that literal enumeration, used by TimelineNode and the category/color
 * pickers instead of constructing class names at runtime.
 */
import type { ColorToken } from "./colors";

interface CategoryStyle {
  /** Solid fill + white text — used only for the current block. */
  solidBg: string;
  /** Translucent tint + soft border — used for every other block state. */
  softBg: string;
  softBorder: string;
  /** Small solid circle — category dot, used in chips and pickers. */
  dot: string;
  /**
   * Fill for the rail pill. Must be fully opaque: the spine is painted behind
   * the pill, and any alpha here lets the line ghost through it. That is why
   * this cannot reuse `softBg`, whose /10 and /20 shades are translucent by
   * design.
   */
  pillBg: string;
}

export const CATEGORY_STYLES: Record<ColorToken, CategoryStyle> = {
  sky: {
    solidBg: "bg-category-sky-solid",
    softBg: "bg-category-sky-soft/10 dark:bg-category-sky-soft/20",
    softBorder: "border-category-sky-soft/50 dark:border-category-sky-soft/60",
    dot: "bg-category-sky-solid",
    pillBg: "bg-category-sky-soft",
  },
  mint: {
    solidBg: "bg-category-mint-solid",
    softBg: "bg-category-mint-soft/10 dark:bg-category-mint-soft/20",
    softBorder:
      "border-category-mint-soft/50 dark:border-category-mint-soft/60",
    dot: "bg-category-mint-solid",
    pillBg: "bg-category-mint-soft",
  },
  amber: {
    solidBg: "bg-category-amber-solid",
    softBg: "bg-category-amber-soft/10 dark:bg-category-amber-soft/20",
    softBorder:
      "border-category-amber-soft/50 dark:border-category-amber-soft/60",
    dot: "bg-category-amber-solid",
    pillBg: "bg-category-amber-soft",
  },
  violet: {
    solidBg: "bg-category-violet-solid",
    softBg: "bg-category-violet-soft/10 dark:bg-category-violet-soft/20",
    softBorder:
      "border-category-violet-soft/50 dark:border-category-violet-soft/60",
    dot: "bg-category-violet-solid",
    pillBg: "bg-category-violet-soft",
  },
  rose: {
    solidBg: "bg-category-rose-solid",
    softBg: "bg-category-rose-soft/10 dark:bg-category-rose-soft/20",
    softBorder:
      "border-category-rose-soft/50 dark:border-category-rose-soft/60",
    dot: "bg-category-rose-solid",
    pillBg: "bg-category-rose-soft",
  },
  stone: {
    solidBg: "bg-category-stone-solid",
    softBg: "bg-category-stone-soft/10 dark:bg-category-stone-soft/20",
    softBorder:
      "border-category-stone-soft/50 dark:border-category-stone-soft/60",
    dot: "bg-category-stone-solid",
    pillBg: "bg-category-stone-soft",
  },
};
