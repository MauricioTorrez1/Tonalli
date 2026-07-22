import { migrateV1ToV2, sanitize } from "@/store/block-store";

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
    expect(result.blocks).toEqual([valid]);
  });

  it("falls back to an empty notificationIdsByBlock when malformed", () => {
    const result = sanitize({ blocks: [], notificationIdsByBlock: "nope" });
    expect(result.notificationIdsByBlock).toEqual({});
  });
});
