/**
 * The "ahora" (now) marker, inserted between blocks at the current time. This is
 * the second and last of the timeline's two animations: a gentle fade-in that
 * draws the eye to where the user is in their day — motion that informs, not
 * decorates.
 */
import { Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { formatMinute } from "@/lib/date";

interface NowIndicatorProps {
  minute: number;
  reducedMotion: boolean;
}

export function NowIndicator({ minute, reducedMotion }: NowIndicatorProps) {
  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeIn.duration(300)}
      className="flex-row items-center"
      accessibilityRole="text"
      accessibilityLabel={`Ahora, ${formatMinute(minute)}`}
    >
      {/* Dot aligned to the spine rail. */}
      <View className="w-10 items-center">
        <View className="h-3 w-3 rounded-full bg-terracotta-600" />
      </View>
      <View className="mb-4 flex-1 flex-row items-center">
        <View className="h-0.5 flex-1 bg-terracotta-400" />
        <Text className="ml-2 font-raleway-bold text-terracotta-600 text-xs">
          {formatMinute(minute)}
        </Text>
      </View>
    </Animated.View>
  );
}
