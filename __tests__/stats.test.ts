import type { Block } from "@/types/block";
import type { Completion } from "@/types/completion";
import {
  currentStreak,
  minutesByCategory,
  UNCATEGORIZED,
} from "@/features/stats/utils/stats";

function makeBlock(overrides: Partial<Block> = {}): Block {
  return {
    id: "b1",
    title: "Deep work",
    day: "2026-07-20",
    startMinute: 540,
    endMinute: 600, // 60 minutes
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe("minutesByCategory", () => {
  it("sums a block's duration under its category", () => {
    const blocks = [makeBlock({ id: "b1", categoryId: "enfoque" })];
    const completions: Completion[] = [
      { blockId: "b1", day: "2026-07-22", completedAt: 0 },
    ];
    expect(minutesByCategory(completions, blocks, "2026-07-01")).toEqual({
      enfoque: 60,
    });
  });

  it("buckets uncategorized blocks under UNCATEGORIZED", () => {
    const blocks = [makeBlock({ id: "b1" })];
    const completions: Completion[] = [
      { blockId: "b1", day: "2026-07-22", completedAt: 0 },
    ];
    const result = minutesByCategory(completions, blocks, "2026-07-01");
    expect(result[UNCATEGORIZED]).toBe(60);
  });

  it("excludes completions before sinceDay", () => {
    const blocks = [makeBlock({ id: "b1", categoryId: "enfoque" })];
    const completions: Completion[] = [
      { blockId: "b1", day: "2026-06-01", completedAt: 0 },
    ];
    expect(minutesByCategory(completions, blocks, "2026-07-01")).toEqual({});
  });

  it("skips completions whose block no longer exists", () => {
    const completions: Completion[] = [
      { blockId: "missing", day: "2026-07-22", completedAt: 0 },
    ];
    expect(minutesByCategory(completions, [], "2026-07-01")).toEqual({});
  });

  it("sums multiple completions of the same recurring block across days", () => {
    const blocks = [makeBlock({ id: "b1", categoryId: "enfoque" })];
    const completions: Completion[] = [
      { blockId: "b1", day: "2026-07-20", completedAt: 0 },
      { blockId: "b1", day: "2026-07-21", completedAt: 0 },
    ];
    expect(minutesByCategory(completions, blocks, "2026-07-01")).toEqual({
      enfoque: 120,
    });
  });
});

describe("currentStreak", () => {
  it("counts consecutive days ending today", () => {
    const completions: Completion[] = [
      { blockId: "b1", day: "2026-07-22", completedAt: 0 },
      { blockId: "b1", day: "2026-07-21", completedAt: 0 },
      { blockId: "b1", day: "2026-07-20", completedAt: 0 },
    ];
    expect(currentStreak(completions, "2026-07-22")).toBe(3);
  });

  it("still counts an unbroken streak if today has no completion yet", () => {
    const completions: Completion[] = [
      { blockId: "b1", day: "2026-07-21", completedAt: 0 },
      { blockId: "b1", day: "2026-07-20", completedAt: 0 },
    ];
    expect(currentStreak(completions, "2026-07-22")).toBe(2);
  });

  it("stops at a gap", () => {
    const completions: Completion[] = [
      { blockId: "b1", day: "2026-07-22", completedAt: 0 },
      { blockId: "b1", day: "2026-07-20", completedAt: 0 },
    ];
    expect(currentStreak(completions, "2026-07-22")).toBe(1);
  });

  it("returns 0 when there is no completion today or yesterday", () => {
    const completions: Completion[] = [
      { blockId: "b1", day: "2026-07-10", completedAt: 0 },
    ];
    expect(currentStreak(completions, "2026-07-22")).toBe(0);
  });

  it("returns 0 for no completions at all", () => {
    expect(currentStreak([], "2026-07-22")).toBe(0);
  });
});
