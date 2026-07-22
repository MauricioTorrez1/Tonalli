/**
 * Persisted theme preference: follow the system, or force light/dark.
 *
 * NativeWind owns the actual color-scheme resolution (and listens to system
 * appearance changes on its own); this store only remembers what the user
 * asked for across restarts. `_layout.tsx` applies it via `colorScheme.set`.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const THEME_MODES = ["system", "light", "dark"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "dark",
      setMode: (mode) => set({ mode }),
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "tonalliblock-theme",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
