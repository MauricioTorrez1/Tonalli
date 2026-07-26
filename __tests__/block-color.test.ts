import {
  blend,
  contrastRatio,
  ensureContrast,
  hexToHsl,
  hexToRgb,
  hslToHex,
  readableTextOn,
  relativeLuminance,
  resolveBlockColorStyles,
  rgbToHex,
  withAlpha,
} from "@/theme/block-color";
import { NEUTRAL_BLOCK_COLOR } from "@/theme/colors";

describe("hexToRgb", () => {
  it("splits a hex color into channels", () => {
    expect(hexToRgb("#5B8DEF")).toEqual({ r: 91, g: 141, b: 239 });
  });

  it("is case insensitive", () => {
    expect(hexToRgb("#5b8def")).toEqual(hexToRgb("#5B8DEF"));
  });

  it("falls back to the neutral color rather than throwing on garbage", () => {
    // A corrupt stored value should render gray, not take down the timeline.
    expect(hexToRgb("not a color")).toEqual(hexToRgb(NEUTRAL_BLOCK_COLOR));
  });
});

describe("rgbToHex", () => {
  it("round-trips with hexToRgb", () => {
    expect(rgbToHex(hexToRgb("#4FB286"))).toBe("#4FB286");
  });

  it("clamps and rounds out-of-range channels", () => {
    expect(rgbToHex({ r: -20, g: 255.6, b: 300 })).toBe("#00FFFF");
  });
});

describe("withAlpha", () => {
  it("produces an rgba string at the requested opacity", () => {
    expect(withAlpha("#000000", 0.2)).toBe("rgba(0, 0, 0, 0.2)");
  });
});

describe("blend", () => {
  it("returns the original color at amount 0", () => {
    expect(blend("#5B8DEF", "#000000", 0)).toBe("#5B8DEF");
  });

  it("returns the target color at amount 1", () => {
    expect(blend("#5B8DEF", "#000000", 1)).toBe("#000000");
  });

  it("meets in the middle at amount 0.5", () => {
    expect(blend("#FFFFFF", "#000000", 0.5)).toBe("#808080");
  });

  it("clamps an out-of-range amount", () => {
    expect(blend("#FFFFFF", "#000000", 5)).toBe("#000000");
  });
});

describe("relativeLuminance", () => {
  it("is 0 for black and 1 for white", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0);
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1);
  });
});

describe("contrastRatio", () => {
  it("is 21 between black and white", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21);
  });

  it("is 1 for a color against itself", () => {
    expect(contrastRatio("#5B8DEF", "#5B8DEF")).toBeCloseTo(1);
  });

  it("is symmetric", () => {
    expect(contrastRatio("#5B8DEF", "#000000")).toBeCloseTo(
      contrastRatio("#000000", "#5B8DEF"),
    );
  });
});

describe("readableTextOn", () => {
  it("puts white text on a dark fill", () => {
    expect(readableTextOn("#1B3A6B")).toBe("#FFFFFF");
  });

  it("puts black text on a pale fill", () => {
    // The case that made this necessary: the picker can produce pale yellow,
    // and the old hardcoded white text was unreadable on it.
    expect(readableTextOn("#F7E9A0")).toBe("#000000");
  });

  it("always clears AA for large text against its own fill", () => {
    for (const hex of ["#FFFFFF", "#000000", "#5B8DEF", "#E8E4DC", "#4FB286"]) {
      expect(contrastRatio(hex, readableTextOn(hex))).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("ensureContrast", () => {
  it("leaves a color alone when it already has enough contrast", () => {
    expect(ensureContrast("#FFFFFF", "#000000")).toBe("#FFFFFF");
  });

  it("lightens a dark color so it reads on a black page", () => {
    const adjusted = ensureContrast("#0A1A33", "#000000");
    expect(contrastRatio(adjusted, "#000000")).toBeGreaterThanOrEqual(3);
    expect(relativeLuminance(adjusted)).toBeGreaterThan(
      relativeLuminance("#0A1A33"),
    );
  });

  it("darkens a pale color so it reads on a white page", () => {
    const adjusted = ensureContrast("#FDFBF0", "#FFFFFF");
    expect(contrastRatio(adjusted, "#FFFFFF")).toBeGreaterThanOrEqual(3);
  });
});

describe("hslToHex / hexToHsl", () => {
  it("round-trips a saturated color", () => {
    const hex = "#4FB286";
    const back = hslToHex(hexToHsl(hex));
    expect(back).toBe(hex);
  });

  it("produces pure red at hue 0, full saturation, mid lightness", () => {
    expect(hslToHex({ h: 0, s: 1, l: 0.5 })).toBe("#FF0000");
  });

  it("produces pure green at hue 120", () => {
    expect(hslToHex({ h: 120, s: 1, l: 0.5 })).toBe("#00FF00");
  });

  it("produces pure blue at hue 240", () => {
    expect(hslToHex({ h: 240, s: 1, l: 0.5 })).toBe("#0000FF");
  });

  it("wraps hues past 360", () => {
    expect(hslToHex({ h: 480, s: 1, l: 0.5 })).toBe(
      hslToHex({ h: 120, s: 1, l: 0.5 }),
    );
  });

  it("reports zero saturation for a gray", () => {
    expect(hexToHsl("#808080").s).toBeCloseTo(0);
  });
});

describe("resolveBlockColorStyles", () => {
  it("keeps the color itself as the solid fill", () => {
    expect(resolveBlockColorStyles("#5B8DEF", true).solid).toBe("#5B8DEF");
  });

  it("makes the rail pill opaque, so the spine cannot show through", () => {
    // The pill is painted over the spine; any alpha here would ghost the line.
    const styles = resolveBlockColorStyles("#5B8DEF", true);
    expect(styles.pill).toMatch(/^#[0-9A-F]{6}$/);
  });

  it("keeps the pill glyph legible against the pill", () => {
    for (const hex of ["#5B8DEF", "#E8E4DC", "#1B3A6B"]) {
      const styles = resolveBlockColorStyles(hex, true);
      expect(contrastRatio(styles.onPill, styles.pill)).toBeGreaterThanOrEqual(
        3,
      );
    }
  });

  it("darkens the pill toward black in dark mode and toward white in light", () => {
    const dark = resolveBlockColorStyles("#5B8DEF", true);
    const light = resolveBlockColorStyles("#5B8DEF", false);
    expect(relativeLuminance(dark.pill)).toBeLessThan(
      relativeLuminance(light.pill),
    );
  });

  it("uses a translucent tint for the resting card", () => {
    expect(resolveBlockColorStyles("#5B8DEF", true).soft).toContain("rgba(");
  });
});
