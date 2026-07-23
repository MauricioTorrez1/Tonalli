/**
 * File system + share-sheet + document-picker glue for backup/restore. Thin
 * and untested by design — see the module doc in utils/backup.ts.
 *
 * Split by platform because the underlying APIs genuinely aren't the same
 * capability with different plumbing:
 * - Native: expo-file-system's newer `File`/`Directory` class API (the
 *   legacy `writeAsStringAsync`/`cacheDirectory` string API from older SDKs
 *   doesn't exist in the installed version) + expo-sharing's OS share sheet.
 * - Web: Metro resolves `expo-file-system` to its web stub there — the
 *   `File`/`Directory` constructors just `console.warn` and implement
 *   nothing (confirmed by reading `expo-file-system/src/ExpoFileSystem.web.ts`),
 *   so those methods must never actually be called on web. The standard
 *   browser pattern — a `Blob` + a temporary `<a download>` — replaces it for
 *   export. For restore, expo-document-picker's web implementation already
 *   hands back the real browser `File` object as `asset.file`, which has its
 *   own native `.text()`.
 */
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import type { Backup } from "@/types/backup";
import { parseBackup } from "./utils/backup";

const BACKUP_FILE_NAME = "tonalliblock-backup.json";

/**
 * Write the backup to a file and hand it to the user — the OS share sheet on
 * native, a browser download on web. Returns whether that actually happened;
 * the caller should tell the user if it didn't, since the alternative is the
 * export silently appearing to do nothing.
 */
export async function exportBackup(backup: Backup): Promise<boolean> {
  const json = JSON.stringify(backup, null, 2);
  return Platform.OS === "web"
    ? exportBackupWeb(json)
    : exportBackupNative(json);
}

function exportBackupWeb(json: string): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  const url = URL.createObjectURL(
    new Blob([json], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = BACKUP_FILE_NAME;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

async function exportBackupNative(json: string): Promise<boolean> {
  const file = new File(Paths.cache, BACKUP_FILE_NAME);
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(json);

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
    const content =
      Platform.OS === "web" && asset.file
        ? await asset.file.text()
        : await new File(asset.uri).text();
    const parsed: unknown = JSON.parse(content);
    return parseBackup(parsed);
  } catch {
    return null;
  }
}
