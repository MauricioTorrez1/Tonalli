/**
 * The Block domain model, defined once as a Zod schema and reused as a
 * TypeScript type via `z.infer`. This keeps runtime validation and the static
 * type in perfect sync — there is no separate `interface Block` to drift.
 */
import { z } from "zod";

import { BLOCK_COLOR_TOKENS } from "@/theme/colors";

/** Minutes since midnight, wall-clock. 0 = 00:00, 1439 = 23:59. */
export const MINUTES_IN_DAY = 24 * 60;

const colorTokenSchema = z.enum(BLOCK_COLOR_TOKENS);

const minuteSchema = z
  .number()
  .int()
  .min(0)
  .max(MINUTES_IN_DAY - 1);

/**
 * A single time block on a given day.
 *
 * Time is stored as wall-clock (a `day` string plus minute offsets), never as
 * an absolute UTC instant — a block at 09:00 means 9am wherever the user is.
 * Only the audit fields (`createdAt`, `updatedAt`) are absolute epoch millis.
 * See docs/adr/0002-wall-clock-time-model.md.
 */
export const blockSchema = z
  .object({
    id: z.uuid(),
    title: z.string().min(1),
    notes: z.string().optional(),
    icon: z.string().optional(),
    color: colorTokenSchema,
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "day must be YYYY-MM-DD"),
    startMinute: minuteSchema,
    endMinute: minuteSchema,
    completedAt: z.number().int().nullable(),
    createdAt: z.number().int(),
    updatedAt: z.number().int(),
  })
  .refine((block) => block.endMinute > block.startMinute, {
    message: "endMinute must be after startMinute",
    path: ["endMinute"],
  });

export type Block = z.infer<typeof blockSchema>;

/**
 * The shape needed to create a block. `id` and audit timestamps are assigned by
 * the store, so callers omit them — a small but idiomatic use of `Omit`.
 */
export type NewBlock = Omit<Block, "id" | "createdAt" | "updatedAt">;
