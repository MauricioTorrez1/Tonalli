/**
 * One reminder attached to a block.
 *
 * Modelled as an anchor plus a signed offset rather than as an enum of named
 * presets ("five minutes before", "at start"). The named presets are a UI
 * concern — this shape expresses all of them, including ones the picker does
 * not offer yet, without the schema having to grow a case each time:
 *
 * - at start          → `{ anchor: "start", offsetMinutes: 0 }`
 * - 5 minutes before  → `{ anchor: "start", offsetMinutes: -5 }`
 * - when it ends      → `{ anchor: "end", offsetMinutes: 0 }`
 */
import { z } from "zod";

// Spelled out rather than imported from ./block: block.ts imports this module
// for `blockAlertSchema`, and reaching back for `MINUTES_IN_DAY` would close
// the cycle. One local constant is cheaper than untangling that at runtime.
const MINUTES_IN_DAY = 24 * 60;

export const ALERT_ANCHORS = ["start", "end"] as const;

export type AlertAnchor = (typeof ALERT_ANCHORS)[number];

export const blockAlertSchema = z.object({
  id: z.string().min(1),
  anchor: z.enum(ALERT_ANCHORS),
  /**
   * Minutes relative to the anchor. Negative fires before it, positive after.
   * Bounded to one day either way: a reminder further out than that is not a
   * reminder about this block, and it keeps the day-shift arithmetic in
   * `features/notifications/triggers.ts` to a single day in either direction.
   */
  offsetMinutes: z.number().int().min(-MINUTES_IN_DAY).max(MINUTES_IN_DAY),
});

export type BlockAlert = z.infer<typeof blockAlertSchema>;
