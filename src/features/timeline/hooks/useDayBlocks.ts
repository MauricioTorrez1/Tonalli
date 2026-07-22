/**
 * Select the blocks for a single day from the store, sorted by start time.
 *
 * We read the raw `blocks` array (a stable reference) from the store and derive
 * the filtered, sorted list with `useMemo`. Returning a freshly built array
 * straight from the Zustand selector would break its `useSyncExternalStore`
 * equality check and loop.
 */
import { useMemo } from "react";

import type { Block } from "@/types/block";
import { useBlockStore } from "@/store/block-store";
import { sortByStart } from "../utils/timeline-layout";

export function useDayBlocks(day: string): Block[] {
  const blocks = useBlockStore((state) => state.blocks);
  return useMemo(
    () => sortByStart(blocks.filter((block) => block.day === day)),
    [blocks, day],
  );
}
