/**
 * Pure lookups over the completions list. See types/completion.ts for why
 * completion is tracked as a `(blockId, day)` pair instead of a field on Block.
 */
import type { DayString } from "@/lib/date";
import type { Completion } from "@/types/completion";

export function isCompleted(
  completions: readonly Completion[],
  blockId: string,
  day: DayString,
): boolean {
  return completions.some((c) => c.blockId === blockId && c.day === day);
}
