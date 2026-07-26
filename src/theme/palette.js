/**
 * TonalliBlock brand palette — single source of truth for colors.
 * Plain CommonJS so both tailwind.config.js (Node) and app code (via colors.ts)
 * can consume it without duplication.
 *
 * What lives here is only the *chrome*: surfaces, text, and the accent used by
 * selected controls. Block colors are no longer part of this file — they are
 * free-form hex chosen per block and resolved at runtime, see
 * docs/adr/0012-free-form-block-colors.md and src/theme/block-color.ts.
 *
 * `terracotta` is the one reserved role color: the "now" timeline marker, a
 * single predictable landmark the eye learns to find. Never used for anything
 * else.
 */
const colors = {
  // The accent every selected control wears: chips, segmented controls, the
  // add button, the icon tiles in list rows. One accent, used consistently, so
  // "this is chosen" is learnable at a glance.
  accent: {
    DEFAULT: "#5FE3A1",
    soft: "#8FEFC0",
    dim: "#2F7A56",
    // Text and glyphs drawn *on* the accent. Near-black rather than white:
    // the accent is a light mint, and white on it fails contrast badly.
    ink: "#04301D",
  },
  // Reserved for the "now" indicator only — never a block color.
  terracotta: {
    50: "#FCF1ED",
    100: "#F8DED5",
    200: "#F2BFAE",
    300: "#EA9D85",
    400: "#E58B70",
    500: "#E07A5F",
    600: "#C75F44",
    700: "#A54A32",
    800: "#823A27",
    900: "#602B1D",
  },
  // Destructive actions only: delete rows, validation errors.
  danger: {
    DEFAULT: "#FF453A",
    soft: "#FF6961",
  },
  // Backgrounds. Dark mode is true black so the vivid block colors carry the
  // whole screen and OLED panels render the surround as genuinely off — this
  // replaces the earlier warm near-black, see ADR 0011. Light mode mirrors the
  // same structure one step up: white page, grouped cards on a faint gray.
  cream: "#FFFFFF",
  sand: "#F2F2F7",
  night: "#000000",
  nightSurface: "#1C1C1E",
  nightRaised: "#2C2C2E",
  // Text, in the four weights the UI actually distinguishes: primary, a muted
  // secondary, a softer tertiary for labels, and the same ladder inverted for
  // dark surfaces.
  ink: {
    DEFAULT: "#1C1C1E",
    muted: "#8E8E93",
    soft: "#636366",
    inverse: "#FFFFFF",
    invmuted: "#8E8E93",
    invsoft: "#AEAEB2",
  },
};

module.exports = { colors };
