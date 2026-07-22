/**
 * TonalliBlock brand palette — single source of truth for colors.
 * Plain CommonJS so both tailwind.config.js (Node) and app code (via colors.ts)
 * can consume it without duplication.
 *
 * Two color roles that must stay separate:
 * - `terracotta` is reserved for the "now" timeline marker only — a single,
 *   predictable landmark color the eye learns to find, never reused for a
 *   category.
 * - `category.*` are the vivid, distinguishable hues a block/category can be
 *   colored with (Structured-app inspired). Warm-black backgrounds make them
 *   pop without competing with each other, since only the *current* block is
 *   ever rendered solid — everything else stays a quiet outline. See
 *   docs/adr/0004-focus-first-design-for-attention.md and
 *   docs/adr/0006-vivid-category-colors-on-warm-black.md.
 */
const colors = {
  // Primary: soft sage green. Calm, warm, natural. Also usable as a category color.
  sage: {
    50: "#F3F6F3",
    100: "#E5ECE6",
    200: "#CDDACF",
    300: "#B0C3B4",
    400: "#96AF9B",
    500: "#7C9A82",
    600: "#637E68",
    700: "#4D6352",
    800: "#3A4A3E",
    900: "#2A362D",
  },
  // Reserved for the "now" indicator only — never a category color.
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
  // Backgrounds: warm off-white (light) and warm near-black (dark). Never pure
  // black/white — softer on the eyes, still reads as "dark mode".
  cream: "#FAF7F2",
  sand: "#F1ECE3",
  night: "#121110",
  nightSurface: "#1D1B19",
  nightRaised: "#28241F",
  // Text: warm grays, never pure black or pure white.
  ink: {
    DEFAULT: "#3D3A35",
    muted: "#6F6A61",
    soft: "#8A8478",
    inverse: "#F2EFE9",
    invmuted: "#B5AFA4",
    invsoft: "#8C8880",
  },
  // Vivid, curated category hues. Fixed set (not a free color picker) — fewer
  // decisions to make when creating a block. Each hue ships two shades: `solid`
  // (darker, used as a fill behind white text for the *current* block — passes
  // AA with white text) and `soft` (lighter, used for tints/dots/outlines on
  // every other state, where it sits behind normal ink-colored text instead).
  category: {
    sky: { solid: "#3E6FD1", soft: "#5B8DEF" }, // Enfoque / deep work
    mint: { solid: "#2F8F68", soft: "#4FB286" }, // Movimiento / health
    amber: { solid: "#B87A2A", soft: "#E5A64B" }, // Personal / energy
    violet: { solid: "#7C5CE0", soft: "#A78BFA" }, // Bienestar / rest, mindfulness
    rose: { solid: "#D14D79", soft: "#E8739A" }, // Social / connection
    stone: { solid: "#6B6459", soft: "#8C8478" }, // Neutral — uncategorized
  },
};

module.exports = { colors };
