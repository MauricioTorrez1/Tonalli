/**
 * NativeWind's `className` system only reaches style props, not raw color
 * values — icon libraries like `@expo/vector-icons` take a `color` prop that
 * needs an actual hex string. This hook resolves the handful of tokens icons
 * need against the current color scheme, so components never hardcode one
 * mode's palette.
 */
import { useColorScheme } from "nativewind";

import { palette } from "./colors";

export function useThemeColors() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return {
    isDark,
    icon: isDark ? palette.ink.invsoft : palette.ink.soft,
    iconStrong: isDark ? palette.ink.inverse : palette.ink.DEFAULT,
    /** Raised surface — bottom sheets, which style via props, not className. */
    surface: isDark ? palette.nightSurface : palette.cream,
    /**
     * The next level up: control fills sitting on a card or sheet. Needed as a
     * value, not a class, wherever an inline `backgroundColor` also has to
     * express a selected state in the block's own arbitrary color.
     */
    raised: isDark ? palette.nightRaised : palette.sand,
    /** The sheet's drag grabber. */
    grabber: isDark ? palette.ink.invsoft : palette.ink.soft,
  };
}
