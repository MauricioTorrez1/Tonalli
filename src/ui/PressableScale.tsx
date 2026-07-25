/**
 * A `Pressable` that dips slightly while held.
 *
 * On a touch screen there is no hover and no cursor, so without this the only
 * confirmation that a tap registered is whatever happens next — which, for a
 * navigation that takes a moment, feels like the app ignored you. The dip is
 * feedback, not decoration, which is why it is on the allowlist in
 * docs/adr/0010-animation-allowlist.md.
 */
import { cssInterop } from "nativewind";
import type { ReactNode } from "react";
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useReducedMotionValue } from "./motion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Wrapping a component produces a new type NativeWind has never seen, so its
// automatic className handling does not apply and the prop would be silently
// dropped. This registers the mapping explicitly.
cssInterop(AnimatedPressable, { className: "style" });

interface PressableScaleProps extends Omit<
  PressableProps,
  "style" | "children"
> {
  children?: ReactNode;
  className?: string;
  /** Style merged after the scale transform, for one-off layout values. */
  style?: StyleProp<ViewStyle>;
  /** How far to dip. Smaller values read as heavier, more physical controls. */
  scaleTo?: number;
}

// Out is slower than in: the press should feel immediate and the release
// should feel like the control settling back, not snapping.
const PRESS_IN_MS = 120;
const PRESS_OUT_MS = 160;

/**
 * Renders a pressable that scales down while held.
 *
 * @param children - The pressable's content.
 * @param className - NativeWind classes for the pressable itself.
 * @param style - Style merged after the animated transform.
 * @param scaleTo - Scale factor while held. Defaults to 0.97.
 */
export function PressableScale({
  children,
  className,
  style,
  scaleTo = 0.97,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: PressableScaleProps) {
  const reducedMotion = useReducedMotionValue();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      className={className}
      style={[animatedStyle, style]}
      disabled={disabled}
      onPressIn={(event) => {
        // Never write the shared value under reduce-motion: leaving it at 1
        // means no transform ever runs, rather than running a shorter one.
        if (!reducedMotion && !disabled) {
          scale.value = withTiming(scaleTo, {
            duration: PRESS_IN_MS,
            easing: Easing.out(Easing.quad),
          });
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        if (!reducedMotion && !disabled) {
          scale.value = withTiming(1, {
            duration: PRESS_OUT_MS,
            easing: Easing.out(Easing.quad),
          });
        }
        onPressOut?.(event);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
