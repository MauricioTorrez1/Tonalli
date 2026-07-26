/**
 * The Block domain model, defined once as a Zod schema and reused as a
 * TypeScript type via `z.infer`. This keeps runtime validation and the static
 * type in perfect sync — there is no separate `interface Block` to drift.
 */
import { z } from "zod";

import { HEX_COLOR_PATTERN } from "@/theme/colors";
import { blockAlertSchema } from "./alert";
import { subtaskSchema } from "./subtask";

/** Minutes since midnight, wall-clock. 0 = 00:00, 1439 = 23:59. */
export const MINUTES_IN_DAY = 24 * 60;

const minuteSchema = z
  .number()
  .int()
  .min(0)
  .max(MINUTES_IN_DAY - 1);

/**
 * A single time block, or the template for a recurring series.
 *
 * Time is stored as wall-clock (a `day` string plus minute offsets), never as
 * an absolute UTC instant — a block at 09:00 means 9am wherever the user is.
 * Only the audit fields (`createdAt`, `updatedAt`) are absolute epoch millis.
 * See docs/adr/0002-wall-clock-time-model.md.
 *
 * `color` is optional and, when omitted, falls back to the block's category
 * color (see resolveBlockColor). Completion is tracked separately as a
 * `Completion` record, not as a field here — see types/completion.ts.
 */
export const blockSchema = z
  .object({
    id: z.uuid(),
    title: z.string().min(1),
    notes: z.string().optional(),
    /** Name of a MaterialCommunityIcons glyph, e.g. "pill". */
    icon: z.string().optional(),
    /** Free-form `#RRGGBB` — see docs/adr/0012-free-form-block-colors.md. */
    color: z
      .string()
      .regex(HEX_COLOR_PATTERN, "color must be #RRGGBB")
      .optional(),
    categoryId: z.string().optional(),
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "day must be YYYY-MM-DD"),
    startMinute: minuteSchema,
    endMinute: minuteSchema,
    /** Set only when this block is the template of a recurring series. */
    recurrenceId: z.string().optional(),
    subtasks: z.array(subtaskSchema).default([]),
    alerts: z.array(blockAlertSchema).default([]),
    /** Whether this block's alerts make a sound. */
    soundEnabled: z.boolean().default(true),
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
 *
 * Derived from the schema's *output* type, so the fields carrying a Zod
 * `.default()` are required here. Defaults exist to heal data read back from
 * storage, not to let new callers skip a decision they are standing right in
 * front of: the form already holds subtasks, alerts and the sound toggle in
 * state, so passing them costs nothing and forgetting them would silently
 * discard the user's input.
 */
export type NewBlock = Omit<Block, "id" | "createdAt" | "updatedAt">;
