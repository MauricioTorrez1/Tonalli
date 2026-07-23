import { buildBackup, parseBackup } from "@/features/backup/utils/backup";
import { BACKUP_VERSION } from "@/types/backup";

const validBlock = {
  id: "00000000-0000-4000-8000-000000000000",
  title: "Deep work",
  day: "2026-07-22",
  startMinute: 540,
  endMinute: 600,
  createdAt: 0,
  updatedAt: 0,
};

describe("buildBackup", () => {
  it("stamps the current version and timestamp", () => {
    const backup = buildBackup([validBlock], [], [], 12345);
    expect(backup.version).toBe(BACKUP_VERSION);
    expect(backup.exportedAt).toBe(12345);
    expect(backup.blocks).toEqual([validBlock]);
  });

  it("copies the input arrays rather than referencing them", () => {
    const blocks = [validBlock];
    const backup = buildBackup(blocks, [], [], 0);
    expect(backup.blocks).not.toBe(blocks);
  });
});

describe("parseBackup", () => {
  it("accepts a well-formed backup", () => {
    const backup = buildBackup([validBlock], [], [], 0);
    expect(parseBackup(backup)).toEqual(backup);
  });

  it("rejects garbage input instead of throwing", () => {
    expect(parseBackup("not a backup")).toBeNull();
    expect(parseBackup(null)).toBeNull();
    expect(parseBackup({})).toBeNull();
  });

  it("rejects a backup with an invalid block inside it", () => {
    const backup = buildBackup([validBlock], [], [], 0);
    const corrupted = { ...backup, blocks: [{ ...validBlock, title: "" }] };
    expect(parseBackup(corrupted)).toBeNull();
  });

  it("rejects a mismatched version", () => {
    const backup = buildBackup([validBlock], [], [], 0);
    expect(parseBackup({ ...backup, version: 999 })).toBeNull();
  });
});
