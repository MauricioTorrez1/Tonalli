/**
 * The shape of an exported backup file: everything a fresh install needs to
 * restore the user's data. `notificationIdsByBlock` is deliberately excluded
 * — those ids reference OS-level scheduled notifications on the *exporting*
 * device and are meaningless anywhere else; restore re-schedules fresh ones.
 */
import { z } from "zod";

import { blockSchema } from "./block";
import { completionSchema } from "./completion";
import { recurrenceSchema } from "./recurrence";

export const BACKUP_VERSION = 1;

export const backupSchema = z.object({
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.number().int(),
  blocks: z.array(blockSchema),
  recurrences: z.array(recurrenceSchema),
  completions: z.array(completionSchema),
});

export type Backup = z.infer<typeof backupSchema>;
