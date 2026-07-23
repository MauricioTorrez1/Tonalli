/**
 * Shift a block's start/end time by a fixed number of minutes, keeping its
 * duration, and keep its notifications in sync. Used by the long-press
 * reschedule shortcut — see docs/adr/0007-reschedule-shortcut-not-drag.md for
 * why this replaces free-form drag.
 *
 * Operates on `block.id`, which for a projected recurring occurrence is the
 * template's id — shifting it correctly moves the whole series, matching the
 * "edits act on the whole series" rule from ADR 5. Only `startMinute`/
 * `endMinute` are patched, never `day`, so a series' anchor day is untouched.
 */
import { useCallback } from "react";

import {
  cancelNotifications,
  requestPermission,
  scheduleForBlock,
} from "@/features/notifications/schedule";
import { useBlockStore } from "@/store/block-store";
import type { Block } from "@/types/block";
import { shiftBlockTime } from "../utils/timeline-layout";

export function useRescheduleBlock() {
  const updateBlock = useBlockStore((state) => state.updateBlock);
  const recurrences = useBlockStore((state) => state.recurrences);
  const notificationIdsByBlock = useBlockStore(
    (state) => state.notificationIdsByBlock,
  );
  const setNotificationIds = useBlockStore((state) => state.setNotificationIds);

  return useCallback(
    async (block: Block, deltaMinutes: number) => {
      const shifted = shiftBlockTime(
        block.startMinute,
        block.endMinute,
        deltaMinutes,
      );
      if (shifted.startMinute === block.startMinute) {
        return; // Already at the start/end of the day — nothing to shift.
      }

      const updated = updateBlock(block.id, shifted);
      if (!updated) {
        return;
      }

      await cancelNotifications(notificationIdsByBlock[block.id] ?? []);
      const granted = await requestPermission();
      if (granted) {
        const recurrence = block.recurrenceId
          ? recurrences.find((r) => r.id === block.recurrenceId)
          : undefined;
        const newIds = await scheduleForBlock(updated, recurrence, new Date());
        setNotificationIds(updated.id, newIds);
      }
    },
    [updateBlock, recurrences, notificationIdsByBlock, setNotificationIds],
  );
}
