import type { Block } from "@/types/block";
import type { Recurrence } from "@/types/recurrence";
import { blocksForDay, occursOn } from "@/features/timeline/utils/recurrence";

function makeRule(overrides: Partial<Recurrence> = {}): Recurrence {
  return {
    id: "rule-1",
    freq: "daily",
    startsOn: "2026-07-01",
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

function makeBlock(overrides: Partial<Block> = {}): Block {
  return {
    id: "block-1",
    title: "Deep work",
    day: "2026-07-01",
    startMinute: 540,
    endMinute: 600,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe("occursOn", () => {
  it("matches every day for freq 'daily'", () => {
    const rule = makeRule({ freq: "daily", startsOn: "2026-07-01" });
    expect(occursOn(rule, "2026-07-15")).toBe(true);
  });

  it("returns false before the start day", () => {
    const rule = makeRule({ freq: "daily", startsOn: "2026-07-10" });
    expect(occursOn(rule, "2026-07-05")).toBe(false);
  });

  it("returns false after the end day", () => {
    const rule = makeRule({
      freq: "daily",
      startsOn: "2026-07-01",
      endsOn: "2026-07-10",
    });
    expect(occursOn(rule, "2026-07-11")).toBe(false);
  });

  it("only matches Monday-Friday for freq 'weekdays'", () => {
    const rule = makeRule({ freq: "weekdays", startsOn: "2026-07-01" });
    // 2026-07-20 is a Monday, 2026-07-25 is a Saturday.
    expect(occursOn(rule, "2026-07-20")).toBe(true);
    expect(occursOn(rule, "2026-07-25")).toBe(false);
  });

  it("only matches the configured weekdays for freq 'weekly'", () => {
    const rule = makeRule({
      freq: "weekly",
      startsOn: "2026-07-01",
      byWeekday: [2],
    }); // Tuesday
    expect(occursOn(rule, "2026-07-21")).toBe(true); // Tuesday
    expect(occursOn(rule, "2026-07-22")).toBe(false); // Wednesday
  });
});

describe("blocksForDay", () => {
  it("includes non-recurring blocks scheduled on that exact day", () => {
    const block = makeBlock({ day: "2026-07-22" });
    expect(blocksForDay([block], [], "2026-07-22")).toHaveLength(1);
    expect(blocksForDay([block], [], "2026-07-23")).toHaveLength(0);
  });

  it("projects a recurring template onto a matching future day", () => {
    const rule = makeRule({ id: "r1", freq: "daily", startsOn: "2026-07-01" });
    const template = makeBlock({
      id: "b1",
      day: "2026-07-01",
      recurrenceId: "r1",
    });
    const result = blocksForDay([template], [rule], "2026-07-15");
    expect(result).toHaveLength(1);
    expect(result[0].day).toBe("2026-07-15");
    expect(result[0].id).toBe("b1");
  });

  it("does not project onto a day the rule does not match", () => {
    const rule = makeRule({
      id: "r1",
      freq: "weekdays",
      startsOn: "2026-07-01",
    });
    const template = makeBlock({
      id: "b1",
      day: "2026-07-01",
      recurrenceId: "r1",
    });
    // 2026-07-25 is a Saturday.
    expect(blocksForDay([template], [rule], "2026-07-25")).toHaveLength(0);
  });

  it("does not duplicate the template on its own anchor day", () => {
    const rule = makeRule({ id: "r1", freq: "daily", startsOn: "2026-07-01" });
    const template = makeBlock({
      id: "b1",
      day: "2026-07-01",
      recurrenceId: "r1",
    });
    expect(blocksForDay([template], [rule], "2026-07-01")).toHaveLength(1);
  });
});
