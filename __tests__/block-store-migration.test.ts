import { migrateV1ToV2, migrateV2ToV3, sanitize } from "@/store/block-store";
import { blockSchema } from "@/types/block";

/** A v2-shaped block: color token, emoji icon, none of the v3 fields. */
function v2Block(overrides: Record<string, unknown> = {}) {
  return {
    id: "00000000-0000-4000-8000-000000000000",
    title: "Deep work",
    day: "2026-07-22",
    startMinute: 540,
    endMinute: 600,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

/** An otherwise-empty v2 store holding the given blocks. */
function v2Store(blocks: ReturnType<typeof v2Block>[]) {
  return {
    blocks,
    recurrences: [],
    completions: [],
    notificationIdsByBlock: {},
  };
}

describe("migrateV1ToV2", () => {
  it("moves a completed block's completedAt into the completions list", () => {
    const result = migrateV1ToV2({
      blocks: [
        {
          id: "b1",
          title: "Done thing",
          color: "sky",
          day: "2026-07-22",
          startMinute: 540,
          endMinute: 600,
          completedAt: 12345,
          createdAt: 0,
          updatedAt: 0,
        },
      ],
    });

    expect(result.completions).toEqual([
      { blockId: "b1", day: "2026-07-22", completedAt: 12345 },
    ]);
    expect(result.blocks[0]).not.toHaveProperty("completedAt");
  });

  it("does not create a completion for an unfinished block", () => {
    const result = migrateV1ToV2({
      blocks: [
        {
          id: "b1",
          title: "Pending",
          color: "sky",
          day: "2026-07-22",
          startMinute: 540,
          endMinute: 600,
          completedAt: null,
          createdAt: 0,
          updatedAt: 0,
        },
      ],
    });
    expect(result.completions).toHaveLength(0);
  });

  it("drops a retired v1 color token (e.g. 'sage') instead of keeping it invalid", () => {
    // Real devices that ran Phase 0 have blocks persisted with these exact
    // values — they must survive migration, not get silently dropped by
    // schema validation in `sanitize` afterward.
    const result = migrateV1ToV2({
      blocks: [
        {
          id: "b1",
          title: "Old seed block",
          color: "sage",
          day: "2026-07-22",
          startMinute: 540,
          endMinute: 600,
          completedAt: null,
          createdAt: 0,
          updatedAt: 0,
        },
      ],
    });
    expect(result.blocks[0].color).toBeUndefined();
  });

  it("keeps a v1 color token that is still valid", () => {
    const result = migrateV1ToV2({
      blocks: [
        {
          id: "b1",
          title: "Still valid",
          color: "mint",
          day: "2026-07-22",
          startMinute: 540,
          endMinute: 600,
          completedAt: null,
          createdAt: 0,
          updatedAt: 0,
        },
      ],
    });
    expect(result.blocks[0].color).toBe("mint");
  });
});

describe("sanitize", () => {
  it("returns empty collections for garbage input", () => {
    expect(sanitize(null)).toEqual({
      blocks: [],
      recurrences: [],
      completions: [],
      notificationIdsByBlock: {},
    });
    expect(sanitize("not an object")).toEqual({
      blocks: [],
      recurrences: [],
      completions: [],
      notificationIdsByBlock: {},
    });
  });

  it("drops blocks that fail schema validation, keeps valid ones", () => {
    const valid = {
      id: "00000000-0000-4000-8000-000000000000",
      title: "Valid",
      day: "2026-07-22",
      startMinute: 540,
      endMinute: 600,
      createdAt: 0,
      updatedAt: 0,
    };
    const invalid = { id: "b2", title: "", day: "not-a-day" };
    const result = sanitize({ blocks: [valid, invalid] });
    // The kept block comes back *parsed*, so the fields added in v3 arrive
    // with their schema defaults rather than undefined. That is the point of
    // sanitize returning parsed data instead of the raw input.
    expect(result.blocks).toEqual([
      { ...valid, subtasks: [], alerts: [], soundEnabled: true },
    ]);
  });

  it("falls back to an empty notificationIdsByBlock when malformed", () => {
    const result = sanitize({ blocks: [], notificationIdsByBlock: "nope" });
    expect(result.notificationIdsByBlock).toEqual({});
  });
});

describe("migrateV2ToV3", () => {
  it("turns a color token into its hex equivalent", () => {
    const result = migrateV2ToV3(v2Store([v2Block({ color: "sky" })]));
    expect(result.blocks[0].color).toBe("#5B8DEF");
  });

  it("leaves a block with no color uncolored", () => {
    const result = migrateV2ToV3(v2Store([v2Block()]));
    expect(result.blocks[0].color).toBeUndefined();
  });

  it("drops a color token that no longer exists", () => {
    const result = migrateV2ToV3(v2Store([v2Block({ color: "chartreuse" })]));
    expect(result.blocks[0].color).toBeUndefined();
  });

  it("translates a retired emoji into its glyph name", () => {
    const result = migrateV2ToV3(v2Store([v2Block({ icon: "💊" })]));
    expect(result.blocks[0].icon).toBe("pill");
  });

  it("passes an already-migrated glyph name through untouched", () => {
    // Re-running the migration must not corrupt data it already converted.
    const result = migrateV2ToV3(v2Store([v2Block({ icon: "pill" })]));
    expect(result.blocks[0].icon).toBe("pill");
  });

  it("drops an emoji outside the mapped set rather than guessing", () => {
    const result = migrateV2ToV3(v2Store([v2Block({ icon: "🦕" })]));
    expect(result.blocks[0].icon).toBeUndefined();
  });

  it("gives every migrated block the new fields", () => {
    const result = migrateV2ToV3(v2Store([v2Block()]));
    expect(result.blocks[0]).toMatchObject({
      subtasks: [],
      alerts: [],
      soundEnabled: true,
    });
  });

  it("produces blocks that pass the current schema", () => {
    // The real failure mode of a bad migration: it runs, then every block is
    // silently dropped by `sanitize` on the next hydration.
    const result = migrateV2ToV3(
      v2Store([v2Block({ color: "mint", icon: "🏃" })]),
    );
    expect(blockSchema.safeParse(result.blocks[0]).success).toBe(true);
  });

  it("carries recurrences, completions and notification ids across", () => {
    const store = {
      blocks: [],
      recurrences: [],
      completions: [{ blockId: "b1", day: "2026-07-22", completedAt: 1 }],
      notificationIdsByBlock: { b1: ["n1"] },
    };
    const result = migrateV2ToV3(store);
    expect(result.completions).toEqual(store.completions);
    expect(result.notificationIdsByBlock).toEqual(store.notificationIdsByBlock);
  });
});

describe("v1 through v3", () => {
  it("survives both hops and lands on a schema-valid block", () => {
    const v1 = {
      blocks: [
        {
          id: "00000000-0000-4000-8000-000000000000",
          title: "Old block",
          color: "sky",
          icon: "🎯",
          day: "2026-07-22",
          startMinute: 540,
          endMinute: 600,
          completedAt: 999,
          createdAt: 0,
          updatedAt: 0,
        },
      ],
    };
    const result = migrateV2ToV3(migrateV1ToV2(v1));
    expect(blockSchema.safeParse(result.blocks[0]).success).toBe(true);
    expect(result.blocks[0]).toMatchObject({
      color: "#5B8DEF",
      icon: "target",
      soundEnabled: true,
    });
    expect(result.completions).toHaveLength(1);
  });
});
