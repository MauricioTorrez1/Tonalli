/**
 * Contents of the "Repetir" sheet: frequency, weekdays, and when to stop.
 *
 * The frequency options mirror the recurrence schema exactly. The reference
 * app offers "monthly" and an "every N weeks" stepper; neither exists in
 * `types/recurrence.ts`, and offering a control that silently does nothing is
 * worse than not offering it. Adding them means a schema change plus a store
 * migration, which is its own piece of work.
 */
import { Text, View } from "react-native";

import { addDays, type DayString } from "@/lib/date";
import { Chip } from "@/ui/Chip";
import { SegmentedControl } from "@/ui/SegmentedControl";
import { ToggleCircle } from "@/ui/ToggleCircle";
import type { RecurrenceFreq } from "@/types/recurrence";

export type FreqOption = "none" | RecurrenceFreq;

const FREQ_OPTIONS: readonly { value: FreqOption; label: string }[] = [
  { value: "none", label: "Nunca" },
  { value: "daily", label: "Diario" },
  { value: "weekdays", label: "L–V" },
  { value: "weekly", label: "Semanal" },
];

/** ISO weekday order, Monday first, matching `Recurrence.byWeekday`. */
const WEEKDAYS: readonly { iso: number; short: string; full: string }[] = [
  { iso: 1, short: "L", full: "Lunes" },
  { iso: 2, short: "M", full: "Martes" },
  { iso: 3, short: "M", full: "Miércoles" },
  { iso: 4, short: "J", full: "Jueves" },
  { iso: 5, short: "V", full: "Viernes" },
  { iso: 6, short: "S", full: "Sábado" },
  { iso: 7, short: "D", full: "Domingo" },
];

/**
 * Preset horizons instead of a date picker. "Stop in three months" is the
 * shape of the real decision; asking someone to pick an exact day they have
 * no opinion about is the kind of choice ADR 0004 exists to remove.
 */
const END_OPTIONS: readonly { days: number | null; label: string }[] = [
  { days: null, label: "Sin fin" },
  { days: 30, label: "1 mes" },
  { days: 90, label: "3 meses" },
  { days: 180, label: "6 meses" },
];

interface RepeatSheetBodyProps {
  freq: FreqOption;
  onChangeFreq: (freq: FreqOption) => void;
  byWeekday: number[];
  onToggleWeekday: (isoDay: number) => void;
  /** The day the series starts, used to resolve the end presets. */
  startsOn: DayString;
  endsOn: DayString | undefined;
  onChangeEndsOn: (endsOn: DayString | undefined) => void;
}

/**
 * Renders the recurrence controls.
 *
 * @param freq - Current frequency, or "none" for a one-off block.
 * @param onChangeFreq - Called with the newly chosen frequency.
 * @param byWeekday - Selected ISO weekdays, only meaningful when weekly.
 * @param onToggleWeekday - Called with the ISO day the user toggled.
 * @param startsOn - The series start day, used to compute end presets.
 * @param endsOn - Current end day, or undefined for an open-ended series.
 * @param onChangeEndsOn - Called with the new end day, or undefined.
 */
export function RepeatSheetBody({
  freq,
  onChangeFreq,
  byWeekday,
  onToggleWeekday,
  startsOn,
  endsOn,
  onChangeEndsOn,
}: RepeatSheetBodyProps) {
  return (
    <View className="px-5">
      <SegmentedControl
        options={FREQ_OPTIONS}
        value={freq}
        onChange={onChangeFreq}
        accessibilityLabel="Frecuencia de repetición"
      />

      {freq === "weekly" ? (
        <>
          <Text className="mb-2 ml-1 mt-6 font-raleway-semibold text-sm text-ink-soft dark:text-ink-invsoft">
            Días
          </Text>
          <View className="flex-row justify-between">
            {WEEKDAYS.map((day) => (
              <ToggleCircle
                key={day.iso}
                label={day.short}
                selected={byWeekday.includes(day.iso)}
                onPress={() => onToggleWeekday(day.iso)}
                accessibilityLabel={day.full}
              />
            ))}
          </View>
        </>
      ) : null}

      {freq !== "none" ? (
        <>
          <Text className="mb-2 ml-1 mt-6 font-raleway-semibold text-sm text-ink-soft dark:text-ink-invsoft">
            Termina
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {END_OPTIONS.map((option) => {
              const value =
                option.days === null
                  ? undefined
                  : addDays(startsOn, option.days);
              return (
                <Chip
                  key={option.label}
                  label={option.label}
                  selected={endsOn === value}
                  onPress={() => onChangeEndsOn(value)}
                />
              );
            })}
          </View>
        </>
      ) : null}
    </View>
  );
}
