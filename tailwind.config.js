const { colors } = require("./src/theme/palette");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
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
