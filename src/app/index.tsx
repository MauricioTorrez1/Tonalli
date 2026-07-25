import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DayTimeline } from "@/features/timeline/components/DayTimeline";
import { WeekStrip } from "@/features/timeline/components/WeekStrip";
import { useDayBlocks } from "@/features/timeline/hooks/useDayBlocks";
import { dayHeading, todayString, type DayString } from "@/lib/date";
import { useThemeColors } from "@/theme/useThemeColors";
import { PressableScale } from "@/ui/PressableScale";

export default function DayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const today = todayString();
  const [selectedDay, setSelectedDay] = useState<DayString>(today);
  const blocks = useDayBlocks(selectedDay);

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
        <View className="flex-row items-center gap-4">
          {selectedDay !== today ? (
            <Pressable
              onPress={() => setSelectedDay(today)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Volver a hoy"
            >
              <Text className="font-raleway-semibold text-sm text-category-sky-solid">
                Hoy
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => router.push("/settings")}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Ajustes"
          >
            <Feather name="settings" size={20} color={themeColors.icon} />
          </Pressable>
        </View>
      </View>

      <View className="mt-3">
        <WeekStrip selectedDay={selectedDay} onSelectDay={setSelectedDay} />
      </View>

      <DayTimeline
        day={selectedDay}
        blocks={blocks}
        heading={dayHeading(selectedDay, today)}
      />

      {/* The single clear call to action: add a block. */}
      <PressableScale
        onPress={() =>
          router.push({ pathname: "/block-form", params: { day: selectedDay } })
        }
        accessibilityRole="button"
        accessibilityLabel="Crear bloque"
        className="absolute right-6 h-14 w-14 items-center justify-center rounded-full bg-category-sky-solid shadow-lg"
        style={{ bottom: insets.bottom + 24 }}
      >
        <Feather name="plus" size={26} color="white" />
      </PressableScale>
    </View>
  );
}
