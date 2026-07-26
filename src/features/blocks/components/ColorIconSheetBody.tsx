/**
 * Contents of the "Color e icono" sheet.
 *
 * This sheet used to be a content-sized strip: 24px color dots and a 220px-tall
 * icon grid, which put the whole thing in the bottom fifth of the screen. Both
 * grids are *browsing* tasks — you scan for the right picture — and a scan
 * needs a viewport. It now opens at a fixed 62% and the targets are sized to be
 * recognisable rather than merely tappable.
 */
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";

import {
  BLOCK_ICONS,
  searchBlockIcons,
  type BlockIconName,
} from "@/features/categories/block-icons";
import { useUiPrefsStore } from "@/store/ui-prefs-store";
import { readableTextOn } from "@/theme/block-color";
import { BLOCK_COLOR_PRESETS } from "@/theme/colors";
import { useThemeColors } from "@/theme/useThemeColors";
import { PressableScale } from "@/ui/PressableScale";

const SWATCH_SIZE = 44;
const ICON_TILE_SIZE = 56;

interface ColorIconSheetBodyProps {
  /** Undefined means "inherit the category's color". */
  color: string | undefined;
  onChangeColor: (color: string | undefined) => void;
  /** Undefined means "inherit the category's icon". */
  icon: string | undefined;
  onChangeIcon: (icon: string | undefined) => void;
  /** The color actually being rendered, override or inherited. */
  resolvedColor: string;
  /** Opens the free color picker. */
  onOpenColorPicker: () => void;
}

/**
 * Renders the color row and the searchable icon grid.
 *
 * @param color - Current color override, or undefined to follow the category.
 * @param onChangeColor - Called with the chosen hex, or undefined for auto.
 * @param icon - Current icon override, or undefined to follow the category.
 * @param onChangeIcon - Called with the chosen glyph, or undefined for auto.
 * @param resolvedColor - The color in effect, used to tint the selected icon.
 * @param onOpenColorPicker - Opens the free color picker sheet.
 */
