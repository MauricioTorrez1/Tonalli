/**
 * Contents of the "Color e icono" sheet.
 *
 * Both fields already existed in the schema (`Block.color`, `Block.icon`) and
 * were resolvable by `resolveBlockColor` / `resolveBlockIcon`; there was
 * simply no UI that ever wrote them. This is that UI — no migration, no schema
 * change.
 */
import { ScrollView, Text, View } from "react-native";

import { BLOCK_ICONS } from "@/features/categories/block-icons";
import { CATEGORY_STYLES } from "@/theme/category-styles";
import { BLOCK_COLOR_TOKENS, type ColorToken } from "@/theme/colors";
import { PressableScale } from "@/ui/PressableScale";

interface ColorIconSheetBodyProps {
  /** Undefined means "inherit the category's color". */
  color: ColorToken | undefined;
  onChangeColor: (color: ColorToken | undefined) => void;
  /** Undefined means "inherit the category's icon". */
  icon: string | undefined;
  onChangeIcon: (icon: string | undefined) => void;
}

/**
 * Renders the color swatch row and the icon grid.
 *
 * @param color - Current color override, or undefined to follow the category.
 * @param onChangeColor - Called with the chosen token, or undefined for auto.
 * @param icon - Current icon override, or undefined to follow the category.
 * @param onChangeIcon - Called with the chosen icon, or undefined for auto.
 */
export function ColorIconSheetBody({
  color,
  onChangeColor,
  icon,
  onChangeIcon,
}: ColorIconSheetBodyProps) {
  return (
    <View className="px-5">
      <Text className="mb-2 ml-1 font-raleway-semibold text-sm text-ink-soft dark:text-ink-invsoft">
        Color
      </Text>
      <View className="flex-row flex-wrap items-center gap-3">
        <PressableScale
          onPress={() => onChangeColor(undefined)}
          accessibilityRole="button"
          accessibilityState={{ selected: color === undefined }}
          accessibilityLabel="Color automático de la categoría"
          className={`h-9 items-center justify-center rounded-full border-2 px-3 ${
            color === undefined
              ? "border-ink dark:border-ink-inverse"
              : "border-transparent"
          }`}
        >
          <Text className="font-raleway-medium text-xs text-ink dark:text-ink-inverse">
            Auto
          </Text>
        </PressableScale>
        {BLOCK_COLOR_TOKENS.map((token) => (
          <PressableScale
            key={token}
            onPress={() => onChangeColor(token)}
            accessibilityRole="button"
            accessibilityState={{ selected: color === token }}
            accessibilityLabel={`Color ${token}`}
            className={`h-9 w-9 items-center justify-center rounded-full border-2 ${
              color === token
                ? "border-ink dark:border-ink-inverse"
                : "border-transparent"
            }`}
          >
            <View
              className={`h-6 w-6 rounded-full ${CATEGORY_STYLES[token].dot}`}
            />
          </PressableScale>
        ))}
      </View>

      <Text className="mb-2 ml-1 mt-6 font-raleway-semibold text-sm text-ink-soft dark:text-ink-invsoft">
        Icono
      </Text>
      <ScrollView style={{ maxHeight: 220 }}>
        <View className="flex-row flex-wrap gap-2">
          <PressableScale
            onPress={() => onChangeIcon(undefined)}
            accessibilityRole="button"
            accessibilityState={{ selected: icon === undefined }}
            accessibilityLabel="Icono automático de la categoría"
            className={`h-11 items-center justify-center rounded-full border px-3 ${
              icon === undefined
                ? "border-category-sky-solid bg-category-sky-solid"
                : "border-sand dark:border-nightRaised"
            }`}
          >
            <Text
              className={`font-raleway-medium text-xs ${
                icon === undefined
                  ? "text-white"
                  : "text-ink dark:text-ink-inverse"
              }`}
            >
              Auto
            </Text>
          </PressableScale>
          {BLOCK_ICONS.map((option) => (
            <PressableScale
              key={option}
              onPress={() => onChangeIcon(option)}
              accessibilityRole="button"
              accessibilityState={{ selected: icon === option }}
              accessibilityLabel={`Icono ${option}`}
              className={`h-11 w-11 items-center justify-center rounded-full border ${
                icon === option
                  ? "border-category-sky-solid bg-category-sky-solid"
                  : "border-sand dark:border-nightRaised"
              }`}
            >
              <Text className="text-lg leading-6">{option}</Text>
            </PressableScale>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
