import { fireEvent, render, screen } from "@testing-library/react-native";

import { TimeWheel } from "@/ui/TimeWheel";

/** The wheel's row height, mirrored from the component. */
const ROW_HEIGHT = 40;

/** A scroll event whose offset lands on `index`. */
function scrollTo(index: number) {
  return { nativeEvent: { contentOffset: { y: index * ROW_HEIGHT } } };
}

describe("TimeWheel", () => {
  it("commits a value when the scroll settles with momentum", () => {
    const onChange = jest.fn();
    render(
      <TimeWheel
        minute={540} // 09:00
        onChange={onChange}
        accessibilityLabel="Hora de inicio"
      />,
    );

    fireEvent(
      screen.getByLabelText("Horas"),
      "momentumScrollEnd",
      scrollTo(11),
    );
    expect(onChange).toHaveBeenCalledWith(11 * 60);
  });

  it("commits a value when the drag ends without momentum", () => {
    // The bug this covers: a slow release fires only onScrollEndDrag, so with
    // momentum as the sole handler the column parked on a value it never
    // reported and picking a time appeared to do nothing.
    const onChange = jest.fn();
    render(
      <TimeWheel
        minute={540}
        onChange={onChange}
        accessibilityLabel="Hora de inicio"
      />,
    );

    fireEvent(screen.getByLabelText("Horas"), "scrollEndDrag", scrollTo(7));
    expect(onChange).toHaveBeenCalledWith(7 * 60);
  });

  it("does not fire when the column settles back on its current value", () => {
    const onChange = jest.fn();
    render(
      <TimeWheel
        minute={540}
        onChange={onChange}
        accessibilityLabel="Hora de inicio"
      />,
    );

    fireEvent(screen.getByLabelText("Horas"), "momentumScrollEnd", scrollTo(9));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clamps an overscroll to the last row", () => {
    const onChange = jest.fn();
    render(
      <TimeWheel
        minute={540}
        onChange={onChange}
        accessibilityLabel="Hora de inicio"
      />,
    );

    fireEvent(
      screen.getByLabelText("Horas"),
      "momentumScrollEnd",
      scrollTo(99),
    );
    expect(onChange).toHaveBeenCalledWith(23 * 60);
  });

  it("keeps the hour when the minute column moves", () => {
    const onChange = jest.fn();
    render(
      <TimeWheel
        minute={540} // 09:00
        onChange={onChange}
        accessibilityLabel="Hora de inicio"
      />,
    );

    // Third row of a 5-minute column is :10.
    fireEvent(
      screen.getByLabelText("Minutos"),
      "momentumScrollEnd",
      scrollTo(2),
    );
    expect(onChange).toHaveBeenCalledWith(550);
  });

  it("snaps a value off the step grid onto the nearest row", () => {
    const onChange = jest.fn();
    render(
      <TimeWheel
        minute={547} // 09:07 — not on the 5-minute grid
        onChange={onChange}
        accessibilityLabel="Hora de inicio"
      />,
    );

    // The minute column should already be sitting on :05, so settling there
    // again is a no-op rather than a new value.
    fireEvent(
      screen.getByLabelText("Minutos"),
      "momentumScrollEnd",
      scrollTo(1),
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it("respects a coarser minute step", () => {
    const onChange = jest.fn();
    render(
      <TimeWheel
        minute={540}
        minuteStep={15}
        onChange={onChange}
        accessibilityLabel="Hora de inicio"
      />,
    );

    fireEvent(
      screen.getByLabelText("Minutos"),
      "momentumScrollEnd",
      scrollTo(2),
    );
    expect(onChange).toHaveBeenCalledWith(570); // 09:30
  });
});
