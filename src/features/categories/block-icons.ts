/**
 * The icons a block can be given, as a fixed curated set.
 *
 * Deliberately not the full emoji keyboard. Picking an icon is a side quest
 * during the one task that matters — getting the block scheduled — and an open
 * search field turns it into a browsing session. Roughly forty options fit on
 * one screen, cover the kinds of block this app is for, and can be chosen at a
 * glance. See docs/adr/0004-focus-first-design-for-attention.md.
 *
 * Grouped only for ordering; the grid renders them flat.
 */
export const BLOCK_ICONS: readonly string[] = [
  // Focus and work
  "🎯",
  "💻",
  "📚",
  "✍️",
  "📝",
  "📊",
  "💼",
  "📞",
  "🧠",
  "🔬",
  // Movement and health
  "🏃",
  "🏋️",
  "🚴",
  "🧘",
  "⚽",
  "🏊",
  "🚶",
  "💊",
  "🩺",
  "😴",
  // Daily life
  "🌅",
  "🍳",
  "🍽️",
  "☕",
  "🛒",
  "🧹",
  "🚿",
  "🧺",
  "🐕",
  "🚗",
  // People and rest
  "💬",
  "❤️",
  "👨‍👩‍👧",
  "🎉",
  "🎵",
  "🎮",
  "📺",
  "🎨",
  "🌱",
  "✈️",
];
