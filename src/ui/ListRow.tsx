/**
 * One row inside a `Card`: a tinted icon tile, a label, an optional trailing
 * value, and a chevron when the row navigates somewhere.
 *
 * This is the workhorse of the settings and block-form screens — a screen
 * built from these reads as a short list of decisions rather than a wall of
 * controls, which is the point of the focus-first rule in
 * docs/adr/0004-focus-first-design-for-attention.md.
 */
import { Feather } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { CATEGORY_STYLES } from "@/theme/category-styles";
import type { ColorToken } from "@/theme/colors";
import { useThemeColors } from "@/theme/useThemeColors";

type FeatherGlyph = React.ComponentProps<typeof Feather>["name"];

interface ListRowProps {
  label: string;
  /** Leading icon. Omit for a text-only row. */
  icon?: FeatherGlyph;
  /** Fill behind the icon tile. Defaults to the neutral token. */
  iconTint?: ColorToken;
  /** Trailing detail — a summary string, or a node for a swatch or badge. */
  value?: string | ReactNode;
  onPress?: () => void;
  /** Hide the chevron on rows that act in place rather than navigating. */
  showChevron?: boolean;
  /** Renders the label in the warning color, for destructive actions. */
  destructive?: boolean;
  /** Defaults to `label`; set it when the label alone is ambiguous aloud. */
  accessibilityLabel?: string;
}

/**
 * Renders a tappable row of grouped content.
 *
 * @param label - The row's primary text.
 * @param icon - Optional Feather glyph shown in a tinted leading tile.
 * @param iconTint - Category color token filling the icon tile.
 * @param value - Optional trailing detail, as text or a custom node.
 * @param onPress - Handler; when omitted the row renders as static content.
 * @param showChevron - Whether to draw the trailing chevron. Defaults to true
 *   for pressable rows.
 * @param destructive - Renders the label in the destructive color.
 * @param accessibilityLabel - Overrides the announced label.
 */
export function ListRow({
  label,
  icon,
  iconTint = "stone",
  value,
  onPress,
  showChevron,
  destructive = false,
  accessibilityLabel,
}: ListRowProps) {
  const themeColors = useThemeColors();
  const withChevron = showChevron ?? Boolean(onPress);

  const content = (
    <View className="flex-row items-center px-4 py-3">
      {icon ? (
        // rounded-lg, not the 16px rounded-button token: on a 32px tile a 16px
        // radius is exactly half the height, which renders a circle. The
        // reference's tiles are squares with softened corners.
        <View
          className={`mr-3 h-8 w-8 items-center justify-center rounded-lg ${CATEGORY_STYLES[iconTint].solidBg}`}
        >
          <Feather name={icon} size={16} color="white" />
        </View>
      ) : null}

      <Text
        className={`flex-1 font-raleway-medium text-sm ${
          destructive
            ? "text-terracotta-600 dark:text-terracotta-300"
            : "text-ink dark:text-ink-inverse"
        }`}
      >
        {label}
      </Text>

      {typeof value === "string" ? (
        <Text className="ml-3 font-raleway text-sm text-ink-soft dark:text-ink-invsoft">
          {value}
        </Text>
      ) : (
        value
      )}

      {withChevron ? (
        <Feather
          name="chevron-right"
          size={16}
          color={themeColors.icon}
          style={{ marginLeft: 8 }}
        />
      ) : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {content}
    </Pressable>
  );
}
