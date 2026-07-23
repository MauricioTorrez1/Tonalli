/**
 * Pure backup construction and validation — no file system, no sharing, so
 * these are fully unit-tested. The I/O side (writing/sharing/picking a real
 * file) lives in io.ts and is not tested, following the same split as
 * store/storage.ts and features/notifications/{triggers,schedule}.ts.
 */
import { backupSchema, BACKUP_VERSION, type Backup } from "@/types/backup";
import type { Block } from "@/types/block";
import type { Completion } from "@/types/completion";
import type { Recurrence } from "@/types/recurrence";

export function buildBackup(
  blocks: readonly Block[],
  recurrences: readonly Recurrence[],
  completions: readonly Completion[],
  exportedAt: number,
): Backup {
  return {
    version: BACKUP_VERSION,
    exportedAt,
    blocks: [...blocks],
    recurrences: [...recurrences],
    completions: [...completions],
  };
}

/** Validate an unknown value as a `Backup`, returning `null` if it doesn't fit. */
export function parseBackup(raw: unknown): Backup | null {
  const result = backupSchema.safeParse(raw);
  return result.success ? result.data : null;
}
