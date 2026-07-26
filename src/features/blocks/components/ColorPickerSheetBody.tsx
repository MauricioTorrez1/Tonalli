/**
 * Contents of the "Elegir color" sheet: a free color picker.
 *
 * Blocks used to be limited to six fixed hues. That was a deliberate
 * simplification — fewer decisions per block — but it also meant two blocks
 * that mattered differently to the user could not look different, and colors
 * are the only thing making the timeline scannable. The presets survive as the
 * fast path; this sheet is for when none of them is the color you meant.
 */
import { useMemo, useState } from "react";
import { Text, TextInput, View } from "react-native";

import { hexToHsl, hslToHex, readableTextOn } from "@/theme/block-color";
import {
  BLOCK_COLOR_PRESETS,
  HEX_COLOR_PATTERN,
  type ColorPreset,
} from "@/theme/colors";
import { useThemeColors } from "@/theme/useThemeColors";
import { ColorSpectrumSlider } from "@/ui/ColorSpectrumSlider";
import { PressableScale } from "@/ui/PressableScale";

interface ColorPickerSheetBodyProps {
  /** The color the picker opens on. */
  color: string;
  onChange: (hex: string) => void;
}

/**
 * Renders the hue and lightness sliders, a hex field, and the preset grid.
 *
 * @param color - Current color as `#RRGGBB`.
 * @param onChange - Called with every new color as the user adjusts it.
 */
export function ColorPickerSheetBody({
  color,
  onChange,
}: ColorPickerSheetBodyProps) {
  const themeColors = useThemeColors();
  const hsl = useMemo(() => hexToHsl(color), [color]);
  // The hex field is edited character by character, so it needs its own state:
  // "#5B8" is not a color yet, and pushing it upward would repaint the whole
  // screen gray on the way to a valid value.
  const [draftHex, setDraftHex] = useState<string | undefined>();

  // A fully desaturated or near-black color has no meaningful hue to show, so
  // the sliders would sit at an arbitrary position. Clamp to something the
  // user can move away from.
  const saturation = Math.max(hsl.s, 0.55);

  function commitHex(text: string) {
    const normalized = text.startsWith("#") ? text : `#${text}`;
    setDraftHex(normalized);
    if (HEX_COLOR_PATTERN.test(normalized)) {
      onChange(normalized.toUpperCase());
      setDraftHex(undefined);
    }
  }

  return (
    <View className="px-5">
      <View className="mb-4 flex-row items-center justify-between">
        <View
          className="h-12 w-12 rounded-full"
          style={{ backgroundColor: color }}
          accessibilityElementsHidden
        />
        <TextInput
          value={draftHex ?? color}
          onChangeText={commitHex}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={7}
          placeholderTextColor={themeColors.icon}
          accessibilityLabel="Código hexadecimal del color"
          className="w-32 rounded-button bg-sand px-3 py-2 text-center font-raleway-medium text-base text-ink dark:bg-nightRaised dark:text-ink-inverse"
        />
      </View>

      <ColorSpectrumSlider
        value={hsl.h / 360}
        onChange={(position) =>
          onChange(hslToHex({ h: position * 360, s: saturation, l: hsl.l }))
        }
        colorAt={(position) =>
          hslToHex({ h: position * 360, s: saturation, l: 0.6 })
        }
        accessibilityLabel="Matiz"
      />

      <View className="h-3" />

      <ColorSpectrumSlider
        // Lightness is clamped away from pure black and pure white: either end
        // produces a color that is no longer identifiable as a hue, and pure
        // white blocks vanish on the light theme's page.
        value={(hsl.l - 0.15) / 0.7}
        onChange={(position) =>
          onChange(
            hslToHex({ h: hsl.h, s: saturation, l: 0.15 + position * 0.7 }),
          )
        }
        colorAt={(position) =>
          hslToHex({ h: hsl.h, s: saturation, l: 0.15 + position * 0.7 })
        }
        accessibilityLabel="Luminosidad"
      />

      <Text className="mb-3 ml-1 mt-6 font-raleway-semibold text-sm text-ink-soft dark:text-ink-invsoft">
        Presets
      </Text>
      <View className="flex-row flex-wrap gap-3">
        {BLOCK_COLOR_PRESETS.map((preset: ColorPreset) => {
          const isSelected = preset.hex.toUpperCase() === color.toUpperCase();
          return (
            <PressableScale
              key={preset.name}
              onPress={() => onChange(preset.hex)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Color ${preset.name}`}
              className="h-12 w-12 items-center justify-center rounded-full"
              style={{
                backgroundColor: preset.hex,
                borderWidth: isSelected ? 3 : 0,
                borderColor: readableTextOn(preset.hex),
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