export function ColorIconSheetBody({
  color,
  onChangeColor,
  icon,
  onChangeIcon,
  resolvedColor,
  onOpenColorPicker,
}: ColorIconSheetBodyProps) {
  const themeColors = useThemeColors();
  const [query, setQuery] = useState("");
  const recentIcons = useUiPrefsStore((state) => state.recentIcons);
  const recentColors = useUiPrefsStore((state) => state.recentColors);
  const rememberIcon = useUiPrefsStore((state) => state.rememberIcon);
  const rememberColor = useUiPrefsStore((state) => state.rememberColor);

  const results = useMemo(() => searchBlockIcons(query), [query]);

  // Custom colors the user picked before, minus any that duplicate a preset.
  const customColors = useMemo(() => {
    const presetHexes = new Set(
      BLOCK_COLOR_PRESETS.map((preset) => preset.hex.toUpperCase()),
    );
    return recentColors.filter((hex) => !presetHexes.has(hex.toUpperCase()));
  }, [recentColors]);

  // Recently-used icons, resolved back to entries and shown first — the icon
  // you reached for yesterday is the likeliest one today.
  const recentEntries = useMemo(() => {
    if (query.trim().length > 0) {
      return [];
    }
    return recentIcons
      .map((name) => BLOCK_ICONS.find((entry) => entry.name === name))
      .filter((entry): entry is (typeof BLOCK_ICONS)[number] => Boolean(entry))
      .slice(0, 5);
  }, [recentIcons, query]);

  function selectColor(hex: string) {
    onChangeColor(hex);
    rememberColor(hex);
  }

  function selectIcon(name: BlockIconName) {
    onChangeIcon(name);
    rememberIcon(name);
  }

  function renderIconTile(name: BlockIconName, keySuffix: string) {
    const isSelected = icon === name;
    return (
      <PressableScale
        key={`${name}-${keySuffix}`}
        onPress={() => selectIcon(name)}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`Icono ${name}`}
        className="items-center justify-center rounded-full"
        // The selected tile is filled with the block's own color, which is
        // arbitrary hex — so the resting fill has to come from `style` too,
        // rather than a class a later inline value might or might not override.
        style={{
          width: ICON_TILE_SIZE,
          height: ICON_TILE_SIZE,
          backgroundColor: isSelected ? resolvedColor : themeColors.raised,
        }}
      >
        <MaterialCommunityIcons
          name={name}
          size={26}
          color={
            isSelected ? readableTextOn(resolvedColor) : themeColors.iconStrong
          }
        />
      </PressableScale>
    );
  }

  return (
    <View className="flex-1">
      <Text className="mb-2 ml-6 font-raleway-semibold text-sm text-ink-soft dark:text-ink-invsoft">
        Color
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // Height is pinned to the swatches. A horizontal ScrollView with no
        // height stretches to whatever its parent offers, which on a flex
        // sheet body is the entire remaining space — leaving a hole between
        // the colors and the search field.
        style={{ flexGrow: 0, height: SWATCH_SIZE }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          gap: 12,
          alignItems: "center",
        }}
      >
        <PressableScale
          onPress={() => onChangeColor(undefined)}
          accessibilityRole="button"
          accessibilityState={{ selected: color === undefined }}
          accessibilityLabel="Color automático de la categoría"
          className="items-center justify-center rounded-full bg-sand px-4 dark:bg-nightRaised"
          style={{
            height: SWATCH_SIZE,
            borderWidth: color === undefined ? 3 : 0,
            borderColor: themeColors.iconStrong,
          }}
        >
          <Text className="font-raleway-semibold text-sm text-ink dark:text-ink-inverse">
            Auto
          </Text>
        </PressableScale>

        {[
          ...BLOCK_COLOR_PRESETS.map((preset) => preset.hex),
          ...customColors,
        ].map((hex) => {
          const isSelected = color?.toUpperCase() === hex.toUpperCase();
          return (
            <PressableScale
              key={hex}
              onPress={() => selectColor(hex)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Color ${hex}`}
              className="rounded-full"
              style={{
                width: SWATCH_SIZE,
                height: SWATCH_SIZE,
                backgroundColor: hex,
                borderWidth: isSelected ? 3 : 0,
                borderColor: readableTextOn(hex),
              }}
            />
          );
        })}

        <PressableScale
          onPress={onOpenColorPicker}
          accessibilityRole="button"
          accessibilityLabel="Elegir otro color"
          className="items-center justify-center rounded-full border-2 border-dashed border-ink-soft dark:border-ink-invsoft"
          style={{ width: SWATCH_SIZE, height: SWATCH_SIZE }}
        >
          <Feather name="plus" size={20} color={themeColors.icon} />
        </PressableScale>
      </ScrollView>

      <View className="mx-5 mb-3 mt-5 flex-row items-center gap-2 rounded-full bg-sand px-4 dark:bg-nightRaised">
        <Feather name="search" size={16} color={themeColors.icon} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar icono"
          placeholderTextColor={themeColors.icon}
          accessibilityLabel="Buscar icono"
          className="flex-1 py-2.5 font-raleway text-base text-ink dark:text-ink-inverse"
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {recentEntries.length > 0 ? (
          <>
            <Text className="mb-2 ml-1 font-raleway-semibold text-sm text-ink-soft dark:text-ink-invsoft">
              Recientes
            </Text>
            <View className="mb-5 flex-row flex-wrap gap-3">
              {recentEntries.map((entry) =>
                renderIconTile(entry.name, "recent"),
              )}
            </View>
          </>
        ) : null}

        <View className="flex-row flex-wrap gap-3">
          <PressableScale
            onPress={() => onChangeIcon(undefined)}
            accessibilityRole="button"
            accessibilityState={{ selected: icon === undefined }}
            accessibilityLabel="Icono automático de la categoría"
            className="items-center justify-center rounded-full bg-sand dark:bg-nightRaised"
            style={{
              height: ICON_TILE_SIZE,
              paddingHorizontal: 18,
              borderWidth: icon === undefined ? 3 : 0,
              borderColor: themeColors.iconStrong,
            }}
          >
            <Text className="font-raleway-semibold text-sm text-ink dark:text-ink-inverse">
              Auto
            </Text>
          </PressableScale>

          {results.map((entry) => renderIconTile(entry.name, "all"))}
        </View>

        {results.length === 0 ? (
          <Text className="mt-6 text-center font-raleway text-ink-muted dark:text-ink-invmuted">
            Ningún icono coincide con “{query}”.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}
