/**
 * A month grid for picking a day.
 *
 * Built here rather than pulled from a calendar library, and deliberately not
 * the platform date picker: that one was removed in an earlier pass because it
 * needed a per-platform branch and had no web implementation at all, so the
 * PWA mounted a component that does not exist there. One grid, three targets,
 * and it renders under Jest.
 */
import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import {
  addDays,
  isoWeekday,
  todayString,
  WEEKDAY_SHORT_LABELS,
  type DayString,
} from "@/lib/date";
import { useThemeColors } from "@/theme/useThemeColors";

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/** The first day of the month containing `day`. */
function startOfMonth(day: DayString): DayString {
  return `${day.slice(0, 8)}01`;
}

/** Move `day` by whole months, clamping to the first of the target month. */
function addMonths(day: DayString, count: number): DayString {
  const year = Number(day.slice(0, 4));
  const month = Number(day.slice(5, 7)) - 1 + count;
  const targetYear = year + Math.floor(month / 12);
  const targetMonth = ((month % 12) + 12) % 12;
  return `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-01`;
}

/**
 * The days to render for a month: the month itself, padded at the front with
 * blanks so the first lands under its weekday column.
 *
 * @param monthStart - The first day of the month.
 * @returns Day strings, with `null` for the leading blanks.
 */
export function buildMonthGrid(monthStart: DayString): (DayString | null)[] {
  const leadingBlanks = isoWeekday(monthStart) - 1;
  const cells: (DayString | null)[] = Array.from(
    { length: leadingBlanks },
    () => null,
  );
  let cursor = monthStart;
  const month = monthStart.slice(0, 7);
  while (cursor.slice(0, 7) === month) {
    cells.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return cells;
}

interface MonthCalendarProps {
  selectedDay: DayString;
  onSelectDay: (day: DayString) => void;
}

/**
 * Renders a navigable month grid.
 *
 * @param selectedDay - The currently chosen day, which the view opens on.
 * @param onSelectDay - Called with the day the user taps.
 */
export function MonthCalendar({
  selectedDay,
  onSelectDay,
}: MonthCalendarProps) {
  const themeColors = useThemeColors();
  const today = todayString();
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(selectedDay),
  );

  const cells = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);
  const monthLabel = `${
    MONTH_NAMES[Number(visibleMonth.slice(5, 7)) - 1]
  } ${visibleMonth.slice(0, 4)}`;

  return (
    <View className="px-5">
      <View className="mb-3 flex-row items-center justify-between">
        <Pressable
          onPress={() => setVisibleMonth(addMonths(visibleMonth, -1))}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Mes anterior"
          className="p-1"
        >
          <Feather name="chevron-left" size={20} color={themeColors.icon} />
        </Pressable>
        <Text className="font-raleway-semibold text-base text-ink dark:text-ink-inverse">
          {monthLabel}
        </Text>
        <Pressable
          onPress={() => setVisibleMonth(addMonths(visibleMonth, 1))}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Mes siguiente"
          className="p-1"
        >
          <Feather name="chevron-right" size={20} color={themeColors.icon} />
        </Pressable>
      </View>

      <View className="flex-row">
        {WEEKDAY_SHORT_LABELS.map((label, index) => (
          <Text
            key={index}
            className="flex-1 text-center font-raleway-medium text-xs text-ink-soft dark:text-ink-invsoft"
          >
            {label}
          </Text>
        ))}
      </View>

      <View className="mt-1 flex-row flex-wrap">
        {cells.map((day, index) => {
          if (day === null) {
            // Blank leading cell. Width is a seventh of the row, matching the
            // real cells, so the first of the month lines up with its column.
            return (
              <View key={`blank-${index}`} style={{ width: `${100 / 7}%` }} />
            );
          }
          const isSelected = day === selectedDay;
          const isToday = day === today;
          const dayOfMonth = Number(day.slice(8, 10));
          return (
            <View key={day} style={{ width: `${100 / 7}%` }} className="py-1">
              <Pressable
                onPress={() => onSelectDay(day)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${dayOfMonth} de ${monthLabel}`}
                className={`mx-auto h-10 w-10 items-center justify-center rounded-full ${
                  isSelected
                    ? "bg-accent"
                    : isToday
                      ? "border border-accent/60"
                      : ""
                }`}
              >
                <Text
                  className={`font-raleway-medium text-sm ${
                    isSelected
                      ? "text-accent-ink"
                      : isToday
                        ? "text-accent"
                        : "text-ink dark:text-ink-inverse"
                  }`}
                >
                  {dayOfMonth}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <Pressable
        onPress={() => {
          setVisibleMonth(startOfMonth(today));
          onSelectDay(today);
        }}
        accessibilityRole="button"
        accessibilityLabel="Ir a hoy"
        className="mt-4 items-center rounded-button bg-sand py-3 dark:bg-nightRaised"
      >
        <Text className="font-raleway-semibold text-sm text-ink dark:text-ink-inverse">
          Hoy
        </Text>
      </Pressable>
    </View>
  );
}
