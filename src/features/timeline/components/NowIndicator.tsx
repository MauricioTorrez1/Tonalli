/**
 * The "ahora" (now) marker, inserted between blocks at the current time. This is
 * the second and last of the timeline's two animations: a gentle fade-in that
 * draws the eye to where the user is in their day — motion that informs, not
 * decorates. Always terracotta: a single, predictable landmark color, never
 * reused for a category. See docs/adr/0006-vivid-category-colors-on-warm-black.md.
 */
import { Text, View } from "react-native";
import { FadeIn } from "react-native-reanimated";

import { formatMinute } from "@/lib/date";
import { AnimatedView } from "@/ui/AnimatedView";

interface NowIndicatorProps {
  minute: number;
  reducedMotion: boolean;
}

export function NowIndicator({ minute, reducedMotion }: NowIndicatorProps) {
  return (
    <AnimatedView
      entering={reducedMotion ? undefined : FadeIn.duration(300)}
      className="flex-row items-center"
      accessibilityRole="text"
      accessibilityLabel={`Ahora, ${formatMinute(minute)}`}
    >
      {/* Dot aligned to the spine rail. */}
      <View className="w-10 items-center">
        <View className="h-3 w-3 rounded-full bg-terracotta-600 dark:bg-terracotta-400" />
      </View>
      <View className="mb-4 flex-1 flex-row items-center">
        <View className="h-0.5 flex-1 bg-terracotta-400 dark:bg-terracotta-500/60" />
        <Text className="ml-2 text-xs font-raleway-bold text-terracotta-600 dark:text-terracotta-300">
          {formatMinute(minute)}
        </Text>
      </View>
    </AnimatedView>
  );
}
