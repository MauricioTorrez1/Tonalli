/**
 * Pure computation of what local notifications a block needs — no calls to
 * `expo-notifications` here, so this is fully unit-testable. The thin,
 * untested I/O layer that turns these into real scheduled notifications lives
 * in schedule.ts, following the same split as store/storage.ts.
 */
import { dateFromDayMinute } from "@/lib/date";
import type { Block } from "@/types/block";
import type { Recurrence } from "@/types/recurrence";

export type NotificationTrigger =
  | { kind: "date"; date: Date }
  | { kind: "daily"; hour: number; minute: number }
  | { kind: "weekly"; expoWeekday: number; hour: number; minute: number };

/**
 * Convert an ISO weekday (1 = Monday ... 7 = Sunday) to Expo's calendar
 * weekday convention (1 = Sunday ... 7 = Saturday, matching `Date.getDay()`
 * shifted by one). The domain model uses ISO everywhere else; this is the one
 * place it has to speak Expo's dialect.
 */
export function isoWeekdayToExpoWeekday(isoDay: number): number {
  return isoDay === 7 ? 1 : isoDay + 1;
}

/**
 * Build the trigger(s) a block's local notification needs.
 *
 * - No recurrence: a single one-shot trigger, but only if it is still in the
 *   future relative to `now` — we never schedule a reminder for the past.
 * - `daily`: one repeating daily trigger.
 * - `weekdays`: one repeating weekly trigger per ISO weekday 1–5.
 * - `weekly`: one repeating weekly trigger per day in `byWeekday`.
 *
 * Known limitation: Expo's repeating triggers have no built-in end date, so a
 * recurrence's `endsOn` is not enforced for already-scheduled notifications.
 * Deferred — see docs/adr/0005-recurrence-virtual-expansion.md.
 */
export function buildTriggersForBlock(
  block: Block,
  recurrence: Recurrence | undefined,
  now: Date,
): NotificationTrigger[] {
  const hour = Math.floor(block.startMinute / 60);
  const minute = block.startMinute % 60;

  if (!recurrence) {
    const date = dateFromDayMinute(block.day, block.startMinute);
    return date > now ? [{ kind: "date", date }] : [];
  }

  switch (recurrence.freq) {
    case "daily":
      return [{ kind: "daily", hour, minute }];
    case "weekdays":
      return [1, 2, 3, 4, 5].map((isoDay) => ({
        kind: "weekly" as const,
        expoWeekday: isoWeekdayToExpoWeekday(isoDay),
        hour,
        minute,
      }));
    case "weekly":
      return (recurrence.byWeekday ?? []).map((isoDay) => ({
        kind: "weekly" as const,
        expoWeekday: isoWeekdayToExpoWeekday(isoDay),
        hour,
        minute,
      }));
  }
}
