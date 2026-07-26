import { fireEvent, render, screen } from "@testing-library/react-native";

import { AlertsSheetBody } from "@/features/blocks/components/AlertsSheetBody";
import type { BlockAlert } from "@/types/alert";

function renderSheet(
  overrides: Partial<{
    alerts: BlockAlert[];
    soundEnabled: boolean;
    supported: boolean;
  }> = {},
) {
  const onChangeAlerts = jest.fn();
  const onChangeSound = jest.fn();
  render(
    <AlertsSheetBody
      alerts={overrides.alerts ?? []}
      onChangeAlerts={onChangeAlerts}
      soundEnabled={overrides.soundEnabled ?? true}
      onChangeSound={onChangeSound}
      supported={overrides.supported ?? true}
    />,
  );
  return { onChangeAlerts, onChangeSound };
}

const atStart: BlockAlert = { id: "a1", anchor: "start", offsetMinutes: 0 };

describe("AlertsSheetBody", () => {
  it("says so when a block has no alerts", () => {
    renderSheet();
    expect(screen.getByText("Este bloque no tiene avisos.")).toBeTruthy();
  });

  it("lists an active alert in words", () => {
    renderSheet({ alerts: [atStart] });
    expect(screen.getByText("Empieza ahora.")).toBeTruthy();
  });

  it("adds an alert when its preset is tapped", () => {
    const { onChangeAlerts } = renderSheet();
    fireEvent.press(screen.getByLabelText("10 min antes"));
    expect(onChangeAlerts.mock.calls[0][0]).toEqual([
      expect.objectContaining({ anchor: "start", offsetMinutes: -10 }),
    ]);
  });

  it("adds an end-anchored alert", () => {
    const { onChangeAlerts } = renderSheet();
    fireEvent.press(screen.getByLabelText("Al terminar"));
    expect(onChangeAlerts.mock.calls[0][0]).toEqual([
      expect.objectContaining({ anchor: "end", offsetMinutes: 0 }),
    ]);
  });

  it("removes the alert when an already-set preset is tapped again", () => {
    const { onChangeAlerts } = renderSheet({ alerts: [atStart] });
    fireEvent.press(screen.getByLabelText("Al empezar"));
    expect(onChangeAlerts).toHaveBeenCalledWith([]);
  });

  it("removes an alert from its own row", () => {
    const { onChangeAlerts } = renderSheet({ alerts: [atStart] });
    fireEvent.press(screen.getByLabelText("Quitar aviso: Empieza ahora."));
    expect(onChangeAlerts).toHaveBeenCalledWith([]);
  });

  it("keeps two alerts distinct rather than collapsing them", () => {
    const { onChangeAlerts } = renderSheet({ alerts: [atStart] });
    fireEvent.press(screen.getByLabelText("15 min antes"));
    expect(onChangeAlerts.mock.calls[0][0]).toHaveLength(2);
  });

  it("toggles the sound preference", () => {
    const { onChangeSound } = renderSheet({ soundEnabled: true });
    fireEvent.press(screen.getByLabelText("Silenciar los avisos"));
    expect(onChangeSound).toHaveBeenCalledWith(false);
  });

  it("offers to turn the sound back on when muted", () => {
    const { onChangeSound } = renderSheet({ soundEnabled: false });
    fireEvent.press(screen.getByLabelText("Activar el sonido"));
    expect(onChangeSound).toHaveBeenCalledWith(true);
  });

  it("explains itself on a platform that cannot schedule notifications", () => {
    // The web build can still record the preference; it just cannot fire it.
    renderSheet({ supported: false });
    expect(screen.getByText(/no puede programar avisos/)).toBeTruthy();
  });
});
