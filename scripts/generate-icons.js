/**
 * Generates the app icon set from a simple geometric "T" (Tonalli) monogram —
 * a placeholder brand mark, not final artwork. Uses jimp-compact (already a
 * transitive dependency of @expo/image-utils, pure JS, no native binary)
 * rather than rasterizing an SVG, since drawing two filled rectangles is
 * simpler and more reliable than wiring up an SVG renderer for one mark.
 *
 * Run with: node scripts/generate-icons.js
 * Replace assets/images/*.png with real artwork whenever it exists —
 * app.json's paths won't need to change.
 */
const Jimp = require("jimp-compact");
const path = require("path");

// Native app icons (app.json references these via the Metro asset
// pipeline — hashed URLs, fine for a bundled app).
const NATIVE_DIR = path.join(__dirname, "..", "assets", "images");
// Web/PWA icons need stable, predictable URLs (referenced directly by
// public/manifest.json and src/app/+html.tsx), so they live in public/,
// which Expo's web export copies to the output root as-is.
const WEB_DIR = path.join(__dirname, "..", "public");

// Terracotta-500 — the original Tonalli brand accent (src/theme/palette.js),
// reserved everywhere else in-app for the "now" indicator only, but fitting
// as the one-time identity color for the icon itself.
const BRAND_COLOR = 0xe07a5fff;
const WHITE = 0xffffffff;
const TRANSPARENT = 0x00000000;

/** Composite a bold geometric "T" to onto `image`, centered, `size` tall. */
async function drawT(image, canvasSize, color) {
  const strokeW = Math.round(canvasSize * 0.16);
  const armW = Math.round(canvasSize * 0.5);
  const stemH = Math.round(canvasSize * 0.34);
  const top = Math.round(canvasSize * 0.28);

  const arm = new Jimp(armW, strokeW, color);
  const stem = new Jimp(strokeW, stemH, color);

  image.composite(arm, Math.round((canvasSize - armW) / 2), top);
  image.composite(
    stem,
    Math.round((canvasSize - strokeW) / 2),
    top + strokeW,
  );
}

async function writeIcon(outDir, fileName, size, background) {
  const image = new Jimp(size, size, background);
  await drawT(image, size, background === TRANSPARENT ? BRAND_COLOR : WHITE);
  await image.writeAsync(path.join(outDir, fileName));
  console.log(`wrote ${path.basename(outDir)}/${fileName} (${size}x${size})`);
}

async function main() {
  // Native app icon (iOS/general) — opaque background, required.
  await writeIcon(NATIVE_DIR, "icon.png", 1024, BRAND_COLOR);
  // Android adaptive icon foreground — transparent background, OS supplies
  // the background color from app.json's adaptiveIcon.backgroundColor.
  await writeIcon(NATIVE_DIR, "android-icon-foreground.png", 1024, TRANSPARENT);
  // Splash screen mark — same transparent-foreground treatment.
  await writeIcon(NATIVE_DIR, "splash-icon.png", 1024, TRANSPARENT);

  // Web/PWA — stable URLs under public/.
  await writeIcon(WEB_DIR, "favicon.png", 48, BRAND_COLOR);
  await writeIcon(WEB_DIR, "pwa-192.png", 192, BRAND_COLOR);
  await writeIcon(WEB_DIR, "pwa-512.png", 512, BRAND_COLOR);
  await writeIcon(WEB_DIR, "apple-touch-icon.png", 180, BRAND_COLOR);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
