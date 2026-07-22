/**
 * Global block store: the single source of truth for time blocks.
 *
 * State lives in memory (fast reads) and is mirrored to AsyncStorage by the
 * `persist` middleware. `version` enables migrations when the model changes in
 * later phases, so a user's saved data is transformed rather than lost.
 * See docs/adr/0001-offline-only-asyncstorage.md.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { todayString, nowMinute } from "@/lib/date";
import type { Block } from "@/types/block";
import { buildSeedBlocks } from "./seed";

const STORAGE_KEY = "tonalliblock-blocks";
const STORAGE_VERSION = 1;

interface BlockState {
  blocks: Block[];
  /** True once the persisted state has finished loading from AsyncStorage. */
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  /** Insert sample blocks for today if the store is empty. Idempotent. */
  seedIfEmpty: () => void;
}

export const useBlockStore = create<BlockState>()(
  persist(
    (set, get) => ({
      blocks: [],
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      seedIfEmpty: () => {
        if (get().blocks.length > 0) {
          return;
        }
        set({ blocks: buildSeedBlocks(todayString(), nowMinute()) });
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      // Only the data is persisted; hydration flags are runtime-only.
      partialize: (state) => ({ blocks: state.blocks }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
