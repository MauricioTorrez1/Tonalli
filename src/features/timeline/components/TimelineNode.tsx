/**
 * A single block rendered as a node on the vertical spine.
 *
 * Focus-first rule: only the *current* block is visually loud (terracotta
 * accent, full opacity). Every other state is deliberately quiet so the eye
 * lands on "now" without competing signals.
 */
import { memo } from "react";
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { formatMinute, speakMinute } from "@/lib/date";
import type { Block } from "@/types/block";
import type { BlockStatus } from "../utils/timeline-layout";

interface TimelineNodeProps {
  block: Block;
  status: BlockStatus;
  /** Position in the list, used to stagger the entrance animation. */
  index: number;
  /** When true, skip the entrance animation entirely. */
  reducedMotion: boolean;
  /** False for the last node, so the spine does not run off the bottom. */
  hasNext: boolean;
}

const STATUS_STYLES: Record<
  BlockStatus,
  { card: string; dot: string; title: string; opacity: string }
> = {
  current: {
    card: "bg-terracotta-50 border border-terracotta-500",
    dot: "bg-terracotta-500 h-5 w-5",
    title: "text-ink font-raleway-bold",
    opacity: "opacity-100",
  },
  upcoming: {
    card: "bg-cream border border-sand",
    dot: "bg-sage-400 h-4 w-4",
    title: "text-ink font-raleway-semibold",
    opacity: "opacity-100",
  },
  past: {
    card: "bg-cream border border-sand",
    dot: "bg-sage-300 h-3 w-3",
    title: "text-ink-muted font-raleway-medium",
    opacity: "opacity-60",
  },
  completed: {
    card: "bg-sage-50 border border-sage-200",
    dot: "bg-sage-500 h-4 w-4",
    title: "text-ink-muted font-raleway-medium line-through",
    opacity: "opacity-70",
  },
};

function TimelineNodeComponent({
  block,
  status,
  index,
  reducedMotion,
  hasNext,
}: TimelineNodeProps) {
  const styles = STATUS_STYLES[status];
  const statusLabel: Record<BlockStatus, string> = {
    current: "en curso",
    upcoming: "pendiente",
    past: "pasado",
    completed: "completado",
  };

  const accessibilityLabel = `${block.title}, de ${speakMinute(
    block.startMinute,
  )} a ${speakMinute(block.endMinute)}, ${statusLabel[status]}`;

  return (
    <Animated.View
      entering={
        reducedMotion ? undefined : FadeInDown.delay(index * 60).duration(250)
      }
      className={`flex-row ${styles.opacity}`}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
    >
      {/* Left rail: the spine plus this node's dot. */}
      <View className="w-10 items-center">
        {hasNext ? (
          <View className="absolute top-6 bottom-0 w-0.5 bg-sand" />
        ) : null}
        <View className={`mt-5 rounded-full ${styles.dot}`} />
      </View>

      {/* Right: the block card. */}
      <View className={`mb-4 flex-1 rounded-card p-4 ${styles.card}`}>
        <Text className="font-raleway-medium text-ink-soft text-xs">
          {formatMinute(block.startMinute)} – {formatMinute(block.endMinute)}
        </Text>
        <Text className={`mt-1 text-base ${styles.title}`}>
          {block.icon ? `${block.icon}  ` : ""}
          {block.title}
        </Text>
      </View>
    </Animated.View>
  );
}

export const TimelineNode = memo(TimelineNodeComponent);
