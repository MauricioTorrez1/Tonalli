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
