/**
 * Theme preference and notification permission status. A modal, reachable
 * from the fixed header on the day screen.
 */
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  checkPermission,
  requestPermission,
} from "@/features/notifications/schedule";
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

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const [notificationsGranted, setNotificationsGranted] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    checkPermission().then(setNotificationsGranted);
  }, []);

  async function handleEnableNotifications() {
    const granted = await requestPermission();
    setNotificationsGranted(granted);
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

      <View className="px-5 pt-8">
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

        <Text className="mb-3 mt-8 font-raleway-semibold text-sm text-ink-soft dark:text-ink-invsoft">
          Notificaciones
        </Text>
        {notificationsGranted ? (
          <Text className="font-raleway text-sm text-ink dark:text-ink-inverse">
            Activadas. Recibirás un aviso al empezar cada bloque.
          </Text>
        ) : (
          <Pressable
            onPress={handleEnableNotifications}
            className="items-start"
            accessibilityRole="button"
            accessibilityLabel="Activar notificaciones"
          >
            <Text className="font-raleway-medium text-sm text-category-sky-solid">
              Activar notificaciones
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
