import type { Category } from "@/types/category";
import type { Block } from "@/types/block";
import {
  getBlockStatus,
  hasOverlap,
  nowIndicatorIndex,
  resolveBlockColor,
  resolveBlockIcon,
  sortByStart,
} from "@/features/timeline/utils/timeline-layout";

/** Minimal block factory for tests; overrides win over the defaults. */
function makeBlock(overrides: Partial<Block> = {}): Block {
  return {
    id: "00000000-0000-4000-8000-000000000000",
    title: "Test",
    day: "2026-07-22",
    startMinute: 540,
    endMinute: 600,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe("sortByStart", () => {
  it("orders blocks by start time then end time", () => {
    const blocks = [
      makeBlock({ startMinute: 600, endMinute: 660 }),
      makeBlock({ startMinute: 540, endMinute: 700 }),
      makeBlock({ startMinute: 540, endMinute: 600 }),
    ];
    const sorted = sortByStart(blocks);
    expect(sorted.map((b) => [b.startMinute, b.endMinute])).toEqual([
      [540, 600],
      [540, 700],
      [600, 660],
    ]);
  });

  it("does not mutate the input array", () => {
    const blocks = [
      makeBlock({ startMinute: 600 }),
      makeBlock({ startMinute: 540 }),
    ];
    const snapshot = blocks.map((b) => b.startMinute);
    sortByStart(blocks);
    expect(blocks.map((b) => b.startMinute)).toEqual(snapshot);
  });
});

describe("getBlockStatus", () => {
  const today = "2026-07-22";

  it("returns 'completed' whenever isDone is true, regardless of time", () => {
    const block = makeBlock({ day: today, startMinute: 540, endMinute: 600 });
    expect(getBlockStatus(block, 545, true, today)).toBe("completed");
  });

  it("returns 'current' when now is within the block, on today", () => {
    const block = makeBlock({ day: today, startMinute: 540, endMinute: 600 });
    expect(getBlockStatus(block, 570, false, today)).toBe("current");
  });

  it("treats the start minute as inclusive and the end as exclusive", () => {
    const block = makeBlock({ day: today, startMinute: 540, endMinute: 600 });
    expect(getBlockStatus(block, 540, false, today)).toBe("current");
    expect(getBlockStatus(block, 600, false, today)).toBe("past");
  });

  it("returns 'upcoming' before the block starts, on today", () => {
    const block = makeBlock({ day: today, startMinute: 540, endMinute: 600 });
    expect(getBlockStatus(block, 400, false, today)).toBe("upcoming");
  });

  it("is always 'past' on a day before today, regardless of clock time", () => {
    const block = makeBlock({
      day: "2026-07-20",
      startMinute: 540,
      endMinute: 600,
    });
    // now=570 falls inside the block's minute range, but the day is history.
    expect(getBlockStatus(block, 570, false, today)).toBe("past");
  });

  it("is always 'upcoming' on a day after today, regardless of clock time", () => {
    const block = makeBlock({
      day: "2026-07-25",
      startMinute: 540,
      endMinute: 600,
    });
    expect(getBlockStatus(block, 570, false, today)).toBe("upcoming");
  });
});

describe("resolveBlockColor", () => {
  const category: Category = { id: "x", name: "X", color: "mint", icon: "🌿" };

  it("prefers the block's own color override", () => {
    expect(resolveBlockColor({ color: "rose" }, category)).toBe("rose");
  });

  it("falls back to the category color", () => {
    expect(resolveBlockColor({ color: undefined }, category)).toBe("mint");
  });

  it("falls back to the neutral token when there is no category either", () => {
    expect(resolveBlockColor({ color: undefined }, undefined)).toBe("stone");
  });
});

describe("resolveBlockIcon", () => {
  const category: Category = { id: "x", name: "X", color: "mint", icon: "🌿" };

  it("prefers the block's own icon", () => {
    expect(resolveBlockIcon({ icon: "🔥" }, category)).toBe("🔥");
  });

  it("falls back to the category icon", () => {
    expect(resolveBlockIcon({ icon: undefined }, category)).toBe("🌿");
  });

  it("returns undefined when neither is set", () => {
    expect(resolveBlockIcon({ icon: undefined }, undefined)).toBeUndefined();
  });
});

describe("nowIndicatorIndex", () => {
  const blocks = sortByStart([
    makeBlock({ startMinute: 540 }),
    makeBlock({ startMinute: 660 }),
    makeBlock({ startMinute: 780 }),
  ]);

  it("places the marker after every block that has started", () => {
    expect(nowIndicatorIndex(blocks, 600)).toBe(1);
  });

  it("returns 0 before the first block", () => {
    expect(nowIndicatorIndex(blocks, 400)).toBe(0);
  });

  it("returns the length after the last block starts", () => {
    expect(nowIndicatorIndex(blocks, 900)).toBe(3);
  });

  it("returns 0 for an empty day", () => {
    expect(nowIndicatorIndex([], 600)).toBe(0);
  });
});

describe("hasOverlap", () => {
  it("detects overlapping blocks", () => {
    const blocks = [
      makeBlock({ startMinute: 540, endMinute: 620 }),
      makeBlock({ startMinute: 600, endMinute: 660 }),
    ];
    expect(hasOverlap(blocks)).toBe(true);
  });

  it("allows blocks that touch but do not overlap", () => {
    const blocks = [
      makeBlock({ startMinute: 540, endMinute: 600 }),
      makeBlock({ startMinute: 600, endMinute: 660 }),
    ];
    expect(hasOverlap(blocks)).toBe(false);
  });

  it("handles a block ending at the last minute of the day", () => {
    const blocks = [
      makeBlock({ startMinute: 1380, endMinute: 1439 }),
      makeBlock({ startMinute: 1200, endMinute: 1260 }),
    ];
    expect(hasOverlap(blocks)).toBe(false);
  });
});
