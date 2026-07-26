/**
 * A checklist item inside a block.
 *
 * Subtasks are stored on the block rather than as their own top-level
 * collection: they have no meaning apart from their parent, are always loaded
 * with it, and never number more than a handful. A separate collection would
 * buy nothing but a join.
 *
 * Note the asymmetry with `Completion`: a *block*'s completion is tracked per
 * day, because one recurring block occurs many times. A subtask's `done` is
 * not — it is part of the block's definition, so ticking one on Monday leaves
 * it ticked for Tuesday's occurrence too. Per-occurrence subtasks would need
 * the same day-keyed treatment completions get, and that is a bigger change
 * than this feature warrants (see docs/adr/0005-recurrence-virtual-expansion.md).
 */
import { z } from "zod";

export const subtaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  done: z.boolean(),
});

export type Subtask = z.infer<typeof subtaskSchema>;
