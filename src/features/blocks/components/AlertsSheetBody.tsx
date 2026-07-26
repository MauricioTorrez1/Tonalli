/**
 * Contents of the "Alertas" sheet: which reminders a block fires, and whether
 * they make a sound.
 *
 * Reminders used to be implicit — every block got exactly one, at its start,
 * and there was no way to ask for anything else. For a block you need to
 * *prepare* for, a heads-up beforehand is the only useful reminder, and for a
 * timeboxed one the useful signal is when it ends. Both are now sayable.
 */
import { Feather } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { uuidv4 } from "@/lib/id";
import { describeAlert } from "@/features/notifications/triggers";
import { useThemeColors } from "@/theme/useThemeColors";
import { Card } from "@/ui/Card";
import { Chip } from "@/ui/Chip";
import { ListRow } from "@/ui/ListRow";
import { PressableScale } from "@/ui/PressableScale";
import { Separator } from "@/ui/Separator";
import type { BlockAlert } from "@/types/alert";

/**
 * The reminders people actually set, in the order they are most often wanted.
 * A free "minutes before" field would be more expressive and, in practice,
 * another decision to make while trying to schedule something.
 */
const ALERT_PRESETS: readonly {
  label: string;
  alert: Omit<BlockAlert, "id">;
}[] = [
  { label: "Al empezar", alert: { anchor: "start", offsetMinutes: 0 } },
  { label: "5 min antes", alert: { anchor: "start", offsetMinutes: -5 } },
  { label: "10 min antes", alert: { anchor: "start", offsetMinutes: -10 } },
  { label: "15 min antes", alert: { anchor: "start", offsetMinutes: -15 } },
  { label: "30 min antes", alert: { anchor: "start", offsetMinutes: -30 } },
  { label: "1 h antes", alert: { anchor: "start", offsetMinutes: -60 } },
  { label: "Al terminar", alert: { anchor: "end", offsetMinutes: 0 } },
];

interface AlertsSheetBodyProps {
  alerts: BlockAlert[];
  onChangeAlerts: (alerts: BlockAlert[]) => void;
  soundEnabled: boolean;
  onChangeSound: (enabled: boolean) => void;
  /** False on web, where scheduled notifications do not exist. */
  supported: boolean;
}

/** Two alerts are the same reminder if they resolve to the same moment. */
function isSameMoment(a: Omit<BlockAlert, "id">, b: BlockAlert): boolean {
  return a.anchor === b.anchor && a.offsetMinutes === b.offsetMinutes;
}

/**
 * Renders the active alerts, the presets to add more, and the sound toggle.
 *
 * @param alerts - Alerts currently set on the block.
 * @param onChangeAlerts - Called with the full new list.
 * @param soundEnabled - Whether the block's alerts make a sound.
 * @param onChangeSound - Called with the new sound preference.
 * @param supported - Whether this platform can schedule notifications at all.
 */
export function AlertsSheetBody({
  alerts,
  onChangeAlerts,
  soundEnabled,
  onChangeSound,
  supported,
}: AlertsSheetBodyProps) {
  const themeColors = useThemeColors();

  function togglePreset(preset: Omit<BlockAlert, "id">) {
    const existing = alerts.find((alert) => isSameMoment(preset, alert));
    if (existing) {
      onChangeAlerts(alerts.filter((alert) => alert.id !== existing.id));
      return;
    }
    onChangeAlerts([...alerts, { ...preset, id: uuidv4() }]);
  }

  return (
    <View className="px-5">
      {!supported ? (
        <Text className="mb-4 font-raleway text-sm text-ink-muted dark:text-ink-invmuted">
          La versión web no puede programar avisos. Puedes configurarlos aquí y
          sonarán cuando abras el bloque en tu teléfono.
        </Text>
      ) : null}

      {alerts.length === 0 ? (
        <Text className="mb-4 font-raleway text-sm text-ink-muted dark:text-ink-invmuted">
          Este bloque no tiene avisos.
        </Text>
      ) : (
        <Card className="mb-4">
          {alerts.map((alert, index) => (
            <View key={alert.id}>
              {index > 0 ? <Separator inset /> : null}
              <View className="flex-row items-center gap-3 px-4 py-3">
                <Feather name="bell" size={16} color={themeColors.icon} />
                <Text className="flex-1 font-raleway-medium text-base text-ink dark:text-ink-inverse">
                  {describeAlert(alert)}
                </Text>
                <PressableScale
                  onPress={() =>
                    onChangeAlerts(alerts.filter((a) => a.id !== alert.id))
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar aviso: ${describeAlert(alert)}`}
                  className="p-1"
                >
                  <Feather name="x" size={16} color={themeColors.icon} />
                </PressableScale>
              </View>
            </View>
          ))}
        </Card>
      )}

      <Text className="mb-2 ml-1 font-raleway-semibold text-sm text-ink-soft dark:text-ink-invsoft">
        Agregar aviso
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {ALERT_PRESETS.map((preset) => (
          <Chip
            key={preset.label}
            label={preset.label}
            selected={alerts.some((alert) => isSameMoment(preset.alert, alert))}
            onPress={() => togglePreset(preset.alert)}
          />
        ))}
      </View>

      <Card className="mt-6">
        <ListRow
          icon={soundEnabled ? "volume-2" : "volume-x"}
          label="Sonido"
          value={soundEnabled ? "Activado" : "Silencio"}
          showChevron={false}
          onPress={() => onChangeSound(!soundEnabled)}
          accessibilityLabel={
            soundEnabled ? "Silenciar los avisos" : "Activar el sonido"
          }
        />
      </Card>
    </View>
  );
}
