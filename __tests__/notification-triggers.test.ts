import type { Block } from "@/types/block";
import type { Recurrence } from "@/types/recurrence";
import {
  buildTriggersForBlock,
  describeAlert,
  isoWeekdayToExpoWeekday,
  resolveAlertMoment,
  shiftIsoWeekday,
} from "@/features/notifications/triggers";
import { makeBlock as baseBlock, makeRecurrence } from "./helpers/make-block";

function makeBlock(overrides: Partial<Block> = {}): Block {
  return baseBlock({
    id: "b1",
    startMinute: 600, // 10:00
    endMinute: 660, // 11:00
    ...overrides,
  });
}

function makeRule(overrides: Partial<Recurrence> = {}): Recurrence {
  return makeRecurrence(overrides);
}

/** An alert at the block's start, the app's default. */
const atStart = { id: "a1", anchor: "start" as const, offsetMinutes: 0 };

describe("isoWeekdayToExpoWeekday", () => {
  it("maps Monday (1) to Expo's 2", () => {
    expect(isoWeekdayToExpoWeekday(1)).toBe(2);
  });

  it("maps Sunday (7) to Expo's 1", () => {
    expect(isoWeekdayToExpoWeekday(7)).toBe(1);
  });
});

describe("shiftIsoWeekday", () => {
  it("moves forward within the week", () => {
    expect(shiftIsoWeekday(1, 1)).toBe(2);
  });

  it("wraps backward past Monday to Sunday", () => {
    expect(shiftIsoWeekday(1, -1)).toBe(7);
  });

  it("wraps forward past Sunday to Monday", () => {
    expect(shiftIsoWeekday(7, 1)).toBe(1);
  });

  it("is a no-op for a zero shift", () => {
    expect(shiftIsoWeekday(4, 0)).toBe(4);
  });
});

describe("resolveAlertMoment", () => {
  const block = { startMinute: 600, endMinute: 660 };

  it("resolves an at-start alert to the start minute, same day", () => {
    expect(resolveAlertMoment(block, atStart)).toEqual({
      minuteOfDay: 600,
      dayShift: 0,
    });
  });

  it("anchors to the end minute when asked", () => {
    expect(
      resolveAlertMoment(block, { id: "a", anchor: "end", offsetMinutes: 0 }),
    ).toEqual({ minuteOfDay: 660, dayShift: 0 });
  });

  it("subtracts a negative offset", () => {
    expect(
      resolveAlertMoment(block, {
        id: "a",
        anchor: "start",
        offsetMinutes: -30,
      }),
    ).toEqual({ minuteOfDay: 570, dayShift: 0 });
  });

  it("rolls back to the previous day when the offset crosses midnight", () => {
    // A 00:10 block, reminded 30 minutes ahead → 23:40 the day before.
    expect(
      resolveAlertMoment(
        { startMinute: 10, endMinute: 70 },
        { id: "a", anchor: "start", offsetMinutes: -30 },
      ),
    ).toEqual({ minuteOfDay: 1420, dayShift: -1 });
  });

  it("rolls forward when an after-the-end offset crosses midnight", () => {
    expect(
      resolveAlertMoment(
        { startMinute: 1380, endMinute: 1430 }, // ends 23:50
        { id: "a", anchor: "end", offsetMinutes: 30 },
      ),
    ).toEqual({ minuteOfDay: 20, dayShift: 1 });
  });
});

describe("describeAlert", () => {
  it("describes the start", () => {
    expect(describeAlert(atStart)).toBe("Empieza ahora.");
  });

  it("describes the end", () => {
    expect(describeAlert({ id: "a", anchor: "end", offsetMinutes: 0 })).toBe(
      "Termina ahora.",
    );
  });

  it("describes a lead time", () => {
    expect(
      describeAlert({ id: "a", anchor: "start", offsetMinutes: -15 }),
    ).toBe("Empieza en 15 min.");
  });

  it("describes an overdue reminder", () => {
    expect(describeAlert({ id: "a", anchor: "start", offsetMinutes: 10 })).toBe(
      "Empezó hace 10 min.",
    );
  });
});

