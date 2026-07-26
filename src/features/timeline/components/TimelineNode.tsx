/**
 * A single block rendered as a node on the vertical spine.
 *
 * Focus-first rule, unchanged from ADR 0006 and reinforced by the reference
 * design: only the *current* block is visually loud — a filled card in its own
 * color. Every other block is a quiet row on the spine, so the eye lands on
 * "now" without the rest of the day competing for it.
 *
 * The resting state lost its border and tinted background in the redesign
 * (ADR 0011). A day of outlined cards is a day of boxes; a day of rows
 * separated by hairlines is a list you can read down. The block's color still
 * identifies it — it just lives in the rail pill and its icon instead of
 * ringing the whole card.
 */
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { FadeInDown } from "react-native-reanimated";

import { formatDuration, formatMinute, speakMinute } from "@/lib/date";
import { AnimatedView } from "@/ui/AnimatedView";
import { Checkbox } from "@/ui/Checkbox";
import { resolveBlockColorStyles } from "@/theme/block-color";
import { useThemeColors } from "@/theme/useThemeColors";
import {
  FALLBACK_ICON,
  type BlockIconName,
} from "@/features/categories/block-icons";
import type { Block } from "@/types/block";
import type { BlockStatus } from "../utils/timeline-layout";

interface TimelineNodeProps {
  block: Block;
  status: BlockStatus;
  /** The block's resolved color, as `#RRGGBB`. */
  color: string;
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
  const { isDark } = useThemeColors();
  const style = resolveBlockColorStyles(color, isDark);
  const isCurrent = status === "current";
  const isCompleted = status === "completed";
  const isPast = status === "past";
  const glyph = (icon ?? FALLBACK_ICON) as BlockIconName;

  const duration = formatDuration(block.endMinute - block.startMinute);
  const doneCount = block.subtasks.filter((subtask) => subtask.done).length;

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
      className={isPast ? "flex-row opacity-50" : "flex-row"}
    >
      {/* Left rail: the spine, with this node's pill sitting on it. The two
          segments are drawn before the pill, so the pill's opaque fill paints
          over them — RN honors source order, no z-index needed. */}
      <View className="w-11 items-center">
        {hasPrev ? (
          <View className="absolute top-0 h-6 w-0.5 bg-sand dark:bg-nightRaised" />
        ) : null}
        {hasNext ? (
          <View className="absolute bottom-0 top-16 w-0.5 bg-sand dark:bg-nightRaised" />
        ) : null}
        <View
          className="mt-3 h-12 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: isCurrent ? style.solid : style.pill }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <MaterialCommunityIcons
            name={glyph}
            size={20}
            color={isCurrent ? style.onSolid : style.onPill}
          />
        </View>
      </View>

      {/* Right: the block itself. Filled card while it is happening, plain row
          the rest of the time. */}
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Toca para editar el bloque, mantén presionado para reprogramar"
        className={
          isCurrent
            ? "mb-3 ml-2 flex-1 flex-row items-center rounded-card p-4"
            : "mb-3 ml-2 flex-1 flex-row items-center border-b border-sand py-3 pr-1 dark:border-nightSurface"
        }
        style={isCurrent ? { backgroundColor: style.solid } : undefined}
      >
        <View className="flex-1">
          <Text
            className={`font-raleway-medium text-xs ${
              isCurrent ? "" : "text-ink-soft dark:text-ink-invsoft"
            }`}
            style={
              isCurrent ? { color: style.onSolid, opacity: 0.8 } : undefined
            }
          >
            {formatMinute(block.startMinute)}–{formatMinute(block.endMinute)}
            {"  ·  "}
            {duration}
          </Text>
          <Text
            numberOfLines={2}
            className={`mt-0.5 font-raleway-semibold text-base ${
              isCurrent
                ? ""
                : isCompleted
                  ? "text-ink-muted line-through dark:text-ink-invmuted"
                  : "text-ink dark:text-ink-inverse"
            }`}
            style={isCurrent ? { color: style.onSolid } : undefined}
          >
            {block.title}
          </Text>

          {/* Subtask progress, only once there are any — an empty "0/0" is
              noise on every block that does not use the feature. */}
          {block.subtasks.length > 0 ? (
            <Text
              className={`mt-1 font-raleway text-xs ${
                isCurrent ? "" : "text-ink-soft dark:text-ink-invsoft"
              }`}
              style={
                isCurrent ? { color: style.onSolid, opacity: 0.8 } : undefined
              }
            >
              {doneCount}/{block.subtasks.length} subtareas
            </Text>
          ) : null}
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
