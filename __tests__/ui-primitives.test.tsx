/**
 * Behavior tests for the shared primitives in src/ui.
 *
 * These assert the contract screens depend on — that a row is pressable under
 * its label, that selection state is announced, that handlers fire — not the
 * class strings, which are free to change during a restyle.
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { Text } from "react-native";
import { SafeAreaProvider, type Metrics } from "react-native-safe-area-context";

import { Card } from "@/ui/Card";
import { Chip } from "@/ui/Chip";
import { ListRow } from "@/ui/ListRow";
import { ModalHeader } from "@/ui/ModalHeader";
import { SegmentedControl } from "@/ui/SegmentedControl";
import { Separator } from "@/ui/Separator";
import { ToggleCircle } from "@/ui/ToggleCircle";

// useSafeAreaInsets throws without a provider, and the real one measures a
// native view that does not exist under Node. Fixed metrics keep it honest.
const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function withSafeArea(ui: ReactNode) {
  return <SafeAreaProvider initialMetrics={METRICS}>{ui}</SafeAreaProvider>;
}

describe("ListRow", () => {
  it("renders its label and a string value", () => {
    render(<ListRow label="Horario" value="09:00 – 10:00" />);

    expect(screen.getByText("Horario")).toBeTruthy();
    expect(screen.getByText("09:00 – 10:00")).toBeTruthy();
  });

  it("renders a node value as-is", () => {
    render(<ListRow label="Color" value={<Text>swatch</Text>} />);

    expect(screen.getByText("swatch")).toBeTruthy();
  });

  it("is pressable under its label", () => {
    const onPress = jest.fn();
    render(<ListRow label="Ver estadísticas" onPress={onPress} />);

    fireEvent.press(screen.getByLabelText("Ver estadísticas"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("exposes no button when it has no handler", () => {
    render(<ListRow label="Activadas" />);

    expect(screen.queryByLabelText("Activadas")).toBeNull();
    expect(screen.getByText("Activadas")).toBeTruthy();
  });

  it("prefers an explicit accessibility label over the visible one", () => {
    const onPress = jest.fn();
    render(
      <ListRow
        label="Repetir"
        value="Todos los días"
        accessibilityLabel="Repetir, todos los días"
        onPress={onPress}
      />,
    );

    fireEvent.press(screen.getByLabelText("Repetir, todos los días"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe("SegmentedControl", () => {
  const OPTIONS = [
    { value: "system", label: "Sistema" },
    { value: "light", label: "Claro" },
    { value: "dark", label: "Oscuro" },
  ] as const;

  it("marks only the active option as selected", () => {
    render(
      <SegmentedControl options={OPTIONS} value="dark" onChange={jest.fn()} />,
    );

    expect(
      screen.getByLabelText("Oscuro").props.accessibilityState.selected,
    ).toBe(true);
    expect(
      screen.getByLabelText("Claro").props.accessibilityState.selected,
    ).toBe(false);
  });

  it("reports the newly chosen value", () => {
    const onChange = jest.fn();
    render(
      <SegmentedControl options={OPTIONS} value="dark" onChange={onChange} />,
    );

    fireEvent.press(screen.getByLabelText("Claro"));

    expect(onChange).toHaveBeenCalledWith("light");
  });
});

describe("Chip", () => {
  it("announces its selection state", () => {
    render(
      <Chip label="Enfoque" selected onPress={jest.fn()} dotColor="sky" />,
    );

    expect(
      screen.getByLabelText("Enfoque").props.accessibilityState.selected,
    ).toBe(true);
  });

  it("fires on press", () => {
    const onPress = jest.fn();
    render(<Chip label="30" selected={false} onPress={onPress} />);

    fireEvent.press(screen.getByLabelText("30"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe("ToggleCircle", () => {
  it("is a checkbox so multi-select is announced correctly", () => {
    render(
      <ToggleCircle
        label="L"
        selected
        onPress={jest.fn()}
        accessibilityLabel="Lunes"
      />,
    );

    const toggle = screen.getByLabelText("Lunes");
    expect(toggle.props.accessibilityRole).toBe("checkbox");
    expect(toggle.props.accessibilityState.checked).toBe(true);
  });
});

describe("ModalHeader", () => {
  it("renders the title and subtitle", () => {
    render(
      withSafeArea(
        <ModalHeader
          title="Editar bloque"
          subtitle="Mañana"
          onClose={jest.fn()}
        />,
      ),
    );

    expect(screen.getByText("Editar bloque")).toBeTruthy();
    expect(screen.getByText("Mañana")).toBeTruthy();
  });

  it("wires close and confirm independently", () => {
    const onClose = jest.fn();
    const onConfirm = jest.fn();
    render(
      withSafeArea(
        <ModalHeader
          title="Nuevo bloque"
          onClose={onClose}
          onConfirm={onConfirm}
        />,
      ),
    );

    fireEvent.press(screen.getByLabelText("Cerrar"));
    fireEvent.press(screen.getByLabelText("Guardar"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("omits the confirm control when no handler is given", () => {
    render(withSafeArea(<ModalHeader title="Ajustes" onClose={jest.fn()} />));

    expect(screen.queryByLabelText("Guardar")).toBeNull();
  });
});

describe("Card", () => {
  it("renders its rows and separators together", () => {
    render(
      <Card>
        <ListRow label="Exportar respaldo" onPress={jest.fn()} />
        <Separator inset />
        <ListRow label="Restaurar desde archivo" onPress={jest.fn()} />
      </Card>,
    );

    expect(screen.getByText("Exportar respaldo")).toBeTruthy();
    expect(screen.getByText("Restaurar desde archivo")).toBeTruthy();
  });
});
