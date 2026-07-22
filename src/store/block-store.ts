/**
 * Global store: blocks, recurrence rules, completions, and the notification
 * ids scheduled per block. State lives in memory (fast reads) and is mirrored
 * to AsyncStorage by the `persist` middleware.
 *
 * Two persist hooks do different jobs:
 * - `migrate` runs once, only when the stored `version` is older, and
 *   reshapes the v1 format (a `completedAt` field on each block) into v2
 *   (blocks without it, plus a separate `completions` list).
 * - `merge` runs on *every* hydration and validates each item against its Zod
 *   schema, dropping anything malformed instead of crashing. This is where
 *   ADR 3's "validate at the boundary" promise is actually enforced for the
 *   main persisted state — Phase 0 wired the Zod-validated `storage.ts`
 *   helpers but the store itself used zustand's raw JSON storage, so that
 *   promise was unenforced until this pass.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { todayString, nowMinute } from "@/lib/date";
import { isColorToken } from "@/theme/colors";
import { blockSchema, type Block, type NewBlock } from "@/types/block";
import { completionSchema, type Completion } from "@/types/completion";
import {
  recurrenceSchema,
  type NewRecurrence,
  type Recurrence,
} from "@/types/recurrence";
import { uuidv4 } from "@/lib/id";
import { buildSeedBlocks } from "./seed";

const STORAGE_KEY = "tonalliblock-blocks";
const STORAGE_VERSION = 2;

interface PersistedShape {
  blocks: Block[];
  recurrences: Recurrence[];
  completions: Completion[];
  notificationIdsByBlock: Record<string, string[]>;
}

interface BlockState extends PersistedShape {
  /** True once the persisted state has finished loading from AsyncStorage. */
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  /** Insert sample blocks for today if the store is empty. Idempotent. */
  seedIfEmpty: () => void;

  addBlock: (input: NewBlock) => Block;
  updateBlock: (id: string, patch: Partial<NewBlock>) => Block | undefined;
  deleteBlock: (id: string) => void;
  toggleComplete: (blockId: string, day: string) => void;

  addRecurrence: (input: NewRecurrence) => Recurrence;
  deleteRecurrence: (id: string) => void;

  setNotificationIds: (blockId: string, ids: string[]) => void;
}

function emptyPersistedState(): PersistedShape {
  return {
    blocks: [],
    recurrences: [],
    completions: [],
    notificationIdsByBlock: {},
  };
}

/** Keep only the items that pass their schema; silently drop the rest. */
export function sanitize(raw: unknown): PersistedShape {
  const fallback = emptyPersistedState();
  if (typeof raw !== "object" || raw === null) {
    return fallback;
  }
  const candidate = raw as Partial<PersistedShape>;

  const blocks = Array.isArray(candidate.blocks)
    ? candidate.blocks.filter((b) => blockSchema.safeParse(b).success)
    : fallback.blocks;

  const recurrences = Array.isArray(candidate.recurrences)
    ? candidate.recurrences.filter((r) => recurrenceSchema.safeParse(r).success)
    : fallback.recurrences;

  const completions = Array.isArray(candidate.completions)
    ? candidate.completions.filter((c) => completionSchema.safeParse(c).success)
    : fallback.completions;

  const notificationIdsByBlock =
    typeof candidate.notificationIdsByBlock === "object" &&
    candidate.notificationIdsByBlock !== null
      ? candidate.notificationIdsByBlock
      : fallback.notificationIdsByBlock;

  return { blocks, recurrences, completions, notificationIdsByBlock };
}

/**
 * v1 stored a nullable `completedAt` directly on each block, and `color` was
 * required, drawn from a palette (`sage` / `terracotta` / `sand`) that Phase 1
 * retired in favor of the vivid category tokens (see ADR 6). `color` is
 * loosely typed here rather than reusing `Block["color"]` because real,
 * already-persisted v1 data will contain those old, now-invalid values.
 */
interface V1Block extends Omit<Block, "color"> {
  color: string;
  completedAt: number | null;
}

export function migrateV1ToV2(v1: { blocks: V1Block[] }): PersistedShape {
  const completions: Completion[] = [];
  const blocks: Block[] = v1.blocks.map((block) => {
    if (block.completedAt !== null && block.completedAt !== undefined) {
      completions.push({
        blockId: block.id,
        day: block.day,
        completedAt: block.completedAt,
      });
    }
    const { completedAt: _completedAt, color, ...rest } = block;
    return {
      ...rest,
      // Old color tokens (sage/terracotta/sand) no longer exist — drop them
      // rather than fail validation; the block falls back to the neutral
      // "stone" token until the user assigns it a category.
      color: isColorToken(color) ? color : undefined,
    };
  });
  return { blocks, recurrences: [], completions, notificationIdsByBlock: {} };
}

export const useBlockStore = create<BlockState>()(
  persist(
    (set, get) => ({
      ...emptyPersistedState(),
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

      seedIfEmpty: () => {
        if (get().blocks.length > 0) {
          return;
        }
        set({ blocks: buildSeedBlocks(todayString(), nowMinute()) });
      },

      addBlock: (input) => {
        const now = Date.now();
        const block: Block = {
          ...input,
          id: uuidv4(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ blocks: [...state.blocks, block] }));
        return block;
      },

      updateBlock: (id, patch) => {
        let updated: Block | undefined;
        set((state) => ({
          blocks: state.blocks.map((block) => {
            if (block.id !== id) {
              return block;
            }
            updated = { ...block, ...patch, updatedAt: Date.now() };
            return updated;
          }),
        }));
        return updated;
      },

      deleteBlock: (id) => {
        set((state) => {
          const { [id]: _removed, ...notificationIdsByBlock } =
            state.notificationIdsByBlock;
          return {
            blocks: state.blocks.filter((block) => block.id !== id),
            completions: state.completions.filter((c) => c.blockId !== id),
            notificationIdsByBlock,
          };
        });
      },

      toggleComplete: (blockId, day) => {
        set((state) => {
          const already = state.completions.some(
            (c) => c.blockId === blockId && c.day === day,
          );
          return {
            completions: already
              ? state.completions.filter(
                  (c) => !(c.blockId === blockId && c.day === day),
                )
              : [
                  ...state.completions,
                  { blockId, day, completedAt: Date.now() },
                ],
          };
        });
      },

      addRecurrence: (input) => {
        const now = Date.now();
        const recurrence: Recurrence = {
          ...input,
          id: uuidv4(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ recurrences: [...state.recurrences, recurrence] }));
        return recurrence;
      },

      deleteRecurrence: (id) => {
        set((state) => ({
          recurrences: state.recurrences.filter((r) => r.id !== id),
        }));
      },

      setNotificationIds: (blockId, ids) => {
        set((state) => ({
          notificationIdsByBlock: {
            ...state.notificationIdsByBlock,
            [blockId]: ids,
          },
        }));
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        blocks: state.blocks,
        recurrences: state.recurrences,
        completions: state.completions,
        notificationIdsByBlock: state.notificationIdsByBlock,
      }),
      migrate: (persistedState, version) => {
        if (version < 2) {
          return migrateV1ToV2(persistedState as { blocks: V1Block[] });
        }
        return persistedState as PersistedShape;
      },
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...sanitize(persistedState),
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
