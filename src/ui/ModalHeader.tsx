/**
 * The top bar of a modal screen: close on the left, title in the middle, and
 * an optional confirm action on the right.
 *
 * Passing `tintColor` floods the bar with a category's solid fill and moves
 * the controls into translucent circles. That is what makes an open block feel
 * like *that* block rather than a generic form — the color is the block's
 * identity, carried from its node on the timeline into the screen that edits
 * it.
 */
import { Feather } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CATEGORY_STYLES } from "@/theme/category-styles";
import type { ColorToken } from "@/theme/colors";
import { useThemeColors } from "@/theme/useThemeColors";

interface ModalHeaderProps {
  title: string;
  /** Secondary line under the title, e.g. the day a block belongs to. */
  subtitle?: string;
  onClose: () => void;
  /** Adds a confirm control on the right. Omit for read-only screens. */
  onConfirm?: () => void;
  /** Floods the bar with this category's solid fill. */
  tintColor?: ColorToken;
  closeLabel?: string;
  confirmLabel?: string;
}

/**
 * Renders a modal screen's header bar.
 *
 * @param title - The screen title.
 * @param subtitle - Optional secondary line under the title.
 * @param onClose - Handler for the leading close control.
 * @param onConfirm - Optional handler for the trailing confirm control.
 * @param tintColor - Category token that floods the bar with a solid fill.
 * @param closeLabel - Accessible label for the close control.
 * @param confirmLabel - Accessible label for the confirm control.
 */
export function ModalHeader({
  title,
  subtitle,
  onClose,
  onConfirm,
  tintColor,
  closeLabel = "Cerrar",
  confirmLabel = "Guardar",
}: ModalHeaderProps) {
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const tinted = tintColor !== undefined;

  // On a solid category fill, white is the only reliably AA-compliant ink —
  // the `-solid` shades were chosen for exactly that (see ADR 0006).
  const controlColor = tinted ? "white" : themeColors.icon;
  const controlClass = tinted
    ? "h-8 w-8 items-center justify-center rounded-full bg-white/20"
    : "";

  return (
    <View
      className={`flex-row items-center justify-between px-5 pb-3 ${
        tinted ? CATEGORY_STYLES[tintColor].solidBg : ""
      }`}
      style={{ paddingTop: insets.top + 12 }}
    >
      <Pressable
        onPress={onClose}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={closeLabel}
        className={controlClass}
      >
        <Feather name="x" size={22} color={controlColor} />
      </Pressable>

      <View className="flex-1 items-center px-2">
        <Text
          numberOfLines={1}
          className={`font-raleway-semibold text-base ${
            tinted ? "text-white" : "text-ink dark:text-ink-inverse"
          }`}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={1}
            className={`font-raleway-medium text-xs ${
              tinted ? "text-white/80" : "text-ink-soft dark:text-ink-invsoft"
            }`}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {onConfirm ? (
        <Pressable
          onPress={onConfirm}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={confirmLabel}
          className={controlClass}
        >
          <Feather
            name="check"
            size={22}
            color={tinted ? "white" : themeColors.iconStrong}
          />
        </Pressable>
      ) : (
        // Balances the close control so the title stays optically centered.
        <View className="h-8 w-8" />
      )}
    </View>
  );
}
