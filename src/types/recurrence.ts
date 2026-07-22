/**
 * A recurrence rule attached to a "template" block. Phase 1 uses virtual
 * expansion: the rule is stored once, and `occursOn` (in
 * features/timeline/utils/recurrence.ts) projects it onto whatever day is
 * being viewed. There are no per-occurrence rows and, deliberately, no
 * per-occurrence overrides yet — editing or deleting a recurring block always
 * acts on the whole series. See docs/adr/0005-recurrence-virtual-expansion.md.
 */
import { z } from "zod";

export const RECURRENCE_FREQS = ["daily", "weekdays", "weekly"] as const;
export type RecurrenceFreq = (typeof RECURRENCE_FREQS)[number];

/** ISO weekday: 1 = Monday ... 7 = Sunday. */
const isoWeekdaySchema = z.number().int().min(1).max(7);

export const recurrenceSchema = z
  .object({
    id: z.uuid(),
    freq: z.enum(RECURRENCE_FREQS),
    /** Required, and only meaningful, when freq === "weekly". */
    byWeekday: z.array(isoWeekdaySchema).min(1).optional(),
    startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endsOn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    createdAt: z.number().int(),
    updatedAt: z.number().int(),
  })
  .refine(
    (rule) => rule.freq !== "weekly" || (rule.byWeekday?.length ?? 0) > 0,
    {
      message: "byWeekday is required when freq is 'weekly'",
      path: ["byWeekday"],
    },
  );

export type Recurrence = z.infer<typeof recurrenceSchema>;

export type NewRecurrence = Omit<Recurrence, "id" | "createdAt" | "updatedAt">;
