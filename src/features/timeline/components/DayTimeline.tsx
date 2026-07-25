/**
 * The day view: a vertical spine of block nodes with the "now" marker woven in
 * at the current time — only when the viewed day actually is today. Uses a
 * plain ScrollView — a day holds ~30 blocks at most, well under the point
 * where list virtualization earns its complexity.
 */
import { useRouter } from "expo-router";
import { Fragment } from "react";
import { Alert, ScrollView, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { findCategory } from "@/features/categories/default-categories";
import { nowMinute, todayString, type DayString } from "@/lib/date";
import { useBlockStore } from "@/store/block-store";
import type { Block } from "@/types/block";
import { useReducedMotionValue } from "@/ui/motion";
import { isCompleted } from "../utils/completions";
import { useRescheduleBlock } from "../hooks/useRescheduleBlock";
import {
  getBlockStatus,
  nowIndicatorIndex,
  resolveBlockColor,
  resolveBlockIcon,
} from "../utils/timeline-layout";
import { NowIndicator } from "./NowIndicator";
import { TimelineNode } from "./TimelineNode";

interface DayTimelineProps {
  /** The day being viewed, e.g. from the week strip — not necessarily today. */
  day: DayString;
  blocks: Block[];
  /** Human title for the day, e.g. "Hoy" or "Miércoles 22". */
  heading: string;
}

export function DayTimeline({ day, blocks, heading }: DayTimelineProps) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotionValue();
  const router = useRouter();
  const completions = useBlockStore((state) => state.completions);
  const toggleComplete = useBlockStore((state) => state.toggleComplete);
  const rescheduleBlock = useRescheduleBlock();
  const today = todayString();
  const isToday = day === today;
  const now = nowMinute();
  const indicatorAt = isToday ? nowIndicatorIndex(blocks, now) : -1;

  function handleLongPress(block: Block) {
    const seriesNote = block.recurrenceId
      ? " Se aplicará a todas las repeticiones."
      : "";
    Alert.alert(block.title, `Reprogramar este bloque.${seriesNote}`, [
      { text: "Adelantar 15 min", onPress: () => rescheduleBlock(block, -15) },
      { text: "Atrasar 15 min", onPress: () => rescheduleBlock(block, 15) },
      {
        text: "Editar horario completo",
        onPress: () =>
          router.push({ pathname: "/block-form", params: { id: block.id } }),
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  return (
    <ScrollView
      className="flex-1 bg-cream dark:bg-night"
      contentContainerStyle={{
        paddingTop: 8,
        paddingBottom: insets.bottom + 96,
        paddingHorizontal: 20,
      }}
    >
      <Text className="mb-6 font-lora-semibold text-3xl text-ink dark:text-ink-inverse">
        {heading}
      </Text>

      {blocks.length === 0 ? (
        <Text className="mt-12 text-center font-raleway text-ink-muted dark:text-ink-invmuted">
          {isToday
            ? "Aún no hay bloques para hoy. Toca + para crear el primero."
            : "No hay bloques este día."}
        </Text>
      ) : (
        blocks.map((block, index) => {
          const category = findCategory(block.categoryId);
          const isDone = isCompleted(completions, block.id, block.day);
          return (
            <Fragment key={`${block.id}-${block.day}`}>
              {index === indicatorAt ? (
                <NowIndicator minute={now} reducedMotion={reducedMotion} />
              ) : null}
              <TimelineNode
                block={block}
                status={getBlockStatus(block, now, isDone, today)}
                color={resolveBlockColor(block, category)}
                icon={resolveBlockIcon(block, category)}
                index={index}
                reducedMotion={reducedMotion}
                hasPrev={index > 0}
                hasNext={index < blocks.length - 1}
                onPress={() =>
                  router.push({
                    pathname: "/block-form",
                    params: { id: block.id },
                  })
                }
                onLongPress={() => handleLongPress(block)}
                onToggleComplete={() => toggleComplete(block.id, block.day)}
              />
            </Fragment>
          );
        })
      )}

      {/* "Now" falls after the last block. */}
      {blocks.length > 0 && indicatorAt === blocks.length ? (
        <NowIndicator minute={now} reducedMotion={reducedMotion} />
      ) : null}
    </ScrollView>
  );
}
