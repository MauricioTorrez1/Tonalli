/**
 * A single block rendered as a node on the vertical spine.
 *
 * Focus-first rule: only the *current* block is visually loud — a solid fill
 * in its own category color. Every other state is a quiet, translucent
 * outline of that same color, so the eye lands on "now" without the rest of
 * the day competing for attention. See
 * docs/adr/0006-vivid-category-colors-on-warm-black.md.
 */
import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { FadeInDown } from "react-native-reanimated";

import { formatMinute, speakMinute } from "@/lib/date";
import { AnimatedView } from "@/ui/AnimatedView";
import { Checkbox } from "@/ui/Checkbox";
import { CATEGORY_STYLES } from "@/theme/category-styles";
import type { ColorToken } from "@/theme/colors";
import type { Block } from "@/types/block";
import type { BlockStatus } from "../utils/timeline-layout";

interface TimelineNodeProps {
  block: Block;
  status: BlockStatus;
  color: ColorToken;
  icon: string | undefined;
  /** Position in the list, used to stagger the entrance animation. */
  index: number;
  /** When true, skip the entrance animation entirely. */
  reducedMotion: boolean;
  /** False for the first node, so the spine does not run off the top. */
  hasPrev: boolean;
  /** False for the last node, so the spine does not run off the bottom. */
  hasNext: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onToggleComplete: () => void;
}

/**
 * Delay before a node's entrance, staggered by its position in the day.
 *
 * The stagger is capped because it used to be unbounded: at 60ms per node a
 * full 30-block day took 1.8s to finish appearing, so the bottom of the list
 * was still animating long after the user had started reading the top.
 * Beyond the first handful the effect is invisible anyway.
 *
 * @param index - The node's position in the day, from zero.
 * @returns Delay in milliseconds.
 */
function entranceDelay(index: number): number {
  return Math.min(index, 8) * 40;
}

const STATUS_LABEL: Record<BlockStatus, string> = {
  current: "en curso",
  upcoming: "pendiente",
  past: "pasado",
  completed: "completado",
};

function TimelineNodeComponent({
  block,
  status,
  color,
  icon,
  index,
  reducedMotion,
  hasPrev,
  hasNext,
  onPress,
  onLongPress,
  onToggleComplete,
}: TimelineNodeProps) {
  const style = CATEGORY_STYLES[color];
  const isCurrent = status === "current";
  const isCompleted = status === "completed";
  const isPast = status === "past";

  const accessibilityLabel = `${block.title}, de ${speakMinute(
    block.startMinute,
  )} a ${speakMinute(block.endMinute)}, ${STATUS_LABEL[status]}`;

  return (
    <AnimatedView
      entering={
        reducedMotion
          ? undefined
          : FadeInDown.delay(entranceDelay(index)).duration(250)
      }
      className={isPast ? "flex-row opacity-60" : "flex-row"}
    >
      {/* Left rail: the spine, with this node's category pill sitting on it.
          The two segments are drawn before the pill, so the pill's opaque fill
          paints over them — RN honors source order, no z-index needed. The
          8px overlap at each end stops the pill's rounding from leaving a
          hairline gap where the line meets it. */}
      <View className="w-10 items-center">
        {hasPrev ? (
          <View className="absolute top-0 h-6 w-0.5 bg-sand dark:bg-nightRaised" />
        ) : null}
        {hasNext ? (
          <View className="absolute bottom-0 top-14 w-0.5 bg-sand dark:bg-nightRaised" />
        ) : null}
        <View
          className={`mt-4 h-10 w-7 items-center justify-center rounded-full ${
            isCurrent ? style.solidBg : style.pillBg
          }`}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {icon ? <Text className="text-base leading-5">{icon}</Text> : null}
        </View>
      </View>

      {/* Right: the block card. */}
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Toca para editar el bloque, mantén presionado para reprogramar"
        className={`mb-4 flex-1 flex-row items-center rounded-card border p-4 ${
          isCurrent
            ? `${style.solidBg} border-transparent`
            : `${style.softBg} ${style.softBorder}`
        }`}
      >
        <View className="flex-1">
          <Text
            className={`font-raleway-medium text-xs ${
              isCurrent
                ? "text-white/80"
                : "text-ink-soft dark:text-ink-invsoft"
            }`}
          >
            {formatMinute(block.startMinute)} – {formatMinute(block.endMinute)}
          </Text>
          <Text
            className={`mt-1 text-base font-raleway-semibold ${
              isCurrent
                ? "text-white"
                : isCompleted
                  ? "text-ink-muted dark:text-ink-invmuted line-through"
                  : "text-ink dark:text-ink-inverse"
            }`}
          >
            {block.title}
          </Text>
        </View>

        <Checkbox
          checked={isCompleted}
          onToggle={onToggleComplete}
          tone={isCurrent ? "onSolid" : "default"}
          accessibilityLabel={
            isCompleted ? "Marcar como pendiente" : "Marcar como completado"
          }
        />
      </Pressable>
    </AnimatedView>
  );
}

export const TimelineNode = memo(TimelineNodeComponent);
