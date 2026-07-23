# 8. Backup/restore replaces all data, does not merge

- **Status:** Accepted
- **Date:** 2026-07-23

## Context

The app needed a way to move data between devices without a server (see [ADR 1](0001-offline-only-asyncstorage.md) — there is no sync). A JSON export/import was always the planned Phase 2 mechanism.

## Decision

A backup file is `{ version, exportedAt, blocks, recurrences, completions }` — `notificationIdsByBlock` is deliberately excluded, since those ids reference OS-level scheduled notifications on the exporting device and mean nothing on another one. Export writes the JSON to a cache file (`expo-file-system`'s newer `File`/`Directory` class API — the older `writeAsStringAsync`/`cacheDirectory` string API doesn't exist in the installed SDK 54 version, confirmed by reading the type definitions before writing this code) and opens the OS share sheet on it (`expo-sharing`). Restore uses `expo-document-picker` to pick a `.json` file, validates it against `backupSchema` (Zod, same boundary-validation pattern as everywhere else — see [ADR 3](0003-zod-validation-at-the-boundary.md)), and on confirmation **replaces** the store's `blocks`/`recurrences`/`completions` wholesale.

Restore is a destructive replace, not a merge. A merge would need to resolve id collisions, decide which of two versions of an edited block "wins", and reconcile completions across two independent histories — real complexity for a feature whose actual use case (move to a new phone, or recover from an accidental delete) is served fine by "start from the file". The restore flow asks for confirmation via `Alert.alert` before doing it, same pattern as deleting a block.

After restoring, notifications are re-scheduled for every restored block (sequentially, awaited one at a time — a personal-scale block count, and sequential avoids flooding the native scheduling queue). Without this, a device with notifications previously enabled would silently lose all reminders after a restore.

## Consequences

- `store/block-store.ts`'s `restoreBackup` action clears `notificationIdsByBlock` as part of the replace, since the old ids are stale.
- The pure pieces (`buildBackup`, `parseBackup` in `features/backup/utils/backup.ts`) are fully unit-tested; the file-system/sharing/picker glue in `features/backup/io.ts` is not, matching the established split between pure domain logic and thin I/O wrappers (`store/storage.ts`, `features/notifications/{triggers,schedule}.ts`).
- A backup restored from an older app version whose blocks used now-retired color tokens would fail `blockSchema` validation and get rejected by `parseBackup` — this mirrors the real migration handled in `store/block-store.ts`'s `migrateV1ToV2`, but for now only applies going forward: only backups made *since* this version was released are guaranteed to restore. Acceptable for Phase 2; revisit if it becomes a real complaint.
