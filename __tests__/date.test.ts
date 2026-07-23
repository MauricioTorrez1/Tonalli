import {
  addDays,
  dayHeading,
  formatDuration,
  isoWeekday,
  isWeekday,
  startOfWeek,
  weekDays,
} from "@/lib/date";

describe("addDays", () => {
  it("adds days within the same month", () => {
    expect(addDays("2026-07-20", 3)).toBe("2026-07-23");
  });

  it("rolls over into the next month", () => {
    expect(addDays("2026-07-30", 3)).toBe("2026-08-02");
  });

  it("supports negative counts", () => {
    expect(addDays("2026-07-01", -1)).toBe("2026-06-30");
  });
});

describe("isoWeekday / isWeekday", () => {
  it("2026-07-20 is a Monday", () => {
    expect(isoWeekday("2026-07-20")).toBe(1);
    expect(isWeekday("2026-07-20")).toBe(true);
  });

  it("2026-07-26 is a Sunday", () => {
    expect(isoWeekday("2026-07-26")).toBe(7);
    expect(isWeekday("2026-07-26")).toBe(false);
  });
});

describe("startOfWeek", () => {
  it("returns the same day when it is already Monday", () => {
    expect(startOfWeek("2026-07-20")).toBe("2026-07-20");
  });

  it("returns the preceding Monday for a mid-week day", () => {
    expect(startOfWeek("2026-07-22")).toBe("2026-07-20");
  });

  it("returns the preceding Monday for a Sunday", () => {
    expect(startOfWeek("2026-07-26")).toBe("2026-07-20");
  });
});

describe("weekDays", () => {
  it("returns seven consecutive Monday-first days", () => {
    expect(weekDays("2026-07-22")).toEqual([
      "2026-07-20",
      "2026-07-21",
      "2026-07-22",
      "2026-07-23",
      "2026-07-24",
      "2026-07-25",
      "2026-07-26",
    ]);
  });
});

describe("dayHeading", () => {
  it("returns 'Hoy' when the day matches today", () => {
    expect(dayHeading("2026-07-22", "2026-07-22")).toBe("Hoy");
  });

  it("returns the weekday name and day-of-month otherwise", () => {
    expect(dayHeading("2026-07-22", "2026-07-20")).toBe("Miércoles 22");
  });
});

describe("formatDuration", () => {
  it("formats a duration under an hour as minutes only", () => {
    expect(formatDuration(45)).toBe("45 min");
  });

  it("formats an exact number of hours without minutes", () => {
    expect(formatDuration(120)).toBe("2 h");
  });

  it("formats hours and minutes together", () => {
    expect(formatDuration(140)).toBe("2 h 20 min");
  });

  it("formats zero minutes", () => {
    expect(formatDuration(0)).toBe("0 min");
  });
});
