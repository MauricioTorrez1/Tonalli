/**
 * Week navigation strip: seven day chips (Monday–Sunday) plus prev/next-week
 * arrows. This is what lets a user actually view a day other than today —
 * without it, there was no way to check that a recurring block projects onto
 * future days. Deliberately not a swipeable calendar or month grid: one
 * row, one decision (which day), consistent with the reduced-choice,
 * focus-first approach elsewhere in the app.
 */
import { Feather } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import {
  addDays,
  todayString,
  WEEKDAY_SHORT_LABELS,
  weekDays,
  type DayString,
} from "@/lib/date";
import { useThemeColors } from "@/theme/useThemeColors";

interface WeekStripProps {
  selectedDay: DayString;
  onSelectDay: (day: DayString) => void;
}

export function WeekStrip({ selectedDay, onSelectDay }: WeekStripProps) {
  const themeColors = useThemeColors();
  const today = todayString();
  const days = weekDays(selectedDay);

  return (
    <View className="flex-row items-center px-2">
      <Pressable
        onPress={() => onSelectDay(addDays(days[0], -1))}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Semana anterior"
        className="p-2"
      >
        <Feather name="chevron-left" size={18} color={themeColors.icon} />
      </Pressable>

      <View className="flex-1 flex-row justify-between">
        {days.map((day, i) => {
          const isSelected = day === selectedDay;
          const isToday = day === today;
          const dayOfMonth = Number(day.slice(8, 10));
          return (
            <Pressable
              key={day}
              onPress={() => onSelectDay(day)}
              accessibilityRole="button"
              accessibilityLabel={`${WEEKDAY_SHORT_LABELS[i]} ${dayOfMonth}`}
              accessibilityState={{ selected: isSelected }}
              className="items-center gap-1 rounded-card px-1.5 py-2"
            >
              <Text className="font-raleway-medium text-[11px] text-ink-soft dark:text-ink-invsoft">
                {WEEKDAY_SHORT_LABELS[i]}
              </Text>
              <View
                className={`h-8 w-8 items-center justify-center rounded-full ${
                  isSelected
                    ? "bg-category-sky-solid"
                    : isToday
                      ? "border border-category-sky-soft/70"
                      : ""
                }`}
              >
                <Text
                  className={`font-raleway-semibold text-sm ${
                    isSelected ? "text-white" : "text-ink dark:text-ink-inverse"
                  }`}
                >
                  {dayOfMonth}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => onSelectDay(addDays(days[6], 1))}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Semana siguiente"
        className="p-2"
      >
        <Feather name="chevron-right" size={18} color={themeColors.icon} />
      </Pressable>
    </View>
  );
}
