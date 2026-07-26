/**
 * Theme preference, notifications, backup/restore, and an optional donation
 * link. A tab, not a modal: these are things the user dips into and comes back
 * from, and a modal would make each visit feel like leaving the app.
 */
import { useEffect, useState } from "react";
import { Alert, Linking, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { buildBackup } from "@/features/backup/utils/backup";
import { exportBackup, pickBackupFile } from "@/features/backup/io";
import {
  checkPermission,
  requestPermission,
  scheduleForBlock,
  supportsScheduledNotifications,
} from "@/features/notifications/schedule";
import { TAB_BAR_CLEARANCE } from "@/features/navigation/tab-bar-metrics";
import { donationUrl } from "@/lib/config";
import { useBlockStore } from "@/store/block-store";
import {
  THEME_MODES,
  useThemeStore,
  type ThemeMode,
} from "@/store/theme-store";
import { palette } from "@/theme/colors";
import { Card } from "@/ui/Card";
import { ListRow } from "@/ui/ListRow";
import { SegmentedControl } from "@/ui/SegmentedControl";
import { Separator } from "@/ui/Separator";

const MODE_LABELS: Record<ThemeMode, string> = {
  system: "Sistema",
  light: "Claro",
  dark: "Oscuro",
};

const THEME_OPTIONS = THEME_MODES.map((mode) => ({
  value: mode,
  label: MODE_LABELS[mode],
}));

/** The small gray heading above each group of rows. */
function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="mb-2 ml-1 mt-8 font-raleway-semibold text-sm text-ink-soft dark:text-ink-invsoft">
      {children}
    </Text>
  );
}

/** Separate component so `url` is a required prop, not a narrowed closure. */
function SupportLink({ url }: { url: string }) {
  return (
    <>
      <SectionLabel>TonalliBlock</SectionLabel>
      <Card>
        <ListRow
          icon="coffee"
          iconTint="#E8739A"
          label="Apóyame"
          onPress={() => Linking.openURL(url)}
        />
      </Card>
    </>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const [notificationsGranted, setNotificationsGranted] = useState<
    boolean | null
  >(null);

  const blocks = useBlockStore((state) => state.blocks);
  const recurrences = useBlockStore((state) => state.recurrences);
  const completions = useBlockStore((state) => state.completions);
  const restoreBackup = useBlockStore((state) => state.restoreBackup);
  const setNotificationIds = useBlockStore((state) => state.setNotificationIds);

  useEffect(() => {
    if (supportsScheduledNotifications) {
      checkPermission().then(setNotificationsGranted);
    }
  }, []);

  async function handleEnableNotifications() {
    const granted = await requestPermission();
    setNotificationsGranted(granted);
  }

  async function handleExport() {
    const backup = buildBackup(blocks, recurrences, completions, Date.now());
    const shared = await exportBackup(backup);
    if (!shared) {
      Alert.alert(
        "No se pudo compartir",
        "Este dispositivo no tiene una forma de compartir archivos disponible.",
      );
    }
  }

  async function handleRestore() {
    const backup = await pickBackupFile();
    if (!backup) {
      Alert.alert(
        "No se pudo leer el archivo",
        "Verifica que sea un respaldo válido de TonalliBlock.",
      );
      return;
    }
    Alert.alert(
      "Restaurar datos",
      "Esto reemplazará todos tus bloques actuales por los del archivo.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Restaurar",
          style: "destructive",
          onPress: async () => {
            restoreBackup(backup);
            const granted = await requestPermission();
            if (!granted) {
              return;
            }
            // Re-schedule notifications: the restored ids belonged to
            // whatever device made the backup and mean nothing here.
            for (const block of backup.blocks) {
              const recurrence = block.recurrenceId
                ? backup.recurrences.find((r) => r.id === block.recurrenceId)
                : undefined;
              const ids = await scheduleForBlock(block, recurrence, new Date());
              setNotificationIds(block.id, ids);
            }
          },
        },
      ],
    );
  }

  return (
    <View className="flex-1 bg-cream dark:bg-night">
      <View className="px-5 pb-2" style={{ paddingTop: insets.top + 8 }}>
        <Text className="font-lora-semibold text-4xl text-ink dark:text-ink-inverse">
          Ajustes
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: insets.bottom + TAB_BAR_CLEARANCE + 16,
        }}
      >
        <Text className="mb-2 ml-1 font-raleway-semibold text-sm text-ink-soft dark:text-ink-invsoft">
          Apariencia
        </Text>
        <SegmentedControl
          options={THEME_OPTIONS}
          value={mode}
          onChange={setMode}
          accessibilityLabel="Tema de la aplicación"
        />

        <SectionLabel>Notificaciones</SectionLabel>
        <Card>
          {!supportsScheduledNotifications ? (
            <Text className="px-4 py-3 font-raleway text-sm text-ink-muted dark:text-ink-invmuted">
              No disponibles en la versión web — instala la app en tu teléfono
              para recibir avisos.
            </Text>
          ) : notificationsGranted ? (
            <ListRow
              icon="bell"
              label="Activadas"
              value="Se avisará según cada bloque"
            />
          ) : (
            <ListRow
              icon="bell"
              iconTint="#E5A64B"
              label="Activar notificaciones"
              onPress={handleEnableNotifications}
            />
          )}
        </Card>

        <SectionLabel>Tus datos</SectionLabel>
        <Card>
          <ListRow
            icon="upload"
            iconTint={palette.accent.dim}
            label="Exportar respaldo"
            onPress={handleExport}
          />
          <Separator inset />
          <ListRow
            icon="download"
            iconTint={palette.accent.dim}
            label="Restaurar desde archivo"
            onPress={handleRestore}
          />
        </Card>

        {donationUrl ? <SupportLink url={donationUrl} /> : null}
      </ScrollView>
    </View>
  );
}
