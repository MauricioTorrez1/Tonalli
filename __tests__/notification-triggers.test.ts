import type { Block } from "@/types/block";
import type { Recurrence } from "@/types/recurrence";
import {
  buildTriggersForBlock,
  isoWeekdayToExpoWeekday,
} from "@/features/notifications/triggers";

function makeBlock(overrides: Partial<Block> = {}): Block {
  return {
    id: "b1",
    title: "Deep work",
    day: "2026-07-22",
    startMinute: 600, // 10:00
    endMinute: 660,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

function makeRule(overrides: Partial<Recurrence> = {}): Recurrence {
  return {
    id: "r1",
    freq: "daily",
    startsOn: "2026-07-01",
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe("isoWeekdayToExpoWeekday", () => {
  it("maps Monday (1) to Expo's 2", () => {
    expect(isoWeekdayToExpoWeekday(1)).toBe(2);
  });

  it("maps Sunday (7) to Expo's 1", () => {
    expect(isoWeekdayToExpoWeekday(7)).toBe(1);
  });

  it("maps Saturday (6) to Expo's 7", () => {
    expect(isoWeekdayToExpoWeekday(6)).toBe(7);
  });
});

describe("buildTriggersForBlock", () => {
  const now = new Date("2026-07-20T00:00:00");

  it("builds a single future date trigger for a non-recurring block", () => {
    const block = makeBlock({ day: "2026-07-22" });
    const triggers = buildTriggersForBlock(block, undefined, now);
    expect(triggers).toHaveLength(1);
    expect(triggers[0].kind).toBe("date");
  });

  it("skips a one-shot trigger that would fire in the past", () => {
    const block = makeBlock({ day: "2026-07-01" });
    expect(buildTriggersForBlock(block, undefined, now)).toHaveLength(0);
  });

  it("builds one repeating daily trigger for freq 'daily'", () => {
    const block = makeBlock({ startMinute: 600 });
    const rule = makeRule({ freq: "daily" });
    const triggers = buildTriggersForBlock(block, rule, now);
    expect(triggers).toEqual([{ kind: "daily", hour: 10, minute: 0 }]);
  });

  it("builds five weekly triggers for freq 'weekdays'", () => {
    const block = makeBlock({ startMinute: 540 });
    const rule = makeRule({ freq: "weekdays" });
    const triggers = buildTriggersForBlock(block, rule, now);
    expect(triggers).toHaveLength(5);
    expect(triggers.every((t) => t.kind === "weekly")).toBe(true);
  });

  it("builds one weekly trigger per selected day for freq 'weekly'", () => {
    const block = makeBlock({ startMinute: 540 });
    const rule = makeRule({ freq: "weekly", byWeekday: [1, 3] });
    const triggers = buildTriggersForBlock(block, rule, now);
    expect(triggers).toHaveLength(2);
  });
});
