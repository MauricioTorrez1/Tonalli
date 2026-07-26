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

// `shouldPlaySound: true` lets the per-notification `sound` field decide.
// Leaving it false silenced everything, including blocks whose owner asked for
// a sound; the mute switch is `content.sound` and the Android channel, below.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Android channel ids. Two of them, because on Android a notification's sound
 * is a property of its *channel*, fixed when the channel is created — setting
 * `content.sound` there does nothing. Muting one block therefore means routing
 * it to a channel that was created silent, not changing the notification.
 */
export const SOUND_CHANNEL_ID = "default";
export const SILENT_CHANNEL_ID = "silent";

/** Must run once at startup, before any notification is scheduled on Android. */
export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }
  await Notifications.setNotificationChannelAsync(SOUND_CHANNEL_ID, {
    name: "Bloques",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  await Notifications.setNotificationChannelAsync(SILENT_CHANNEL_ID, {
    name: "Bloques (sin sonido)",
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: null,
  });
}

/**
 * True on every platform where a *scheduled* (future-dated) local
 * notification actually works. `expo-notifications`' scheduler has no web
 * implementation — `NotificationScheduler.ts`, the module Metro resolves for
 * web, only stubs `addListener`/`removeListeners`; calling
 * `scheduleNotificationAsync` there throws `UnavailabilityError` (confirmed
 * by reading the package source, not assumed). Permission APIs *do* work on
 * web (they talk to the browser's own `Notification` API), which is exactly
 * why scheduling can't be guarded by a permission check alone.
 */
export const supportsScheduledNotifications = Platform.OS !== "web";

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

/**
 * Translate a domain trigger into Expo's input shape.
 *
 * `channelId` rides along on the *trigger*, not the content — that is where
 * expo-notifications reads it. It is ignored outside Android.
 */
function toExpoTrigger(
  trigger: NotificationTrigger,
  channelId: string,
): Notifications.SchedulableNotificationTriggerInput {
  switch (trigger.kind) {
    case "date":
      return {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger.date,
        channelId,
      };
    case "daily":
      return {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: trigger.hour,
        minute: trigger.minute,
        channelId,
      };
    case "weekly":
      return {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: trigger.expoWeekday,
        hour: trigger.hour,
        minute: trigger.minute,
        channelId,
      };
  }
}

/**
 * Schedule every notification a block needs. Returns their ids for later
 * cancellation. No-ops on web — see `supportsScheduledNotifications`.
 */
export async function scheduleForBlock(
  block: Block,
  recurrence: Recurrence | undefined,
  now: Date = new Date(),
): Promise<string[]> {
  if (!supportsScheduledNotifications) {
    return [];
  }
  const triggers = buildTriggersForBlock(block, recurrence, now);
  const channelId = block.soundEnabled ? SOUND_CHANNEL_ID : SILENT_CHANNEL_ID;
  const ids = await Promise.all(
    triggers.map((trigger) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: block.title,
          body: trigger.body,
          // iOS reads this field; Android ignores it and takes the sound from
          // the channel, which is why both are driven by the same flag.
          sound: block.soundEnabled ? "default" : false,
        },
        trigger: toExpoTrigger(trigger, channelId),
      }),
    ),
  );
  return ids;
}

/** No-ops on web — see `supportsScheduledNotifications`. */
export async function cancelNotifications(
  ids: readonly string[],
): Promise<void> {
  if (!supportsScheduledNotifications) {
    return;
  }
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
  );
}
