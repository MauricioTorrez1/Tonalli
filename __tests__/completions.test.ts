import type { Completion } from "@/types/completion";
import { isCompleted } from "@/features/timeline/utils/completions";

describe("isCompleted", () => {
  const completions: Completion[] = [
    { blockId: "a", day: "2026-07-22", completedAt: 100 },
  ];

  it("is true for a matching (blockId, day) pair", () => {
    expect(isCompleted(completions, "a", "2026-07-22")).toBe(true);
  });

  it("is false for the same block on a different day (recurring occurrence)", () => {
    expect(isCompleted(completions, "a", "2026-07-23")).toBe(false);
  });

  it("is false for a different block", () => {
    expect(isCompleted(completions, "b", "2026-07-22")).toBe(false);
  });
});
