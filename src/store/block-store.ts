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
import {
  LEGACY_EMOJI_TO_ICON,
  isBlockIconName,
} from "@/features/categories/block-icons";
import { LEGACY_TOKEN_TO_HEX } from "@/theme/colors";
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
const STORAGE_VERSION = 3;

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

  /**
   * Replace all blocks, recurrences, and completions with a restored backup.
   * Clears notificationIdsByBlock — the old ids reference OS-level scheduled
   * notifications on whatever device made the backup, meaningless here; the
   * restore flow in settings.tsx re-schedules fresh ones afterward.
   */
  restoreBackup: (backup: {
    blocks: Block[];
    recurrences: Recurrence[];
    completions: Completion[];
  }) => void;
}

function emptyPersistedState(): PersistedShape {
  return {
    blocks: [],
    recurrences: [],
    completions: [],
    notificationIdsByBlock: {},
  };
}

/**
 * Parse each item against its schema, keeping the parsed result and dropping
 * whatever fails.
 *
 * Keeping the *parsed* value matters, not just the verdict: this used to filter
 * on `safeParse().success` and then keep the raw object, which meant Zod's
 * `.default()` values were computed and thrown away. Fields added in a later
 * version (`subtasks`, `alerts`, `soundEnabled`) would have come back from
 * storage undefined on every block written before them, and every read site
 * would have needed its own fallback.
 */
function parseAll<T>(
  value: unknown,
  schema: { safeParse: (input: unknown) => { success: boolean; data?: T } },
  fallback: T[],
): T[] {
  if (!Array.isArray(value)) {
    return fallback;
  }
  const parsed: T[] = [];
  for (const item of value) {
    const result = schema.safeParse(item);
    if (result.success && result.data !== undefined) {
      parsed.push(result.data);
    }
  }
  return parsed;
}

/** Keep only the items that pass their schema; silently drop the rest. */
export function sanitize(raw: unknown): PersistedShape {
  const fallback = emptyPersistedState();
  if (typeof raw !== "object" || raw === null) {
    return fallback;
  }
  const candidate = raw as Partial<PersistedShape>;

  const blocks = parseAll<Block>(
    candidate.blocks,
    blockSchema,
    fallback.blocks,
  );

  const recurrences = parseAll<Recurrence>(
    candidate.recurrences,
    recurrenceSchema,
    fallback.recurrences,
  );

  const completions = parseAll<Completion>(
    candidate.completions,
    completionSchema,
    fallback.completions,
  );

  const notificationIdsByBlock =
    typeof candidate.notificationIdsByBlock === "object" &&
    candidate.notificationIdsByBlock !== null
      ? candidate.notificationIdsByBlock
      : fallback.notificationIdsByBlock;

  return { blocks, recurrences, completions, notificationIdsByBlock };
}

/**
 * The block shape as v2 stored it: a color *token* rather than hex, an emoji
 * for the icon, and none of the fields v3 added. Written out rather than
 * derived from `Block`, because the whole point of a migration is that the old
 * shape and the current one have diverged — deriving it would make the
 * migration silently follow future schema changes and stop describing the data
 * it actually reads.
 */
interface V2Block {
  id: string;
  title: string;
  notes?: string;
  icon?: string;
  color?: string;
  categoryId?: string;
  day: string;
  startMinute: number;
  endMinute: number;
  recurrenceId?: string;
  createdAt: number;
  updatedAt: number;
}

interface V2Shape {
  blocks: V2Block[];
  recurrences: Recurrence[];
  completions: Completion[];
  notificationIdsByBlock: Record<string, string[]>;
}

/**
 * v1 stored a nullable `completedAt` directly on each block, and `color` was
 * required, drawn from a palette (`sage` / `terracotta` / `sand`) that Phase 1
 * retired in favor of the vivid category tokens (see ADR 6). `color` is
 * loosely typed here rather than reusing `Block["color"]` because real,
 * already-persisted v1 data will contain those old, now-invalid values.
 */
interface V1Block extends Omit<V2Block, "color"> {
  color: string;
  completedAt: number | null;
}

export function migrateV1ToV2(v1: { blocks: V1Block[] }): V2Shape {
  const completions: Completion[] = [];
  const blocks: V2Block[] = v1.blocks.map((block) => {
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
      // color until the user assigns it a category.
      color: Object.prototype.hasOwnProperty.call(LEGACY_TOKEN_TO_HEX, color)
        ? color
        : undefined,
    };
  });
  return { blocks, recurrences: [], completions, notificationIdsByBlock: {} };
}

/**
 * v3 replaced the closed set of color tokens with free-form hex (ADR 12) and
 * emoji icons with monochrome glyph names (ADR 11), and added subtasks, alerts
 * and the per-block sound toggle.
 *
 * Anything unrecognised is dropped rather than guessed at. A block that loses
 * its color or icon here still renders — it falls back to its category's, or
 * to the neutral default — whereas a wrong guess would silently rewrite a
 * choice the user made.
 */
export function migrateV2ToV3(v2: V2Shape): PersistedShape {
  const blocks: Block[] = v2.blocks.map((block) => ({
    ...block,
    color: block.color ? LEGACY_TOKEN_TO_HEX[block.color] : undefined,
    icon: migrateIcon(block.icon),
    subtasks: [],
    alerts: [],
    soundEnabled: true,
  }));
  return {
    blocks,
    recurrences: v2.recurrences,
    completions: v2.completions,
    notificationIdsByBlock: v2.notificationIdsByBlock,
  };
}

/**
 * Translate a stored icon into a v3 glyph name.
 *
 * Handles both directions of an interrupted upgrade: an emoji from v2 gets
 * mapped, and a value that is already a glyph name is passed through, so
 * re-running the migration is harmless.
 */
function migrateIcon(icon: string | undefined): string | undefined {
  if (!icon) {
    return undefined;
  }
  if (isBlockIconName(icon)) {
    return icon;
  }
  return LEGACY_EMOJI_TO_ICON[icon];
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

      restoreBackup: (backup) => {
        set({
          blocks: backup.blocks,
          recurrences: backup.recurrences,
          completions: backup.completions,
          notificationIdsByBlock: {},
        });
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
      // Migrations chain: a store last written at v1 runs through both steps.
      migrate: (persistedState, version) => {
        const v2 =
          version < 2
            ? migrateV1ToV2(persistedState as { blocks: V1Block[] })
            : (persistedState as V2Shape);
        return version < 3
          ? migrateV2ToV3(v2)
          : (persistedState as PersistedShape);
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
