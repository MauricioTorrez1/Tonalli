/**
 * Small, persisted preferences that are about the *interface*, not the data:
 * which icons and colors the user has reached for lately.
 *
 * Kept out of the block store on purpose. That store is the app's domain
 * model — it has a schema, a migration chain, and a backup format. Recently-used
 * lists are disposable convenience state; losing them costs a user nothing, and
 * mixing them in would mean versioning them like real data.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** How many entries each list keeps. Two rows' worth in the picker. */
const MAX_RECENT = 10;

interface UiPrefsState {
  /** Icon glyph names, most recently used first. */
  recentIcons: string[];
  /** Custom `#RRGGBB` values, most recently used first. */
  recentColors: string[];
  rememberIcon: (icon: string) => void;
  rememberColor: (hex: string) => void;
}

/** Move `value` to the front, de-duplicating and capping the list. */
function promote(list: readonly string[], value: string): string[] {
  return [value, ...list.filter((item) => item !== value)].slice(0, MAX_RECENT);
}

export const useUiPrefsStore = create<UiPrefsState>()(
  persist(
    (set) => ({
      recentIcons: [],
      recentColors: [],
      rememberIcon: (icon) =>
        set((state) => ({ recentIcons: promote(state.recentIcons, icon) })),
      rememberColor: (hex) =>
        set((state) => ({
          recentColors: promote(state.recentColors, hex.toUpperCase()),
        })),
    }),
    {
      name: "tonalliblock-ui-prefs",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
