/**
 * Virtual expansion of recurring blocks. A recurring block is stored once (as
 * a "template" — a normal Block with `recurrenceId` set, anchored to its
 * `day`). These functions project that template onto whichever day is being
 * viewed, without ever writing a new row to storage. See
 * docs/adr/0005-recurrence-virtual-expansion.md.
 */
import type { DayString } from "@/lib/date";
import { isoWeekday, isWeekday } from "@/lib/date";
import type { Block } from "@/types/block";
import type { Recurrence } from "@/types/recurrence";
import { sortByStart } from "./timeline-layout";

/** Whether a recurrence rule produces an occurrence on the given day. */
export function occursOn(recurrence: Recurrence, day: DayString): boolean {
  if (day < recurrence.startsOn) {
    return false;
  }
  if (recurrence.endsOn && day > recurrence.endsOn) {
    return false;
  }
  switch (recurrence.freq) {
    case "daily":
      return true;
    case "weekdays":
      return isWeekday(day);
    case "weekly":
      return recurrence.byWeekday?.includes(isoWeekday(day)) ?? false;
  }
}

/**
 * All blocks that appear on `day`: non-recurring blocks scheduled that day,
 * plus one projected occurrence per recurring template whose rule matches.
 *
 * A projected occurrence keeps the template's `id` (occurrences are matched to
 * completions by `(blockId, day)`, not by a unique per-occurrence id) with its
 * `day` swapped to the viewed day. Callers that need a unique React key should
 * use `${block.id}-${block.day}`.
 */
export function blocksForDay(
  blocks: readonly Block[],
  recurrences: readonly Recurrence[],
  day: DayString,
): Block[] {
  const direct = blocks.filter(
    (block) => !block.recurrenceId && block.day === day,
  );

  const projected = blocks
    .filter((block): block is Block & { recurrenceId: string } =>
      Boolean(block.recurrenceId),
    )
    .flatMap((template) => {
      if (template.day === day) {
        return [template];
      }
      const rule = recurrences.find((r) => r.id === template.recurrenceId);
      if (!rule || !occursOn(rule, day)) {
        return [];
      }
      return [{ ...template, day }];
    });

  return sortByStart([...direct, ...projected]);
}
