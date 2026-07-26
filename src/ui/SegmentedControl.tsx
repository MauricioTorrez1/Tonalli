/**
 * A mutually-exclusive choice across 2-4 short options, rendered as one
 * connected track rather than separate buttons.
 *
 * Use this when the options are the *same kind of thing* (theme mode, repeat
 * frequency); use `Chip` when they are a loose set that happens to be
 * selectable. The visual difference — one track versus floating pills — is
 * what tells the user which of those two situations they are in.
 */
import { Pressable, Text, View } from "react-native";

interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Names the group as a whole, e.g. "Tema de la aplicación". */
  accessibilityLabel?: string;
}

/**
 * Renders a segmented single-choice control.
 *
 * @param options - The available choices, in display order.
 * @param value - The currently selected value.
 * @param onChange - Called with the newly selected value.
 * @param accessibilityLabel - Names the control group for screen readers.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      className="flex-row rounded-full bg-sand p-1 dark:bg-nightRaised"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            className={`flex-1 items-center rounded-full py-2 ${
              selected ? "bg-accent" : ""
            }`}
          >
            <Text
              className={`font-raleway-semibold text-sm ${
                selected ? "text-accent-ink" : "text-ink dark:text-ink-inverse"
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
