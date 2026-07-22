/**
 * The day view: a vertical spine of block nodes with the "now" marker woven in
 * at the current time. Uses a plain ScrollView — a day holds ~30 blocks at
 * most, well under the point where list virtualization earns its complexity.
 */
import { useRouter } from "expo-router";
import { Fragment } from "react";
import { ScrollView, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { findCategory } from "@/features/categories/default-categories";
import { nowMinute } from "@/lib/date";
import { useBlockStore } from "@/store/block-store";
import type { Block } from "@/types/block";
import { isCompleted } from "../utils/completions";
import { useReducedMotion } from "../hooks/useReducedMotion";
import {
  getBlockStatus,
  nowIndicatorIndex,
  resolveBlockColor,
  resolveBlockIcon,
} from "../utils/timeline-layout";
import { NowIndicator } from "./NowIndicator";
import { TimelineNode } from "./TimelineNode";

interface DayTimelineProps {
  blocks: Block[];
  /** Human title for the day, e.g. "Hoy". */
  heading: string;
}

export function DayTimeline({ blocks, heading }: DayTimelineProps) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const router = useRouter();
  const completions = useBlockStore((state) => state.completions);
  const toggleComplete = useBlockStore((state) => state.toggleComplete);
  const now = nowMinute();
  const indicatorAt = nowIndicatorIndex(blocks, now);

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
          Aún no hay bloques para hoy. Toca + para crear el primero.
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
                status={getBlockStatus(block, now, isDone)}
                color={resolveBlockColor(block, category)}
                icon={resolveBlockIcon(block, category)}
                index={index}
                reducedMotion={reducedMotion}
                hasNext={index < blocks.length - 1}
                onPress={() =>
                  router.push({
                    pathname: "/block-form",
                    params: { id: block.id },
                  })
                }
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
