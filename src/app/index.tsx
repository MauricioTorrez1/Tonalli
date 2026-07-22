import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DayTimeline } from "@/features/timeline/components/DayTimeline";
import { useDayBlocks } from "@/features/timeline/hooks/useDayBlocks";
import { todayString } from "@/lib/date";
import { useThemeColors } from "@/theme/useThemeColors";

export default function DayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const today = todayString();
  const blocks = useDayBlocks(today);

  return (
    <View className="flex-1 bg-cream dark:bg-night">
      {/* Fixed header: stays reachable even while the timeline scrolls. */}
      <View
        className="flex-row items-center justify-between px-5"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Text className="font-raleway-medium text-sm text-ink-soft dark:text-ink-invsoft">
          Tonalli
        </Text>
        <Pressable
          onPress={() => router.push("/settings")}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Ajustes"
        >
          <Feather name="settings" size={20} color={themeColors.icon} />
        </Pressable>
      </View>

      <DayTimeline blocks={blocks} heading="Hoy" />

      {/* The single clear call to action: add a block. */}
      <Pressable
        onPress={() => router.push("/block-form")}
        accessibilityRole="button"
        accessibilityLabel="Crear bloque"
        className="absolute right-6 h-14 w-14 items-center justify-center rounded-full bg-category-sky-solid shadow-lg"
        style={{ bottom: insets.bottom + 24 }}
      >
        <Feather name="plus" size={26} color="white" />
      </Pressable>
    </View>
  );
}
