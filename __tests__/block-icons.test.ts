import {
  BLOCK_ICONS,
  isBlockIconName,
  LEGACY_EMOJI_TO_ICON,
  searchBlockIcons,
} from "@/features/categories/block-icons";

describe("BLOCK_ICONS", () => {
  it("has no duplicate glyphs", () => {
    const names = BLOCK_ICONS.map((icon) => icon.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("gives every icon at least one search keyword", () => {
    const bare = BLOCK_ICONS.filter((icon) => icon.keywords.length === 0);
    expect(bare).toEqual([]);
  });
});

describe("LEGACY_EMOJI_TO_ICON", () => {
  it("maps every retired emoji to a glyph the app still offers", () => {
    // A mapping that points at a removed glyph would migrate a block to an
    // icon that cannot render — worse than dropping it.
    const unknown = Object.entries(LEGACY_EMOJI_TO_ICON).filter(
      ([, glyph]) => !isBlockIconName(glyph),
    );
    expect(unknown).toEqual([]);
  });
});

describe("isBlockIconName", () => {
  it("accepts a glyph in the set", () => {
    expect(isBlockIconName("pill")).toBe(true);
  });

  it("rejects an emoji", () => {
    expect(isBlockIconName("💊")).toBe(false);
  });

  it("rejects a non-string", () => {
    expect(isBlockIconName(undefined)).toBe(false);
  });
});

describe("searchBlockIcons", () => {
  it("returns everything for a blank query", () => {
    expect(searchBlockIcons("  ")).toBe(BLOCK_ICONS);
  });

  it("matches on the glyph name", () => {
    expect(searchBlockIcons("pill").map((i) => i.name)).toContain("pill");
  });

  it("matches on a Spanish keyword", () => {
    expect(searchBlockIcons("medicina").map((i) => i.name)).toContain("pill");
  });

  it("ignores accents in the query", () => {
    // "meditación" typed with the accent has to find the keyword "meditacion".
    expect(searchBlockIcons("meditación").map((i) => i.name)).toContain(
      "meditation",
    );
  });

  it("ignores case", () => {
    expect(searchBlockIcons("CORRER").map((i) => i.name)).toContain("run");
  });

  it("returns nothing for a query that matches no icon", () => {
    expect(searchBlockIcons("zzzzz")).toEqual([]);
  });
});
