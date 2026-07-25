/**
 * A two-column snapping time picker, built from plain ScrollViews.
 *
 * This replaced the native date-time picker, which needed a platform branch
 * (iOS got an inline compact chip, Android a modal dialog) and had no web
 * implementation at all — so the PWA fell into the Android branch and mounted
 * a component that does not exist there. One implementation for all three
 * targets removes that whole class of bug, and it is testable under Jest,
 * which a native picker is not.
 */
import { useEffect, useRef } from "react";
import { ScrollView, Text, View } from "react-native";

const ROW_HEIGHT = 40;
const VISIBLE_ROWS = 5;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

interface TimeWheelProps {
  /** Minute of day, 0 to 1439. */
  minute: number;
  onChange: (minute: number) => void;
  /**
   * Granularity of the minutes column. Five is the default because block
   * boundaries are a planning decision, not a stopwatch — offering 60 rows
   * makes the column harder to land on for no real gain.
   */
  minuteStep?: number;
  /** Names the control for screen readers, e.g. "Hora de inicio". */
  accessibilityLabel: string;
}

interface WheelColumnProps {
  values: readonly number[];
  selected: number;
  onSelect: (value: number) => void;
  label: string;
}

/**
 * One snapping column of the wheel.
 *
 * @param values - The selectable values, in order.
 * @param selected - The currently selected value.
 * @param onSelect - Called when the column settles on a new value.
 * @param label - Accessible name for this column.
 */
function WheelColumn({ values, selected, onSelect, label }: WheelColumnProps) {
  const scrollRef = useRef<ScrollView>(null);
  const selectedIndex = values.indexOf(selected);

  // Keep the column in sync when the value changes from outside — picking a
  // duration chip moves the end time, and the wheel has to follow.
  useEffect(() => {
    if (selectedIndex >= 0) {
      scrollRef.current?.scrollTo({
        y: selectedIndex * ROW_HEIGHT,
        animated: false,
      });
    }
  }, [selectedIndex]);

  return (
    <ScrollView
      ref={scrollRef}
      accessibilityLabel={label}
      showsVerticalScrollIndicator={false}
      snapToInterval={ROW_HEIGHT}
      decelerationRate="fast"
      style={{ height: ROW_HEIGHT * VISIBLE_ROWS }}
      // Half a viewport of padding at each end lets the first and last values
      // reach the centre line.
      contentContainerStyle={{
        paddingVertical: (ROW_HEIGHT * (VISIBLE_ROWS - 1)) / 2,
      }}
      onMomentumScrollEnd={(event) => {
        const index = Math.round(
          event.nativeEvent.contentOffset.y / ROW_HEIGHT,
        );
        const value = values[Math.max(0, Math.min(values.length - 1, index))];
        if (value !== selected) {
          onSelect(value);
        }
      }}
    >
      {values.map((value) => (
        <View
          key={value}
          className="items-center justify-center"
          style={{ height: ROW_HEIGHT }}
        >
          <Text
            className={`font-raleway-semibold text-xl ${
              value === selected
                ? "text-ink dark:text-ink-inverse"
                : "text-ink-muted dark:text-ink-invmuted"
            }`}
          >
            {String(value).padStart(2, "0")}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

/**
 * Renders an hours-and-minutes wheel.
 *
 * @param minute - Minute of day currently selected.
 * @param onChange - Called with the new minute of day.
 * @param minuteStep - Granularity of the minutes column. Defaults to 5.
 * @param accessibilityLabel - Names the whole control.
 */
export function TimeWheel({
  minute,
  onChange,
  minuteStep = 5,
  accessibilityLabel,
}: TimeWheelProps) {
  const hour = Math.floor(minute / 60);
  // Snap to the nearest step so a time typed as 09:07 still highlights a row.
  const minuteInHour =
    Math.round((minute % 60) / minuteStep) * minuteStep >= 60
      ? 60 - minuteStep
      : Math.round((minute % 60) / minuteStep) * minuteStep;
  const minutes = Array.from(
    { length: Math.ceil(60 / minuteStep) },
    (_, index) => index * minuteStep,
  );

  return (
    <View accessibilityLabel={accessibilityLabel} className="items-center">
      <View className="flex-row items-center justify-center gap-6">
        <WheelColumn
          values={HOURS}
          selected={hour}
          onSelect={(nextHour) => onChange(nextHour * 60 + minuteInHour)}
          label="Horas"
        />
        <Text className="font-raleway-semibold text-xl text-ink-soft dark:text-ink-invsoft">
          :
        </Text>
        <WheelColumn
          values={minutes}
          selected={minuteInHour}
          onSelect={(nextMinute) => onChange(hour * 60 + nextMinute)}
          label="Minutos"
        />
      </View>
    </View>
  );
}
