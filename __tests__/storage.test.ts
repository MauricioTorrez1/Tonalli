import AsyncStorage from "@react-native-async-storage/async-storage";

import { load, remove, save } from "@/store/storage";
import { blockSchema } from "@/types/block";

const KEY = "test-key";

const validBlock = {
  id: "00000000-0000-4000-8000-000000000000",
  title: "Deep work",
  color: "sage" as const,
  day: "2026-07-22",
  startMinute: 540,
  endMinute: 660,
  completedAt: null,
  createdAt: 0,
  updatedAt: 0,
};

afterEach(async () => {
  await AsyncStorage.clear();
});

describe("load", () => {
  it("returns null when nothing is stored", async () => {
    expect(await load(KEY, blockSchema)).toBeNull();
  });

  it("round-trips a valid value through save", async () => {
    await save(KEY, validBlock);
    expect(await load(KEY, blockSchema)).toEqual(validBlock);
  });

  it("returns null on malformed JSON instead of throwing", async () => {
    await AsyncStorage.setItem(KEY, "{not valid json");
    expect(await load(KEY, blockSchema)).toBeNull();
  });

  it("returns null when stored data fails schema validation", async () => {
    await AsyncStorage.setItem(
      KEY,
      JSON.stringify({ ...validBlock, startMinute: 9999 }),
    );
    expect(await load(KEY, blockSchema)).toBeNull();
  });

  it("infers the value type from the schema", async () => {
    await save(KEY, validBlock);
    const result = await load(KEY, blockSchema);
    // Type-level check: `result` is `Block | null`, so this compiles only
    // because the generic inferred the right type.
    expect(result?.title).toBe("Deep work");
  });
});

describe("remove", () => {
  it("deletes a stored value", async () => {
    await save(KEY, validBlock);
    await remove(KEY);
    expect(await load(KEY, blockSchema)).toBeNull();
  });
});

describe("blockSchema", () => {
  it("rejects a block whose end is not after its start", () => {
    const result = blockSchema.safeParse({
      ...validBlock,
      startMinute: 600,
      endMinute: 600,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown color token", () => {
    const result = blockSchema.safeParse({ ...validBlock, color: "neon" });
    expect(result.success).toBe(false);
  });
});
