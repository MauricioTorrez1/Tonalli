import { fireEvent, render, screen } from "@testing-library/react-native";

import { buildMonthGrid, MonthCalendar } from "@/ui/MonthCalendar";

describe("buildMonthGrid", () => {
  it("pads the front so the first lands under its weekday column", () => {
    // 2026-07-01 is a Wednesday: ISO 3, so two blanks before it.
    const cells = buildMonthGrid("2026-07-01");
    expect(cells.slice(0, 3)).toEqual([null, null, "2026-07-01"]);
  });

  it("covers exactly the month's days after the padding", () => {
    const cells = buildMonthGrid("2026-07-01");
    const days = cells.filter((cell): cell is string => cell !== null);
    expect(days).toHaveLength(31);
    expect(days[30]).toBe("2026-07-31");
  });

  it("stops at the end of a short month", () => {
    const days = buildMonthGrid("2026-02-01").filter((cell) => cell !== null);
    expect(days).toHaveLength(28);
  });

  it("handles a leap February", () => {
    const days = buildMonthGrid("2028-02-01").filter((cell) => cell !== null);
    expect(days).toHaveLength(29);
  });

  it("needs no padding when the month starts on a Monday", () => {
    // 2026-06-01 is a Monday.
    expect(buildMonthGrid("2026-06-01")[0]).toBe("2026-06-01");
  });
});

describe("MonthCalendar", () => {
  it("opens on the month of the selected day", () => {
    render(<MonthCalendar selectedDay="2026-07-24" onSelectDay={jest.fn()} />);
    expect(screen.getByText("Julio 2026")).toBeTruthy();
  });

  it("reports the day the user taps", () => {
    const onSelectDay = jest.fn();
    render(
      <MonthCalendar selectedDay="2026-07-24" onSelectDay={onSelectDay} />,
    );
    fireEvent.press(screen.getByLabelText("15 de Julio 2026"));
    expect(onSelectDay).toHaveBeenCalledWith("2026-07-15");
  });

  it("steps back a month", () => {
    render(<MonthCalendar selectedDay="2026-07-24" onSelectDay={jest.fn()} />);
    fireEvent.press(screen.getByLabelText("Mes anterior"));
    expect(screen.getByText("Junio 2026")).toBeTruthy();
  });

  it("steps forward across a year boundary", () => {
    render(<MonthCalendar selectedDay="2026-12-10" onSelectDay={jest.fn()} />);
    fireEvent.press(screen.getByLabelText("Mes siguiente"));
    expect(screen.getByText("Enero 2027")).toBeTruthy();
  });

  it("steps back across a year boundary", () => {
    render(<MonthCalendar selectedDay="2026-01-10" onSelectDay={jest.fn()} />);
    fireEvent.press(screen.getByLabelText("Mes anterior"));
    expect(screen.getByText("Diciembre 2025")).toBeTruthy();
  });

  it("jumps to today from any month", () => {
    const onSelectDay = jest.fn();
    render(
      <MonthCalendar selectedDay="2020-01-15" onSelectDay={onSelectDay} />,
    );
    fireEvent.press(screen.getByLabelText("Ir a hoy"));
    expect(onSelectDay).toHaveBeenCalledTimes(1);
    // Whatever today is, it is not the day the calendar opened on.
    expect(onSelectDay.mock.calls[0][0]).not.toBe("2020-01-15");
  });
});
