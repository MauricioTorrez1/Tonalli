import { fireEvent, render, screen } from "@testing-library/react-native";

import { SubtaskList } from "@/features/blocks/components/SubtaskList";
import type { Subtask } from "@/types/subtask";

function makeSubtask(overrides: Partial<Subtask> = {}): Subtask {
  return { id: "s1", title: "Comprar leche", done: false, ...overrides };
}

describe("SubtaskList", () => {
  it("renders each subtask's title", () => {
    render(
      <SubtaskList
        subtasks={[
          makeSubtask(),
          makeSubtask({ id: "s2", title: "Pagar luz" }),
        ]}
        onChange={jest.fn()}
      />,
    );
    expect(screen.getByDisplayValue("Comprar leche")).toBeTruthy();
    expect(screen.getByDisplayValue("Pagar luz")).toBeTruthy();
  });

  it("appends a subtask when the add field is submitted", () => {
    const onChange = jest.fn();
    render(<SubtaskList subtasks={[]} onChange={onChange} />);

    const field = screen.getByLabelText("Agregar subtarea");
    fireEvent.changeText(field, "Regar plantas");
    fireEvent(field, "submitEditing");

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toEqual([
      expect.objectContaining({ title: "Regar plantas", done: false }),
    ]);
  });

  it("ignores a blank submission rather than adding an empty row", () => {
    const onChange = jest.fn();
    render(<SubtaskList subtasks={[]} onChange={onChange} />);

    const field = screen.getByLabelText("Agregar subtarea");
    fireEvent.changeText(field, "   ");
    fireEvent(field, "submitEditing");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("trims the title it stores", () => {
    const onChange = jest.fn();
    render(<SubtaskList subtasks={[]} onChange={onChange} />);

    const field = screen.getByLabelText("Agregar subtarea");
    fireEvent.changeText(field, "  Llamar al doctor  ");
    fireEvent(field, "submitEditing");

    expect(onChange.mock.calls[0][0][0].title).toBe("Llamar al doctor");
  });

  it("toggles a subtask's done flag without touching the others", () => {
    const onChange = jest.fn();
    render(
      <SubtaskList
        subtasks={[
          makeSubtask(),
          makeSubtask({ id: "s2", title: "Pagar luz" }),
        ]}
        onChange={onChange}
      />,
    );

    fireEvent.press(screen.getByLabelText("Marcar Comprar leche como hecha"));

    expect(onChange.mock.calls[0][0]).toEqual([
      expect.objectContaining({ id: "s1", done: true }),
      expect.objectContaining({ id: "s2", done: false }),
    ]);
  });

  it("removes a subtask", () => {
    const onChange = jest.fn();
    render(
      <SubtaskList
        subtasks={[
          makeSubtask(),
          makeSubtask({ id: "s2", title: "Pagar luz" }),
        ]}
        onChange={onChange}
      />,
    );

    fireEvent.press(screen.getByLabelText("Eliminar subtarea Comprar leche"));

    expect(onChange.mock.calls[0][0]).toEqual([
      expect.objectContaining({ id: "s2" }),
    ]);
  });

  it("renames a subtask in place", () => {
    const onChange = jest.fn();
    render(<SubtaskList subtasks={[makeSubtask()]} onChange={onChange} />);

    fireEvent.changeText(
      screen.getByLabelText("Subtarea: Comprar leche"),
      "Comprar pan",
    );

    expect(onChange.mock.calls[0][0][0].title).toBe("Comprar pan");
  });

  it("summarises progress once there are subtasks", () => {
    render(
      <SubtaskList
        subtasks={[
          makeSubtask({ done: true }),
          makeSubtask({ id: "s2", title: "Pagar luz" }),
        ]}
        onChange={jest.fn()}
      />,
    );
    expect(screen.getByText(/1 de\s+2 completadas/)).toBeTruthy();
  });

  it("shows no progress line for an empty list", () => {
    render(<SubtaskList subtasks={[]} onChange={jest.fn()} />);
    expect(screen.queryByText(/completadas/)).toBeNull();
  });
});
