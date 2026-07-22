import type { Block } from "@/types/block";
import {
  getBlockStatus,
  hasOverlap,
  nowIndicatorIndex,
  sortByStart,
} from "@/features/timeline/utils/timeline-layout";

/** Minimal block factory for tests; overrides win over the defaults. */
function makeBlock(overrides: Partial<Block> = {}): Block {
  return {
    id: "00000000-0000-4000-8000-000000000000",
    title: "Test",
    color: "sage",
    day: "2026-07-22",
    startMinute: 540,
    endMinute: 600,
    completedAt: null,
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
  it("returns 'completed' whenever completedAt is set, regardless of time", () => {
    const block = makeBlock({
      startMinute: 540,
      endMinute: 600,
      completedAt: 123,
    });
    expect(getBlockStatus(block, 545)).toBe("completed");
  });

  it("returns 'current' when now is within the block", () => {
    const block = makeBlock({ startMinute: 540, endMinute: 600 });
    expect(getBlockStatus(block, 570)).toBe("current");
  });

  it("treats the start minute as inclusive and the end as exclusive", () => {
    const block = makeBlock({ startMinute: 540, endMinute: 600 });
    expect(getBlockStatus(block, 540)).toBe("current");
    expect(getBlockStatus(block, 600)).toBe("past");
  });

  it("returns 'upcoming' before the block starts", () => {
    const block = makeBlock({ startMinute: 540, endMinute: 600 });
    expect(getBlockStatus(block, 400)).toBe("upcoming");
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
