import "../global.css";

import { Lora_500Medium, Lora_600SemiBold } from "@expo-google-fonts/lora";
import {
  Raleway_400Regular,
  Raleway_500Medium,
  Raleway_600SemiBold,
  Raleway_700Bold,
  useFonts,
} from "@expo-google-fonts/raleway";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { colorScheme, useColorScheme } from "nativewind";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ensureNotificationChannel } from "@/features/notifications/schedule";
import { useBlockStore } from "@/store/block-store";
import { useThemeStore } from "@/store/theme-store";

SplashScreen.preventAutoHideAsync();
ensureNotificationChannel();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Lora_500Medium,
    Lora_600SemiBold,
    Raleway_400Regular,
    Raleway_500Medium,
    Raleway_600SemiBold,
    Raleway_700Bold,
  });

  const blockHydrated = useBlockStore((state) => state.hasHydrated);
  const seedIfEmpty = useBlockStore((state) => state.seedIfEmpty);

  const themeMode = useThemeStore((state) => state.mode);
  const themeHydrated = useThemeStore((state) => state.hasHydrated);
  // Keeps NativeWind's `dark:` variant in sync with the user's saved preference.
  useColorScheme();

  useEffect(() => {
    if (themeHydrated) {
      colorScheme.set(themeMode);
    }
  }, [themeHydrated, themeMode]);

  // Once persisted data has loaded, fill an empty store with sample blocks.
  useEffect(() => {
    if (blockHydrated) {
      seedIfEmpty();
    }
  }, [blockHydrated, seedIfEmpty]);

  const ready = (fontsLoaded || !!fontError) && blockHydrated && themeHydrated;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen
          name="block-form"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="settings"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="stats"
          options={{ presentation: "modal", headerShown: false }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
