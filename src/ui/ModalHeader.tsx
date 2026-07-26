/**
 * The top bar of a modal screen: close on the left, title in the middle, and
 * an optional confirm action on the right.
 *
 * This header used to take a `tintColor` and flood itself with a block's fill.
 * That job moved to `BlockColorHeader`, which does much more than tint a bar —
 * it carries the block's icon, time and title. What is left here is the plain
 * bar the utility modals need.
 */
import { Feather } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemeColors } from "@/theme/useThemeColors";

interface ModalHeaderProps {
  title: string;
  /** Secondary line under the title, e.g. the day a block belongs to. */
  subtitle?: string;
  onClose: () => void;
  /** Adds a confirm control on the right. Omit for read-only screens. */
  onConfirm?: () => void;
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
 * @param closeLabel - Accessible label for the close control.
 * @param confirmLabel - Accessible label for the confirm control.
 */
export function ModalHeader({
  title,
  subtitle,
  onClose,
  onConfirm,
  closeLabel = "Cerrar",
  confirmLabel = "Guardar",
}: ModalHeaderProps) {
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();

  return (
    <View
      className="flex-row items-center justify-between px-5 pb-3"
      style={{ paddingTop: insets.top + 12 }}
    >
      <Pressable
        onPress={onClose}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={closeLabel}
      >
        <Feather name="x" size={22} color={themeColors.icon} />
      </Pressable>

      <View className="flex-1 items-center px-2">
        <Text
          numberOfLines={1}
          className="font-raleway-semibold text-base text-ink dark:text-ink-inverse"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={1}
            className="font-raleway-medium text-xs text-ink-soft dark:text-ink-invsoft"
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
        >
          <Feather name="check" size={22} color={themeColors.iconStrong} />
        </Pressable>
      ) : (
        // Balances the close control so the title stays optically centered.
        <View className="h-8 w-8" />
      )}
    </View>
  );
}
