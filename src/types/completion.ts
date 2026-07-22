/**
 * Completion is tracked separately from the block, as a `(blockId, day)` pair,
 * rather than as a `completedAt` field on the block itself. This is what lets
 * a *recurring* block be completed independently on each day it occurs — a
 * single template block has many occurrences, but each occurrence needs its
 * own done/not-done state. Non-recurring blocks use the same mechanism for
 * consistency, so status logic never has to special-case them.
 */
import { z } from "zod";

export const completionSchema = z.object({
  blockId: z.uuid(),
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  completedAt: z.number().int(),
});

export type Completion = z.infer<typeof completionSchema>;
