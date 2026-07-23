/**
 * Theme preference, notifications, stats link, backup/restore, and an
 * optional donation link. A modal, reachable from the fixed header on the
 * day screen.
 */
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { buildBackup } from "@/features/backup/utils/backup";
import { exportBackup, pickBackupFile } from "@/features/backup/io";
import {
  checkPermission,
  requestPermission,
  scheduleForBlock,
} from "@/features/notifications/schedule";
import { donationUrl } from "@/lib/config";
import { useBlockStore } from "@/store/block-store";
import {
  THEME_MODES,
  useThemeStore,
  type ThemeMode,
} from "@/store/theme-store";
import { useThemeColors } from "@/theme/useThemeColors";

const MODE_LABELS: Record<ThemeMode, string> = {
  system: "Sistema",
  light: "Claro",
  dark: "Oscuro",
};

/** A tappable row used throughout this screen — label, optional detail, chevron. */
function SettingsRow({
  label,
  onPress,
  destructive,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const themeColors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between py-3"
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text
        className={`font-raleway-medium text-sm ${
          destructive
            ? "text-terracotta-600 dark:text-terracotta-300"
            : "text-ink dark:text-ink-inverse"
        }`}
      >
        {label}
      </Text>
      <Feather name="chevron-right" size={16} color={themeColors.icon} />
    </Pressable>
  );
}

/** Separate component so `url` is a required prop, not a narrowed closure. */
function SupportLink({ url }: { url: string }) {
  return (
    <>
      <Text className="mb-1 mt-8 font-raleway-semibold text-sm text-ink-soft dark:text-ink-invsoft">
        TonalliBlock
      </Text>
      <SettingsRow label="Apóyame ☕" onPress={() => Linking.openURL(url)} />
    </>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
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
    checkPermission().then(setNotificationsGranted);
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
      <View
        className="flex-row items-center justify-between px-5"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Text className="font-raleway-semibold text-base text-ink dark:text-ink-inverse">
          Ajustes
        </Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        >
          <Feather name="x" size={22} color={themeColors.icon} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: insets.bottom + 40,
        }}
      >
        <Text className="mb-3 font-raleway-semibold text-sm text-ink-soft dark:text-ink-invsoft">
          Apariencia
        </Text>
        <View className="flex-row gap-2">
          {THEME_MODES.map((option) => (
            <Pressable
              key={option}
              onPress={() => setMode(option)}
              className={`flex-1 items-center rounded-card border py-3 ${
                mode === option
                  ? "border-category-sky-solid bg-category-sky-solid"
                  : "border-sand dark:border-nightRaised"
              }`}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === option }}
              accessibilityLabel={MODE_LABELS[option]}
            >
              <Text
                className={`font-raleway-medium text-sm ${
                  mode === option
                    ? "text-white"
                    : "text-ink dark:text-ink-inverse"
                }`}
              >
                {MODE_LABELS[option]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="mb-1 mt-8 font-raleway-semibold text-sm text-ink-soft dark:text-ink-invsoft">
          Notificaciones
        </Text>
        {notificationsGranted ? (
          <Text className="py-3 font-raleway text-sm text-ink dark:text-ink-inverse">
            Activadas. Recibirás un aviso al empezar cada bloque.
          </Text>
        ) : (
          <SettingsRow
            label="Activar notificaciones"
            onPress={handleEnableNotifications}
          />
        )}

        <Text className="mb-1 mt-8 font-raleway-semibold text-sm text-ink-soft dark:text-ink-invsoft">
          Tu progreso
        </Text>
        <SettingsRow
          label="Ver estadísticas"
          onPress={() => router.push("/stats")}
        />

        <Text className="mb-1 mt-8 font-raleway-semibold text-sm text-ink-soft dark:text-ink-invsoft">
          Tus datos
        </Text>
        <SettingsRow label="Exportar respaldo" onPress={handleExport} />
        <SettingsRow label="Restaurar desde archivo" onPress={handleRestore} />

        {donationUrl ? <SupportLink url={donationUrl} /> : null}
      </ScrollView>
    </View>
  );
}
