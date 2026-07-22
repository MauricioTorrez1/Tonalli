/**
 * The day view: a vertical spine of block nodes with the "now" marker woven in
 * at the current time. Uses a plain ScrollView — a day holds ~30 blocks at
 * most, well under the point where list virtualization earns its complexity.
 */
import { Fragment } from "react";
import { ScrollView, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { nowMinute } from "@/lib/date";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { getBlockStatus, nowIndicatorIndex } from "../utils/timeline-layout";
import type { Block } from "@/types/block";
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
  const now = nowMinute();
  const indicatorAt = nowIndicatorIndex(blocks, now);

  return (
    <ScrollView
      className="flex-1 bg-cream"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: 20,
      }}
    >
      <Text className="mb-1 font-raleway-medium text-ink-soft text-sm">
        Tonalli
      </Text>
      <Text className="mb-6 font-lora-semibold text-ink text-3xl">
        {heading}
      </Text>

      {blocks.length === 0 ? (
        <Text className="mt-12 text-center font-raleway text-ink-muted">
          Aún no hay bloques para hoy.
        </Text>
      ) : (
        blocks.map((block, index) => (
          <Fragment key={block.id}>
            {index === indicatorAt ? (
              <NowIndicator minute={now} reducedMotion={reducedMotion} />
            ) : null}
            <TimelineNode
              block={block}
              status={getBlockStatus(block, now)}
              index={index}
              reducedMotion={reducedMotion}
              hasNext={index < blocks.length - 1}
            />
          </Fragment>
        ))
      )}

      {/* "Now" falls after the last block. */}
      {blocks.length > 0 && indicatorAt === blocks.length ? (
        <NowIndicator minute={now} reducedMotion={reducedMotion} />
      ) : null}
    </ScrollView>
  );
}
