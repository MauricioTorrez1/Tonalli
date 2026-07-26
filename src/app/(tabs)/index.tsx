/**
 * The day view — the app's home. A week strip to choose the day, and the
 * timeline of that day's blocks below it.
 *
 * The add button is not here: it lives in the floating tab bar, alongside the
 * tabs, so it cannot be knocked out of position by this screen's layout. See
 * features/navigation/components/FloatingTabBar.tsx.
 */
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DayTimeline } from "@/features/timeline/components/DayTimeline";
import { WeekStrip } from "@/features/timeline/components/WeekStrip";
import { useDayBlocks } from "@/features/timeline/hooks/useDayBlocks";
import { dayHeading, todayString } from "@/lib/date";
import { useSelectedDayStore } from "@/store/selected-day-store";
import { PressableScale } from "@/ui/PressableScale";

export default function DayScreen() {
  const insets = useSafeAreaInsets();
  const today = todayString();
  const selectedDay = useSelectedDayStore((state) => state.selectedDay);
  const setSelectedDay = useSelectedDayStore((state) => state.setSelectedDay);
  const blocks = useDayBlocks(selectedDay);

  return (
    <View className="flex-1 bg-cream dark:bg-night">
      {/* Fixed header: the day's name is the screen title, the way the
          reference puts a large title above a grouped list. It stays put while
          the timeline scrolls under it. */}
      <View
        className="flex-row items-end justify-between px-5 pb-1"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Text className="font-lora-semibold text-4xl text-ink dark:text-ink-inverse">
          {dayHeading(selectedDay, today)}
        </Text>
        {selectedDay !== today ? (
          <PressableScale
            onPress={() => setSelectedDay(today)}
            accessibilityRole="button"
            accessibilityLabel="Volver a hoy"
            className="mb-2 rounded-full bg-sand px-3 py-1.5 dark:bg-nightSurface"
          >
            <Text className="font-raleway-semibold text-xs text-accent">
              Hoy
            </Text>
          </PressableScale>
        ) : null}
      </View>

      <View className="mt-2">
        <WeekStrip selectedDay={selectedDay} onSelectDay={setSelectedDay} />
      </View>

      <DayTimeline day={selectedDay} blocks={blocks} />
    </View>
  );
}
