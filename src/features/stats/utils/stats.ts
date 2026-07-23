/**
 * Pure aggregation over completions — no React, no store access, so these
 * are trivial to test. The stats screen resolves category names/colors for
 * display; these functions only deal with ids and minutes.
 */
import type { DayString } from "@/lib/date";
import { addDays } from "@/lib/date";
import type { Block } from "@/types/block";
import type { Completion } from "@/types/completion";

/** Key used for a completed block that has no category assigned. */
export const UNCATEGORIZED = "none";

/**
 * Minutes spent per category, counting only completions on or after
 * `sinceDay`. A completion's minutes come from its block's *current*
 * start/end — for a recurring series, past occurrences are approximated
 * using today's duration, since occurrences aren't stored individually (see
 * docs/adr/0005-recurrence-virtual-expansion.md). Completions whose block no
 * longer exists are skipped rather than thrown on — deleting a block already
 * removes its completions (see store/block-store.ts), so this only guards
 * against already-malformed data.
 */
export function minutesByCategory(
  completions: readonly Completion[],
  blocks: readonly Block[],
  sinceDay: DayString,
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const completion of completions) {
    if (completion.day < sinceDay) {
      continue;
    }
    const block = blocks.find((b) => b.id === completion.blockId);
    if (!block) {
      continue;
    }
    const key = block.categoryId ?? UNCATEGORIZED;
    const minutes = block.endMinute - block.startMinute;
    totals[key] = (totals[key] ?? 0) + minutes;
  }
  return totals;
}

/**
 * The number of consecutive days, ending today, with at least one
 * completion. If today has none yet, the streak still counts as unbroken as
 * long as yesterday had one — the day isn't over, so we don't zero it out
 * the moment the user wakes up.
 */
export function currentStreak(
  completions: readonly Completion[],
  today: DayString,
): number {
  const daysWithCompletion = new Set(completions.map((c) => c.day));
  let cursor = daysWithCompletion.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (daysWithCompletion.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
