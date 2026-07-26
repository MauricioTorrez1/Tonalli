/**
 * Simple stats: current streak and time-by-category over the last 7 days.
 * Deliberately calm, not gamified — no red "streak broken" warnings, no
 * pressure copy. See docs/adr/0004-focus-first-design-for-attention.md.
 */
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DEFAULT_CATEGORIES } from "@/features/categories/default-categories";
import { TAB_BAR_CLEARANCE } from "@/features/navigation/tab-bar-metrics";
import {
  currentStreak,
  minutesByCategory,
  UNCATEGORIZED,
} from "@/features/stats/utils/stats";
import { addDays, formatDuration, todayString } from "@/lib/date";
import { useBlockStore } from "@/store/block-store";
import { NEUTRAL_BLOCK_COLOR } from "@/theme/colors";
import { Card } from "@/ui/Card";

const RANGE_DAYS = 7;

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const completions = useBlockStore((state) => state.completions);
  const blocks = useBlockStore((state) => state.blocks);

  const today = todayString();
  const streak = currentStreak(completions, today);
  const sinceDay = addDays(today, -(RANGE_DAYS - 1));
  const totals = minutesByCategory(completions, blocks, sinceDay);

  const categoryRows = DEFAULT_CATEGORIES.map((category) => ({
    id: category.id,
    name: category.name,
    color: category.color,
    minutes: totals[category.id] ?? 0,
  }));
  const uncategorizedRow = {
    id: UNCATEGORIZED,
    name: "Sin categoría",
    color: NEUTRAL_BLOCK_COLOR,
    minutes: totals[UNCATEGORIZED] ?? 0,
  };
  const rows = [...categoryRows, uncategorizedRow]
    .filter((row) => row.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);

  const maxMinutes = Math.max(...rows.map((row) => row.minutes), 1);

  return (
    <View className="flex-1 bg-cream dark:bg-night">
      <View className="px-5 pb-2" style={{ paddingTop: insets.top + 8 }}>
        <Text className="font-lora-semibold text-4xl text-ink dark:text-ink-inverse">
          Progreso
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: insets.bottom + TAB_BAR_CLEARANCE + 16,
        }}
      >
        <Card className="p-5">
          <Text className="font-raleway-medium text-sm text-ink-soft dark:text-ink-invsoft">
            Racha actual
          </Text>
          <Text className="mt-1 font-lora-semibold text-3xl text-ink dark:text-ink-inverse">
            {streak} {streak === 1 ? "día" : "días"}
          </Text>
        </Card>

        <Text className="mb-2 ml-1 mt-8 font-raleway-semibold text-sm text-ink-soft dark:text-ink-invsoft">
          Tiempo por categoría · últimos 7 días
        </Text>

        {rows.length === 0 ? (
          <Text className="ml-1 font-raleway text-ink-muted dark:text-ink-invmuted">
            Completa un bloque para ver tus estadísticas aquí.
          </Text>
        ) : (
          <Card className="px-4 py-2">
            {rows.map((row) => (
              <View key={row.id} className="py-3">
                <View className="mb-2 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: row.color }}
                    />
                    <Text className="font-raleway-medium text-sm text-ink dark:text-ink-inverse">
                      {row.name}
                    </Text>
                  </View>
                  <Text className="font-raleway-medium text-sm text-ink-soft dark:text-ink-invsoft">
                    {formatDuration(row.minutes)}
                  </Text>
                </View>
                <View className="h-2 overflow-hidden rounded-full bg-sand dark:bg-nightRaised">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${(row.minutes / maxMinutes) * 100}%`,
                      backgroundColor: row.color,
                    }}
                  />
                </View>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}
