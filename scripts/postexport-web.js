/**
 * Cloudflare Pages looks for a literal `404.html` at the output root; Expo
 * Router's web export names its not-found page `+not-found.html`. Without
 * this copy, Pages assumes the whole site is a single-page app and routes
 * every unmatched path to `/` instead of showing a real 404.
 */
const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "dist");
const source = path.join(distDir, "+not-found.html");
const target = path.join(distDir, "404.html");

if (!fs.existsSync(source)) {
  console.warn("dist/+not-found.html not found — skipping 404.html generation");
  process.exit(0);
}

fs.copyFileSync(source, target);
console.log("wrote dist/404.html (copy of +not-found.html)");
