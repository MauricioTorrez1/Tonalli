/**
 * File system + share-sheet + document-picker glue for backup/restore. Thin
 * and untested by design — see the module doc in utils/backup.ts.
 *
 * Uses expo-file-system's newer `File`/`Directory` class API (the legacy
 * `writeAsStringAsync`/`cacheDirectory` string API from older SDKs no longer
 * exists in the installed version).
 */
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import type { Backup } from "@/types/backup";
import { parseBackup } from "./utils/backup";

const BACKUP_FILE_NAME = "tonalliblock-backup.json";

/**
 * Write the backup to a cache file and open the OS share sheet on it.
 * Returns whether the share sheet actually opened — the caller should tell
 * the user if it didn't, since the export would otherwise appear to do
 * nothing (the file is written either way, just not surfaced anywhere).
 */
export async function exportBackup(backup: Backup): Promise<boolean> {
  const file = new File(Paths.cache, BACKUP_FILE_NAME);
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(JSON.stringify(backup, null, 2));

  const available = await Sharing.isAvailableAsync();
  if (available) {
    await Sharing.shareAsync(file.uri, { mimeType: "application/json" });
  }
  return available;
}

/**
 * Let the user pick a `.json` file and validate it as a `Backup`. Returns
 * `null` if the picker was cancelled, the file couldn't be read, or its
 * contents don't match the schema — the caller shows one generic error
 * either way, since none of those cases are actionable differently.
 */
export async function pickBackupFile(): Promise<Backup | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/json",
    copyToCacheDirectory: true,
  });
  if (result.canceled) {
    return null;
  }
  const asset = result.assets[0];
  if (!asset) {
    return null;
  }
  try {
    const content = await new File(asset.uri).text();
    const parsed: unknown = JSON.parse(content);
    return parseBackup(parsed);
  } catch {
    return null;
  }
}
