/**
 * Theme preference, notifications, stats link, backup/restore, and an
 * optional donation link. A modal, reachable from the fixed header on the
 * day screen.
 */
import { useRouter } from "expo-router";
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
import { donationUrl } from "@/lib/config";
import { useBlockStore } from "@/store/block-store";
import {
  THEME_MODES,
  useThemeStore,
  type ThemeMode,
} from "@/store/theme-store";
import { Card } from "@/ui/Card";
import { ListRow } from "@/ui/ListRow";
import { ModalHeader } from "@/ui/ModalHeader";
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
          iconTint="rose"
          label="Apóyame"
          onPress={() => Linking.openURL(url)}
        />
      </Card>
    </>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
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
      <ModalHeader title="Ajustes" onClose={() => router.back()} />

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: insets.bottom + 40,
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
              iconTint="mint"
              label="Activadas"
              value="Aviso al empezar"
            />
          ) : (
            <ListRow
              icon="bell"
              iconTint="amber"
              label="Activar notificaciones"
              onPress={handleEnableNotifications}
            />
          )}
        </Card>

        <SectionLabel>Tu progreso</SectionLabel>
        <Card>
          <ListRow
            icon="bar-chart-2"
            iconTint="violet"
            label="Ver estadísticas"
            onPress={() => router.push("/stats")}
          />
        </Card>

        <SectionLabel>Tus datos</SectionLabel>
        <Card>
          <ListRow
            icon="upload"
            iconTint="sky"
            label="Exportar respaldo"
            onPress={handleExport}
          />
          <Separator inset />
          <ListRow
            icon="download"
            iconTint="sky"
            label="Restaurar desde archivo"
            onPress={handleRestore}
          />
        </Card>

        {donationUrl ? <SupportLink url={donationUrl} /> : null}
      </ScrollView>
    </View>
  );
}
