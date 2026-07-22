/**
 * Select the blocks that appear on a single day — direct matches plus
 * projected recurring occurrences — sorted by start time.
 *
 * We read the raw `blocks`/`recurrences` arrays (stable references) from the
 * store and derive the day's list with `useMemo`. Returning a freshly built
 * array straight from the Zustand selector would break its
 * `useSyncExternalStore` equality check and loop.
 */
import { useMemo } from "react";

import type { Block } from "@/types/block";
import { useBlockStore } from "@/store/block-store";
import { blocksForDay } from "../utils/recurrence";

export function useDayBlocks(day: string): Block[] {
  const blocks = useBlockStore((state) => state.blocks);
  const recurrences = useBlockStore((state) => state.recurrences);
  return useMemo(
    () => blocksForDay(blocks, recurrences, day),
    [blocks, recurrences, day],
  );
}
