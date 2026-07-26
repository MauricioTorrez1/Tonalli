/**
 * A small round toggle, used for the weekday row (L M M J V S D) where the
 * labels are single letters and several can be active at once.
 */
import { Pressable, Text } from "react-native";

interface ToggleCircleProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Required: a bare letter like "M" is meaningless to a screen reader. */
  accessibilityLabel: string;
}

/**
 * Renders a circular multi-select toggle.
 *
 * @param label - Short visible text, typically one letter.
 * @param selected - Whether this circle is active.
 * @param onPress - Toggle handler.
 * @param accessibilityLabel - The spoken label, e.g. "Lunes".
 */
export function ToggleCircle({
  label,
  selected,
  onPress,
  accessibilityLabel,
}: ToggleCircleProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={accessibilityLabel}
      className={`h-9 w-9 items-center justify-center rounded-full border ${
        selected
          ? "border-category-sky-solid bg-category-sky-solid"
          : "border-sand dark:border-nightRaised"
      }`}
    >
      <Text
        className={`font-raleway-semibold text-xs ${
          selected ? "text-white" : "text-ink dark:text-ink-inverse"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