describe("buildTriggersForBlock", () => {
  it("schedules nothing for a block with no alerts", () => {
    const block = makeBlock({ alerts: [] });
    expect(buildTriggersForBlock(block, undefined, new Date(0))).toEqual([]);
  });

  it("builds a one-shot trigger for a non-recurring block", () => {
    const block = makeBlock({ day: "2026-07-22", alerts: [atStart] });
    const triggers = buildTriggersForBlock(
      block,
      undefined,
      new Date("2026-07-22T08:00:00"),
    );
    expect(triggers).toHaveLength(1);
    expect(triggers[0]).toMatchObject({
      kind: "date",
      body: "Empieza ahora.",
    });
  });

  it("skips a one-shot trigger that is already in the past", () => {
    const block = makeBlock({ day: "2026-07-22", alerts: [atStart] });
    const triggers = buildTriggersForBlock(
      block,
      undefined,
      new Date("2026-07-22T23:00:00"),
    );
    expect(triggers).toEqual([]);
  });

  it("shifts the one-shot date when the alert crosses midnight", () => {
    const block = makeBlock({
      day: "2026-07-22",
      startMinute: 10,
      endMinute: 70,
      alerts: [{ id: "a", anchor: "start", offsetMinutes: -30 }],
    });
    const triggers = buildTriggersForBlock(
      block,
      undefined,
      new Date("2026-07-21T08:00:00"),
    );
    expect(triggers).toHaveLength(1);
    const trigger = triggers[0];
    if (trigger.kind !== "date") {
      throw new Error("expected a one-shot trigger");
    }
    // 23:40 on the 21st, not the 22nd.
    expect(trigger.date.getDate()).toBe(21);
    expect(trigger.date.getHours()).toBe(23);
    expect(trigger.date.getMinutes()).toBe(40);
  });

  it("builds one daily trigger per alert", () => {
    const block = makeBlock({
      alerts: [atStart, { id: "a2", anchor: "start", offsetMinutes: -15 }],
    });
    const triggers = buildTriggersForBlock(
      block,
      makeRule({ freq: "daily" }),
      new Date(0),
    );
    expect(triggers).toEqual([
      { kind: "daily", hour: 10, minute: 0, body: "Empieza ahora." },
      { kind: "daily", hour: 9, minute: 45, body: "Empieza en 15 min." },
    ]);
  });

  it("builds five weekly triggers for 'weekdays'", () => {
    const block = makeBlock({ alerts: [atStart] });
    const triggers = buildTriggersForBlock(
      block,
      makeRule({ freq: "weekdays" }),
      new Date(0),
    );
    expect(triggers).toHaveLength(5);
    expect(
      triggers.map((t) => (t.kind === "weekly" ? t.expoWeekday : 0)),
    ).toEqual([2, 3, 4, 5, 6]);
  });

  it("moves the weekday back when the alert lands on the previous day", () => {
    const block = makeBlock({
      startMinute: 10, // 00:10
      endMinute: 70,
      alerts: [{ id: "a", anchor: "start", offsetMinutes: -30 }],
    });
    const triggers = buildTriggersForBlock(
      block,
      makeRule({ freq: "weekly", byWeekday: [1] }), // Mondays
      new Date(0),
    );
    expect(triggers).toHaveLength(1);
    // Sunday in ISO (7), which is Expo's 1.
    expect(triggers[0]).toMatchObject({ kind: "weekly", expoWeekday: 1 });
  });

  it("builds one weekly trigger per selected day per alert", () => {
    const block = makeBlock({
      alerts: [atStart, { id: "a2", anchor: "end", offsetMinutes: 0 }],
    });
    const triggers = buildTriggersForBlock(
      block,
      makeRule({ freq: "weekly", byWeekday: [1, 3] }),
      new Date(0),
    );
    expect(triggers).toHaveLength(4);
    expect(triggers.filter((t) => t.body === "Termina ahora.")).toHaveLength(2);
  });
});
