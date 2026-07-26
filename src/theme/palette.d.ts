/** Ambient types for the CommonJS palette in palette.js. */
type Shade = Record<
  "50" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900",
  string
>;

export declare const colors: {
  accent: {
    DEFAULT: string;
    soft: string;
    dim: string;
    ink: string;
  };
  terracotta: Shade;
  danger: {
    DEFAULT: string;
    soft: string;
  };
  cream: string;
  sand: string;
  night: string;
  nightSurface: string;
  nightRaised: string;
  ink: {
    DEFAULT: string;
    muted: string;
    soft: string;
    inverse: string;
    invmuted: string;
    invsoft: string;
  };
};
