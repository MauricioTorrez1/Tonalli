/**
 * Pure computation of what local notifications a block needs — no calls to
 * `expo-notifications` here, so this is fully unit-testable. The thin,
 * untested I/O layer that turns these into real scheduled notifications lives
 * in schedule.ts, following the same split as store/storage.ts.
 */
import { addDays, dateFromDayMinute, formatDuration } from "@/lib/date";
import type { BlockAlert } from "@/types/alert";
import { MINUTES_IN_DAY, type Block } from "@/types/block";
import type { Recurrence } from "@/types/recurrence";

export type NotificationTrigger =
  | { kind: "date"; date: Date; body: string }
  | { kind: "daily"; hour: number; minute: number; body: string }
  | {
      kind: "weekly";
      expoWeekday: number;
      hour: number;
      minute: number;
      body: string;
    };

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
 * Shift an ISO weekday by whole days, wrapping around the week.
 *
 * ISO weekdays are 1-based, so this drops to a 0-based index, wraps there
 * (the double modulo makes a negative shift wrap forward rather than staying
 * negative), and adds the 1 back.
 */
export function shiftIsoWeekday(isoDay: number, days: number): number {
  return ((((isoDay - 1 + days) % 7) + 7) % 7) + 1;
}

/**
 * When an alert fires, relative to the block's own day.
 *
 * An offset can push a reminder out of the block's day entirely — "30 minutes
 * before" a block at 00:10 lands at 23:40 the *previous* day. Rather than
 * clamping (which would silently fire the reminder at the wrong time) this
 * returns the overflow as `dayShift`, and each recurrence branch applies it in
 * whatever terms it works in: a calendar date, or a weekday.
 */
export function resolveAlertMoment(
  block: Pick<Block, "startMinute" | "endMinute">,
  alert: BlockAlert,
): { minuteOfDay: number; dayShift: number } {
  const anchorMinute =
    alert.anchor === "start" ? block.startMinute : block.endMinute;
  const raw = anchorMinute + alert.offsetMinutes;
  return {
    minuteOfDay: ((raw % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY,
    dayShift: Math.floor(raw / MINUTES_IN_DAY),
  };
}

/**
 * The line shown under the block's title in the notification.
 *
 * Every alert used to read "Es hora de tu bloque." Now that a block can carry
 * several, that text would make them indistinguishable on the lock screen —
 * the whole point of a heads-up at −15 and another at 0 is knowing which one
 * you are looking at.
 *
 * @param alert - The alert being described.
 */
export function describeAlert(alert: BlockAlert): string {
  const verb = alert.anchor === "start" ? "Empieza" : "Termina";
  if (alert.offsetMinutes === 0) {
    return `${verb} ahora.`;
  }
  const magnitude = formatDuration(Math.abs(alert.offsetMinutes));
  return alert.offsetMinutes < 0
    ? `${verb} en ${magnitude}.`
    : `${alert.anchor === "start" ? "Empezó" : "Terminó"} hace ${magnitude}.`;
}

/**
 * Build the trigger(s) a block's alerts need.
 *
 * One trigger per alert per occurrence pattern:
 * - No recurrence: a single one-shot trigger per alert, but only if it is
 *   still in the future relative to `now` — we never schedule a reminder for
 *   the past.
 * - `daily`: one repeating daily trigger per alert.
 * - `weekdays`: one repeating weekly trigger per alert per ISO weekday 1–5.
 * - `weekly`: one per alert per day in `byWeekday`.
 *
 * A block with no alerts gets nothing scheduled. That is a real behavior
 * change: reminders used to be implicit and unconditional, at the start of
 * every block. They are now something the user asked for.
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
  const triggers: NotificationTrigger[] = [];

  for (const alert of block.alerts) {
    const { minuteOfDay, dayShift } = resolveAlertMoment(block, alert);
    const hour = Math.floor(minuteOfDay / 60);
    const minute = minuteOfDay % 60;
    const body = describeAlert(alert);

    if (!recurrence) {
      const date = dateFromDayMinute(addDays(block.day, dayShift), minuteOfDay);
      if (date > now) {
        triggers.push({ kind: "date", date, body });
      }
      continue;
    }

    switch (recurrence.freq) {
      case "daily":
        // A daily series fires every day regardless, so an alert that spills
        // into the neighbouring day still lands on a day the block occurs —
        // the shift changes nothing here.
        triggers.push({ kind: "daily", hour, minute, body });
        break;
      case "weekdays":
        for (const isoDay of [1, 2, 3, 4, 5]) {
          triggers.push({
            kind: "weekly",
            expoWeekday: isoWeekdayToExpoWeekday(
              shiftIsoWeekday(isoDay, dayShift),
            ),
            hour,
            minute,
            body,
          });
        }
        break;
      case "weekly":
        for (const isoDay of recurrence.byWeekday ?? []) {
          triggers.push({
            kind: "weekly",
            expoWeekday: isoWeekdayToExpoWeekday(
              shiftIsoWeekday(isoDay, dayShift),
            ),
            hour,
            minute,
            body,
          });
        }
        break;
    }
  }

  return triggers;
}
