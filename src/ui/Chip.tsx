/**
 * A pill-shaped single choice: category, repeat frequency, block duration.
 *
 * Selection is a solid fill rather than a heavier outline. Outline-only
 * selection makes the chosen item the *quietest* thing in a row of borders,
 * which is backwards.
 */
import { Pressable, Text, View } from "react-native";

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Optional leading dot as `#RRGGBB`, previewing a category's color. */
  dotColor?: string;
  /** Defaults to `label`. */
  accessibilityLabel?: string;
}

/**
 * Renders a selectable pill.
 *
 * @param label - The chip's text.
 * @param selected - Whether this chip is the active choice.
 * @param onPress - Selection handler.
 * @param dotColor - Hex color for an optional leading dot.
 * @param accessibilityLabel - Overrides the announced label.
 */
export function Chip({
  label,
  selected,
  onPress,
  dotColor,
  accessibilityLabel,
}: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      className={`flex-row items-center gap-2 rounded-full border px-3.5 py-2 ${
        selected
          ? "border-accent bg-accent"
          : "border-sand bg-sand dark:border-nightRaised dark:bg-nightRaised"
      }`}
    >
      {dotColor ? (
        <View
          className="h-2.5 w-2.5 rounded-full"
          // A block color is arbitrary hex now, so it cannot come from a class.
          style={{ backgroundColor: dotColor }}
        />
      ) : null}
      <Text
        className={`font-raleway-semibold text-sm ${
          selected ? "text-accent-ink" : "text-ink dark:text-ink-inverse"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
