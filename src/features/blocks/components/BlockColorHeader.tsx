/**
 * The block form's header: a band flooded with the block's own color, holding
 * its icon, its time, and its title as an editable field.
 *
 * The color is what makes an open block feel like *that* block rather than a
 * generic form — it is carried straight from the node on the timeline into the
 * screen that edits it, so there is never a moment of "which one did I tap?".
 * Every text and glyph color here is derived from the fill rather than assumed
 * to be white: the fill is now arbitrary hex, and white on a pale yellow is
 * unreadable.
 */
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  FALLBACK_ICON,
  type BlockIconName,
} from "@/features/categories/block-icons";
import { formatDuration, formatMinute } from "@/lib/date";
import { readableTextOn, withAlpha } from "@/theme/block-color";

interface BlockColorHeaderProps {
  title: string;
  onChangeTitle: (title: string) => void;
  /** The block's resolved color, as `#RRGGBB`. */
  color: string;
  icon: string | undefined;
  startMinute: number;
  endMinute: number;
  /** Human label for the day, e.g. "Hoy" or "Miércoles 22". */
  dayLabel: string;
  onCancel: () => void;
  onSave: () => void;
  /** Opens the color and icon sheet — the icon doubles as its entry point. */
  onPressIcon: () => void;
}

/**
 * Renders the colored header band.
 *
 * @param title - Current title text.
 * @param onChangeTitle - Called as the title is typed.
 * @param color - The block's color, filling the band.
 * @param icon - Glyph name, or undefined to show the fallback.
 * @param startMinute - Block start, as a minute of day.
 * @param endMinute - Block end, as a minute of day.
 * @param dayLabel - Human label for the block's day.
 * @param onCancel - Discards the edit and closes the screen.
 * @param onSave - Commits the edit.
 * @param onPressIcon - Opens the color and icon sheet.
 */
export function BlockColorHeader({
  title,
  onChangeTitle,
  color,
  icon,
  startMinute,
  endMinute,
  dayLabel,
  onCancel,
  onSave,
  onPressIcon,
}: BlockColorHeaderProps) {
  const insets = useSafeAreaInsets();
  const ink = readableTextOn(color);
  const glyph = (icon ?? FALLBACK_ICON) as BlockIconName;

  return (
    <View
      style={{ backgroundColor: color, paddingTop: insets.top + 8 }}
      className="rounded-b-card px-5 pb-6"
    >
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={onCancel}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Cancelar"
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: withAlpha(ink, 0.15) }}
        >
          <Feather name="x" size={22} color={ink} />
        </Pressable>

        <Pressable
          onPress={onSave}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Guardar"
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: withAlpha(ink, 0.15) }}
        >
          <Feather name="check" size={22} color={ink} />
        </Pressable>
      </View>

      <View className="mt-6 flex-row items-center gap-4">
        {/* The icon is also the way in to the color and icon sheet: it is the
            thing you are trying to change, so it should be the thing you tap. */}
        <Pressable
          onPress={onPressIcon}
          accessibilityRole="button"
          accessibilityLabel="Cambiar color e icono"
          className="h-20 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: withAlpha(ink, 0.18) }}
        >
          <MaterialCommunityIcons name={glyph} size={30} color={ink} />
        </Pressable>

        <View className="flex-1">
          <Text
            className="font-raleway-medium text-xs"
            style={{ color: ink, opacity: 0.8 }}
          >
            {dayLabel} · {formatMinute(startMinute)}–{formatMinute(endMinute)} ·{" "}
            {formatDuration(endMinute - startMinute)}
          </Text>
          <TextInput
            value={title}
            onChangeText={onChangeTitle}
            placeholder="Título del bloque"
            placeholderTextColor={withAlpha(ink, 0.55)}
            accessibilityLabel="Título del bloque"
            className="mt-1 border-b pb-1 font-raleway-bold text-2xl"
            style={{ color: ink, borderBottomColor: withAlpha(ink, 0.35) }}
          />
        </View>
      </View>
    </View>
  );
}
