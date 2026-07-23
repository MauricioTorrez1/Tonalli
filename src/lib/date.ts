/**
 * Wall-clock date and time helpers. All functions are pure and side-effect free
 * except the two that read the device clock, which are isolated here so the rest
 * of the domain can stay deterministic and testable.
 */

/** A calendar day in `YYYY-MM-DD` form. Aliased for intent, not enforcement. */
export type DayString = string;

/** Format the current local calendar day as `YYYY-MM-DD`. */
export function todayString(now: Date = new Date()): DayString {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Current wall-clock time as minutes since midnight (0–1439). */
export function nowMinute(now: Date = new Date()): number {
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Format a minute-of-day as a 24h `HH:mm` label, e.g. 545 -> "09:05".
 * 24h avoids the AM/PM ambiguity and matches Mexican convention.
 */
export function formatMinute(minute: number): string {
  const hours = Math.floor(minute / 60);
  const minutes = minute % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Human-friendly spoken time for accessibility labels, e.g. 540 -> "9:00".
 * Drops the leading zero so screen readers say "nine" not "oh-nine".
 */
export function speakMinute(minute: number): string {
  const hours = Math.floor(minute / 60);
  const minutes = minute % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

/**
 * ISO weekday for a `YYYY-MM-DD` day string: 1 = Monday ... 7 = Sunday. Used
 * throughout the domain (recurrence rules) since it matches the Mexican/
 * international week start. JS `Date.getDay()` (0 = Sunday) is only used at
 * the notification-scheduling boundary, where Expo's API expects it — see
 * features/notifications/triggers.ts.
 */
export function isoWeekday(day: DayString): number {
  const jsDay = new Date(`${day}T00:00:00`).getDay();
  return jsDay === 0 ? 7 : jsDay;
}

/** Monday through Friday. */
export function isWeekday(day: DayString): boolean {
  const weekday = isoWeekday(day);
  return weekday >= 1 && weekday <= 5;
}

/** Add `count` days to a `YYYY-MM-DD` string, returning a new day string. */
export function addDays(day: DayString, count: number): DayString {
  const date = new Date(`${day}T00:00:00`);
  date.setDate(date.getDate() + count);
  return todayString(date);
}

/**
 * Combine a wall-clock day and minute into a concrete local `Date`. The
 * `T...` form (no `Z`/offset suffix) makes JS parse it in the device's local
 * timezone, matching the wall-clock model everywhere else in the domain.
 */
export function dateFromDayMinute(day: DayString, minute: number): Date {
  const hours = String(Math.floor(minute / 60)).padStart(2, "0");
  const minutes = String(minute % 60).padStart(2, "0");
  return new Date(`${day}T${hours}:${minutes}:00`);
}

/** Monday-first initials, indexed by ISO weekday - 1. */
export const WEEKDAY_SHORT_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

/** Monday-first full names, indexed by ISO weekday - 1. */
export const WEEKDAY_FULL_NAMES = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

/** The Monday (ISO weekday 1) of the week containing `day`. */
export function startOfWeek(day: DayString): DayString {
  return addDays(day, -(isoWeekday(day) - 1));
}

/** The seven days (Monday–Sunday) of the week containing `day`. */
export function weekDays(day: DayString): DayString[] {
  const start = startOfWeek(day);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/**
 * A heading for the day screen: "Hoy" for today, otherwise the weekday name
 * and day-of-month, e.g. "Miércoles 22".
 */
export function dayHeading(day: DayString, today: DayString): string {
  if (day === today) {
    return "Hoy";
  }
  const weekdayName = WEEKDAY_FULL_NAMES[isoWeekday(day) - 1];
  const dayOfMonth = Number(day.slice(8, 10));
  return `${weekdayName} ${dayOfMonth}`;
}

/** A minute count as "Xh Ym", e.g. 140 -> "2 h 20 min", 45 -> "45 min". */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) {
    return `${mins} min`;
  }
  if (mins === 0) {
    return `${hours} h`;
  }
  return `${hours} h ${mins} min`;
}
