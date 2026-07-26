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
import { ScrollView, Text, View, type NativeScrollEvent } from "react-native";

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
  // True from the moment a drag begins until the column has settled and
  // reported its value. See the sync effect below for why that matters.
  const isUserScrolling = useRef(false);

  // Keep the column in sync when the value changes from outside — picking a
  // duration chip moves the end time, and the wheel has to follow. Skipped
  // while the user is scrolling this very column: committing a value re-renders
  // the parent with a new `selected`, and scrolling the column back to it
  // mid-gesture fights the finger.
  useEffect(() => {
    if (selectedIndex >= 0 && !isUserScrolling.current) {
      scrollRef.current?.scrollTo({
        y: selectedIndex * ROW_HEIGHT,
        animated: false,
      });
    }
  }, [selectedIndex]);

  function commit(event: { nativeEvent: NativeScrollEvent }) {
    isUserScrolling.current = false;
    const index = Math.round(event.nativeEvent.contentOffset.y / ROW_HEIGHT);
    const value = values[Math.max(0, Math.min(values.length - 1, index))];
    if (value !== selected) {
      onSelect(value);
    }
  }

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
      onScrollBeginDrag={() => {
        isUserScrolling.current = true;
      }}
      // Both handlers commit, because only one of them fires per gesture: a
      // flick ends in momentum, a slow release ends the drag with none. Landing
      // only on momentum left the column visually parked on a value it had
      // never reported — the bug where picking a time appeared to do nothing.
      onScrollEndDrag={commit}
      onMomentumScrollEnd={commit}
    >
      {values.map((value) => (
        <View
          key={value}
          className="items-center justify-center"
          style={{ height: ROW_HEIGHT }}
        >
          <Text
            className={`font-raleway-semibold text-2xl ${
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
      <View style={{ height: ROW_HEIGHT * VISIBLE_ROWS }}>
        {/* The selection band, drawn behind the columns: it marks where the
            chosen row lands instead of relying on the text weight alone. */}
        <View
          pointerEvents="none"
          className="absolute left-0 right-0 rounded-xl bg-sand dark:bg-nightRaised"
          style={{
            height: ROW_HEIGHT,
            top: (ROW_HEIGHT * (VISIBLE_ROWS - 1)) / 2,
          }}
        />
        <View className="flex-row items-center justify-center gap-5 px-3">
          <WheelColumn
            values={HOURS}
            selected={hour}
            onSelect={(nextHour) => onChange(nextHour * 60 + minuteInHour)}
            label="Horas"
          />
          <Text className="font-raleway-semibold text-2xl text-ink-soft dark:text-ink-invsoft">
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
    </View>
  );
}
