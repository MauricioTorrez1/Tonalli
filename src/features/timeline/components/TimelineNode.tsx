/**
 * A single block rendered as a node on the vertical spine.
 *
 * Focus-first rule: only the *current* block is visually loud — a solid fill
 * in its own category color. Every other state is a quiet, translucent
 * outline of that same color, so the eye lands on "now" without the rest of
 * the day competing for attention. See
 * docs/adr/0006-vivid-category-colors-on-warm-black.md.
 */
import { Feather } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { formatMinute, speakMinute } from "@/lib/date";
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
  /** False for the last node, so the spine does not run off the bottom. */
  hasNext: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onToggleComplete: () => void;
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
    <Animated.View
      entering={
        reducedMotion ? undefined : FadeInDown.delay(index * 60).duration(250)
      }
      className={isPast ? "flex-row opacity-60" : "flex-row"}
    >
      {/* Left rail: the spine plus this node's dot. */}
      <View className="w-10 items-center">
        {hasNext ? (
          <View className="absolute top-6 bottom-0 w-0.5 bg-sand dark:bg-nightRaised" />
        ) : null}
        <View
          className={`mt-5 h-3.5 w-3.5 rounded-full ${style.dot}`}
          accessibilityElementsHidden
        />
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
            {icon ? `${icon}  ` : ""}
            {block.title}
          </Text>
        </View>

        <Pressable
          onPress={onToggleComplete}
          hitSlop={10}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isCompleted }}
          accessibilityLabel={
            isCompleted ? "Marcar como pendiente" : "Marcar como completado"
          }
          className={`h-7 w-7 items-center justify-center rounded-full border-2 ${
            isCompleted
              ? "border-sage-500 bg-sage-500"
              : isCurrent
                ? "border-white/70"
                : "border-ink-soft/40 dark:border-ink-invsoft/40"
          }`}
        >
          {isCompleted ? (
            <Feather name="check" size={14} color="white" />
          ) : null}
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

export const TimelineNode = memo(TimelineNodeComponent);
