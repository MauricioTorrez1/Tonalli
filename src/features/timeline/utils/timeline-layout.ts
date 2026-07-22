/**
 * Pure layout logic for the day timeline. No React, no I/O, no clock reads — the
 * caller passes `nowMinute` in. That makes every function here trivial to test
 * and is where most of the domain's TypeScript lives.
 */
import type { DayString } from "@/lib/date";
import type { Category } from "@/types/category";
import type { ColorToken } from "@/theme/colors";
import type { Block } from "@/types/block";

/**
 * Lifecycle state of a block relative to the current moment. A literal union
 * (not an enum) so it stays plain data, easy to switch on with exhaustive
 * `never` checks.
 */
export type BlockStatus = "completed" | "current" | "past" | "upcoming";

/**
 * Return a new array sorted by start time, then by end time as a tie-breaker.
 * The input is `readonly`, so callers know their array is never mutated.
 */
export function sortByStart(blocks: readonly Block[]): Block[] {
  return [...blocks].sort(
    (a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute,
  );
}

/**
 * Classify a block relative to the current moment. `isDone` is looked up by
 * the caller from the completions list (see types/completion.ts) — completion
 * is not a field on `Block`, so it can vary per occurrence of a recurring
 * block.
 *
 * `today` makes this day-aware: a block can only be "current" on the actual
 * current day. A block on a day strictly before today is always "past"
 * (history, whether or not it was done); one strictly after is always
 * "upcoming" — clock-time comparison only applies on today itself. Without
 * this, browsing to a future day whose blocks happen to share today's clock
 * time would wrongly render one of them as happening "now".
 */
export function getBlockStatus(
  block: Block,
  now: number,
  isDone: boolean,
  today: DayString,
): BlockStatus {
  if (isDone) {
    return "completed";
  }
  if (block.day < today) {
    return "past";
  }
  if (block.day > today) {
    return "upcoming";
  }
  if (now >= block.startMinute && now < block.endMinute) {
    return "current";
  }
  if (now >= block.endMinute) {
    return "past";
  }
  return "upcoming";
}

/**
 * The color a block should render with: its own override if set, otherwise
 * its category's color, otherwise the neutral fallback.
 */
export function resolveBlockColor(
  block: Pick<Block, "color">,
  category: Category | undefined,
): ColorToken {
  return block.color ?? category?.color ?? "stone";
}

/** The icon a block should render with: its own, otherwise its category's. */
export function resolveBlockIcon(
  block: Pick<Block, "icon">,
  category: Category | undefined,
): string | undefined {
  return block.icon ?? category?.icon;
}

/**
 * Index at which the "now" indicator should be inserted into a start-sorted
 * list: the number of blocks that have already started (start <= now). With
 * blocks at 09:00 / 11:00 / 13:00 and now = 10:00 this returns 1, placing the
 * line just below the 09:00 block.
 */
export function nowIndicatorIndex(
  sortedBlocks: readonly Block[],
  now: number,
): number {
  let index = 0;
  for (const block of sortedBlocks) {
    if (block.startMinute <= now) {
      index += 1;
    } else {
      break;
    }
  }
  return index;
}

/**
 * Whether any two blocks in the list overlap in time. Assumes same-day blocks;
 * used to warn the user before a double-booking. Runs in O(n log n) by sorting
 * first, then comparing each block only to its predecessor.
 */
export function hasOverlap(blocks: readonly Block[]): boolean {
  const sorted = sortByStart(blocks);
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i].startMinute < sorted[i - 1].endMinute) {
      return true;
    }
  }
  return false;
}
