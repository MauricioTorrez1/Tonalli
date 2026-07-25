/**
 * The round completion toggle on a timeline node.
 *
 * Completing a block is the one moment in the app worth celebrating, and the
 * check springing in is the whole celebration — no confetti, no sound, no
 * streak popup. It is a state transition made legible, which is what the
 * animation allowlist in docs/adr/0010-animation-allowlist.md permits.
 */
import { Feather } from "@expo/vector-icons";
import { useEffect } from "react";
import { Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useReducedMotionValue } from "./motion";

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  /**
   * "onSolid" lightens the empty ring for use on top of a filled category
   * color, where the normal ink-based ring would disappear.
   */
  tone?: "default" | "onSolid";
  accessibilityLabel: string;
}

// Slightly overdamped: the check should arrive with weight and stop, not
// wobble. A bouncy confirmation reads as a toy.
const SPRING = { damping: 18, stiffness: 220 };

/**
 * Renders a circular checkbox whose check springs in when it becomes checked.
 *
 * @param checked - Whether the item is complete.
 * @param onToggle - Called when the user taps the control.
 * @param tone - Ring treatment; use "onSolid" over a filled background.
 * @param accessibilityLabel - The spoken label describing the action.
 */
export function Checkbox({
  checked,
  onToggle,
  tone = "default",
  accessibilityLabel,
}: CheckboxProps) {
  const reducedMotion = useReducedMotionValue();
  const progress = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    const target = checked ? 1 : 0;
    progress.value = reducedMotion ? target : withSpring(target, SPRING);
  }, [checked, reducedMotion, progress]);

  const checkStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.6 + 0.4 * progress.value }],
  }));

  return (
    <Pressable
      onPress={onToggle}
      hitSlop={10}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={accessibilityLabel}
      className={`h-7 w-7 items-center justify-center rounded-full border-2 ${
        checked
          ? "border-sage-500 bg-sage-500"
          : tone === "onSolid"
            ? "border-white/70"
            : "border-ink-soft/40 dark:border-ink-invsoft/40"
      }`}
    >
      <Animated.View style={checkStyle}>
        <Feather name="check" size={14} color="white" />
      </Animated.View>
    </Pressable>
  );
}
