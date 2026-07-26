/**
 * Shared fixtures.
 *
 * `Block` gained three required fields (`subtasks`, `alerts`, `soundEnabled`)
 * when free-form colors and alerts landed, and every test that built a block
 * literal had to grow the same three lines. One factory means the next field
 * is one edit, not eight.
 */
import type { Block } from "@/types/block";
import type { Recurrence } from "@/types/recurrence";

/** A valid block; overrides win over the defaults. */
export function makeBlock(overrides: Partial<Block> = {}): Block {
  return {
    id: "00000000-0000-4000-8000-000000000000",
    title: "Deep work",
    day: "2026-07-22",
    startMinute: 540,
    endMinute: 600,
    subtasks: [],
    alerts: [],
    soundEnabled: true,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

/** A valid recurrence rule; overrides win over the defaults. */
export function makeRecurrence(
  overrides: Partial<Recurrence> = {},
): Recurrence {
  return {
    id: "r1",
    freq: "daily",
    startsOn: "2026-07-01",
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}
