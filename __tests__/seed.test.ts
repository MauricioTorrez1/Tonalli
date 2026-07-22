import { buildSeedBlocks } from "@/store/seed";
import { blockSchema } from "@/types/block";

describe("buildSeedBlocks", () => {
  it("produces blocks that all pass schema validation", () => {
    const blocks = buildSeedBlocks("2026-07-22", 600);
    for (const block of blocks) {
      expect(blockSchema.safeParse(block).success).toBe(true);
    }
  });

  it("assigns the requested day to every block", () => {
    const blocks = buildSeedBlocks("2026-07-22", 600);
    expect(blocks.every((b) => b.day === "2026-07-22")).toBe(true);
  });

  it("gives each block a unique id", () => {
    const blocks = buildSeedBlocks("2026-07-22", 600);
    const ids = new Set(blocks.map((b) => b.id));
    expect(ids.size).toBe(blocks.length);
  });
});
