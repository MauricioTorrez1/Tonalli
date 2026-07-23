const { colors } = require("./src/theme/palette");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  // Resolve dark mode via a root class, not the system `@media` query, so the
  // app can honor the user's saved theme (`system`/`light`/`dark`). Without
  // this, `colorScheme.set()` throws on web ("dark mode is type 'media'") and
  // blanks the render; native is unaffected either way.
  darkMode: "class",
  theme: {
    extend: {
      colors,
      fontFamily: {
        // React Native selects weight by family name, so each weight is its own key.
        lora: ["Lora_500Medium"],
        "lora-semibold": ["Lora_600SemiBold"],
        raleway: ["Raleway_400Regular"],
        "raleway-medium": ["Raleway_500Medium"],
        "raleway-semibold": ["Raleway_600SemiBold"],
        "raleway-bold": ["Raleway_700Bold"],
      },
      borderRadius: {
        card: "24px",
        button: "16px",
      },
    },
  },
  plugins: [],
};
