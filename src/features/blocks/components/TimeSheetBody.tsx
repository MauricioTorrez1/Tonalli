/**
 * Contents of the "Horario" sheet: two time wheels plus duration shortcuts.
 *
 * A presentational component taking plain props, so it can be tested without
 * mounting a bottom sheet — the sheet chrome is third-party and not worth
 * asserting on, but this is where the logic the user touches lives.
 */
import { Text, View } from "react-native";

import { applyDuration } from "@/features/timeline/utils/timeline-layout";
import { formatDuration } from "@/lib/date";
import { Chip } from "@/ui/Chip";
import { TimeWheel } from "@/ui/TimeWheel";

/** The lengths most blocks actually take, shortest first. */
const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

interface TimeSheetBodyProps {
  startMinute: number;
  endMinute: number;
  onChange: (next: { startMinute: number; endMinute: number }) => void;
}

/**
 * Renders the start and end wheels with duration shortcut chips.
 *
 * @param startMinute - Current start, as a minute of day.
 * @param endMinute - Current end, as a minute of day.
 * @param onChange - Called with the full new range whenever either side moves.
 */
export function TimeSheetBody({
  startMinute,
  endMinute,
  onChange,
}: TimeSheetBodyProps) {
  const duration = endMinute - startMinute;

  return (
    <View className="px-5">
      <View className="flex-row justify-around">
        <View className="items-center">
          <Text className="mb-2 font-raleway-medium text-xs text-ink-soft dark:text-ink-invsoft">
            Inicio
          </Text>
          <TimeWheel
            minute={startMinute}
            accessibilityLabel="Hora de inicio"
            onChange={(nextStart) =>
              // Moving the start carries the block with it rather than
              // stretching it — the user is rescheduling, not resizing.
              onChange(applyDuration(nextStart, duration))
            }
          />
        </View>
        <View className="items-center">
          <Text className="mb-2 font-raleway-medium text-xs text-ink-soft dark:text-ink-invsoft">
            Fin
          </Text>
          <TimeWheel
            minute={endMinute}
            accessibilityLabel="Hora de fin"
            onChange={(nextEnd) =>
              onChange({ startMinute, endMinute: nextEnd })
            }
          />
        </View>
      </View>

      <Text className="mb-2 mt-4 font-raleway-semibold text-sm text-ink-soft dark:text-ink-invsoft">
        Duración
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {DURATION_OPTIONS.map((minutes) => (
          <Chip
            key={minutes}
            label={formatDuration(minutes)}
            selected={duration === minutes}
            onPress={() => onChange(applyDuration(startMinute, minutes))}
          />
        ))}
      </View>
    </View>
  );
}
