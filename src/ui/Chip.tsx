/**
 * A pill-shaped single choice: category, repeat frequency, block duration.
 *
 * Selection is a solid fill rather than a heavier outline. Outline-only
 * selection makes the chosen item the *quietest* thing in a row of borders,
 * which is backwards.
 */
import { Pressable, Text, View } from "react-native";

import { CATEGORY_STYLES } from "@/theme/category-styles";
import type { ColorToken } from "@/theme/colors";

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Optional leading dot, used by category chips to preview their color. */
  dotColor?: ColorToken;
  /** Defaults to `label`. */
  accessibilityLabel?: string;
}

/**
 * Renders a selectable pill.
 *
 * @param label - The chip's text.
 * @param selected - Whether this chip is the active choice.
 * @param onPress - Selection handler.
 * @param dotColor - Category token for an optional leading color dot.
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
      className={`flex-row items-center gap-2 rounded-full border px-3 py-2 ${
        selected
          ? "border-category-sky-solid bg-category-sky-solid"
          : "border-sand dark:border-nightRaised"
      }`}
    >
      {dotColor ? (
        <View
          className={`h-2.5 w-2.5 rounded-full ${
            selected ? "bg-white/80" : CATEGORY_STYLES[dotColor].dot
          }`}
        />
      ) : null}
      <Text
        className={`font-raleway-medium text-sm ${
          selected ? "text-white" : "text-ink dark:text-ink-inverse"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
