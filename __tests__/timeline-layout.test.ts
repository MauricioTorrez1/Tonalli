import type { Category } from "@/types/category";
import { NEUTRAL_BLOCK_COLOR } from "@/theme/colors";
import type { Block } from "@/types/block";
import {
  applyDuration,
  getBlockStatus,
  hasOverlap,
  nowIndicatorIndex,
  resolveBlockColor,
  resolveBlockIcon,
  shiftBlockTime,
  sortByStart,
} from "@/features/timeline/utils/timeline-layout";
import { makeBlock as baseBlock } from "./helpers/make-block";

/** Minimal block factory for tests; overrides win over the defaults. */
function makeBlock(overrides: Partial<Block> = {}): Block {
  return baseBlock({ title: "Test", ...overrides });
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
  const category: Category = {
    id: "x",
    name: "X",
    color: "#4FB286",
    icon: "leaf",
  };

  it("prefers the block's own color override", () => {
    expect(resolveBlockColor({ color: "#E8739A" }, category)).toBe("#E8739A");
  });

  it("falls back to the category color", () => {
    expect(resolveBlockColor({ color: undefined }, category)).toBe("#4FB286");
  });

  it("falls back to the neutral color when there is no category either", () => {
    expect(resolveBlockColor({ color: undefined }, undefined)).toBe(
      NEUTRAL_BLOCK_COLOR,
    );
  });
});

describe("resolveBlockIcon", () => {
  const category: Category = {
    id: "x",
    name: "X",
    color: "#4FB286",
    icon: "leaf",
  };

  it("prefers the block's own icon", () => {
    expect(resolveBlockIcon({ icon: "fire" }, category)).toBe("fire");
  });

  it("falls back to the category icon", () => {
    expect(resolveBlockIcon({ icon: undefined }, category)).toBe("leaf");
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

describe("shiftBlockTime", () => {
  it("shifts both ends by the same delta, preserving duration", () => {
    expect(shiftBlockTime(540, 600, 15)).toEqual({
      startMinute: 555,
      endMinute: 615,
    });
  });

  it("shifts earlier with a negative delta", () => {
    expect(shiftBlockTime(540, 600, -15)).toEqual({
      startMinute: 525,
      endMinute: 585,
    });
  });

  it("clamps at the start of the day instead of going negative", () => {
    expect(shiftBlockTime(10, 70, -30)).toEqual({
      startMinute: 0,
      endMinute: 60,
    });
  });

  it("clamps at the end of the day instead of overflowing into a new day", () => {
    expect(shiftBlockTime(1400, 1435, 30)).toEqual({
      startMinute: 1404,
      endMinute: 1439,
    });
  });
});

describe("applyDuration", () => {
  it("sets the end from the start plus the requested duration", () => {
    expect(applyDuration(540, 30)).toEqual({
      startMinute: 540,
      endMinute: 570,
    });
  });

  it("keeps the start where the user put it and clamps only the end", () => {
    // 23:50 plus an hour would run past midnight. Moving the block earlier
    // would silently override a time the user explicitly chose.
    expect(applyDuration(1430, 60)).toEqual({
      startMinute: 1430,
      endMinute: 1439,
    });
  });

  it("never produces a zero-length block", () => {
    expect(applyDuration(540, 0)).toEqual({
      startMinute: 540,
      endMinute: 541,
    });
    expect(applyDuration(540, -30)).toEqual({
      startMinute: 540,
      endMinute: 541,
    });
  });
});
