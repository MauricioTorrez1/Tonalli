/**
 * The "ahora" (now) marker, inserted between blocks at the current time.
 *
 * Always terracotta: a single, predictable landmark color, never reused for a
 * category. See docs/adr/0006-vivid-category-colors-on-warm-black.md.
 *
 * The dot breathes on a slow loop. This is the one continuous motion the app
 * allows, and the slowness is the point — a fast pulse reads as an alarm, a
 * slow one as a heartbeat. It exists because "where am I in my day" is the
 * question the whole screen is organized around, so the answer should be
 * findable without reading anything. See
 * docs/adr/0010-animation-allowlist.md.
 */
import { useEffect } from "react";
import { Text, View } from "react-native";
import {
  Easing,
  FadeIn,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { formatMinute } from "@/lib/date";
import { AnimatedView } from "@/ui/AnimatedView";

interface NowIndicatorProps {
  minute: number;
  reducedMotion: boolean;
}

/** One half-cycle. 1.2s each way puts a full breath at 2.4s. */
const PULSE_MS = 1200;

export function NowIndicator({ minute, reducedMotion }: NowIndicatorProps) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(pulse);
      pulse.value = 0;
      return;
    }

    const easing = Easing.inOut(Easing.quad);
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: PULSE_MS, easing }),
        withTiming(0, { duration: PULSE_MS, easing }),
      ),
      -1,
      // The sequence already runs out and back, so reversing would play the
      // return leg twice.
      false,
    );

    return () => cancelAnimation(pulse);
  }, [reducedMotion, pulse]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + 0.18 * pulse.value }],
    opacity: 1 - 0.25 * pulse.value,
  }));

  return (
    <AnimatedView
      entering={reducedMotion ? undefined : FadeIn.duration(300)}
      className="flex-row items-center"
      accessibilityRole="text"
      accessibilityLabel={`Ahora, ${formatMinute(minute)}`}
    >
      {/* Dot aligned to the spine rail. */}
      <View className="w-10 items-center">
        <AnimatedView
          style={dotStyle}
          className="h-3 w-3 rounded-full bg-terracotta-600 dark:bg-terracotta-400"
        />
      </View>
      <View className="mb-4 flex-1 flex-row items-center">
        <View className="h-0.5 flex-1 bg-terracotta-400 dark:bg-terracotta-500/60" />
        <Text className="ml-2 font-raleway-bold text-xs text-terracotta-600 dark:text-terracotta-300">
          {formatMinute(minute)}
        </Text>
      </View>
    </AnimatedView>
  );
}
