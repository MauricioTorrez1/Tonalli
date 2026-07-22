/**
 * Thin, side-effecting wrapper around `expo-notifications`. Not unit tested —
 * the logic worth testing (which triggers a block needs) lives in triggers.ts.
 * This module only turns those trigger descriptions into real scheduled
 * notifications and back.
 */
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { Block } from "@/types/block";
import type { Recurrence } from "@/types/recurrence";
import { buildTriggersForBlock, type NotificationTrigger } from "./triggers";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Must run once at startup, before any notification is scheduled on Android. */
export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Bloques",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

/** Read-only permission check — does not prompt the user. */
export async function checkPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  return current.granted;
}

export async function requestPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

function toExpoTrigger(
  trigger: NotificationTrigger,
): Notifications.SchedulableNotificationTriggerInput {
  switch (trigger.kind) {
    case "date":
      return {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger.date,
      };
    case "daily":
      return {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: trigger.hour,
        minute: trigger.minute,
      };
    case "weekly":
      return {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: trigger.expoWeekday,
        hour: trigger.hour,
        minute: trigger.minute,
      };
  }
}

/** Schedule every notification a block needs. Returns their ids for later cancellation. */
export async function scheduleForBlock(
  block: Block,
  recurrence: Recurrence | undefined,
  now: Date = new Date(),
): Promise<string[]> {
  const triggers = buildTriggersForBlock(block, recurrence, now);
  const ids = await Promise.all(
    triggers.map((trigger) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: block.title,
          body: "Es hora de tu bloque.",
        },
        trigger: toExpoTrigger(trigger),
      }),
    ),
  );
  return ids;
}

export async function cancelNotifications(
  ids: readonly string[],
): Promise<void> {
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
  );
}
