/**
 * Sample data for a fresh install, so the timeline shows something meaningful
 * before the user has created anything. Phase 1 replaces this with real CRUD.
 */
import { uuidv4 } from "@/lib/id";
import type { Block, NewBlock } from "@/types/block";

type SeedTemplate = Pick<
  NewBlock,
  "title" | "categoryId" | "startMinute" | "endMinute"
>;

const SEED_TEMPLATES: readonly SeedTemplate[] = [
  {
    title: "Ritual matutino",
    categoryId: "personal",
    startMinute: 420,
    endMinute: 480,
  },
  {
    title: "Deep work",
    categoryId: "enfoque",
    startMinute: 540,
    endMinute: 660,
  },
  {
    title: "ComidaA",
    categoryId: "personal",
    startMinute: 780,
    endMinute: 840,
  },
  {
    title: "Ejercicio",
    categoryId: "movimiento",
    startMinute: 1080,
    endMinute: 1140,
  },
  {
    title: "Lectura",
    categoryId: "bienestar",
    startMinute: 1290,
    endMinute: 1350,
  },
];

/** Build the seed blocks for a given day. Pure: the clock is passed in. */
export function buildSeedBlocks(day: string, now: number): Block[] {
  return SEED_TEMPLATES.map((template) => ({
    ...template,
    id: uuidv4(),
    day,
    createdAt: now,
    updatedAt: now,
  }));
}
