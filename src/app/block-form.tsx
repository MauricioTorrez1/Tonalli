/**
 * Create/edit form for a single block, shown as a modal. One screen handles
 * both: presence of `?id=` in the route params means "editing".
 *
 * The sub-decisions (time, repetition, color and icon) live in bottom sheets
 * rather than inline sections, so the screen itself stays a short list of
 * what has been decided instead of every control at once. Category is the
 * exception and stays inline: it drives both the color and the icon, there are
 * only a handful, and hiding the most consequential choice behind a row would
 * be the wrong trade.
 *
 * Scope: a new block always anchors to the day the user was viewing (no date
 * picker yet — that arrives with the week view in Phase 2). Editing or
 * deleting a recurring block always acts on the whole series, never a single
 * occurrence — see docs/adr/0005-recurrence-virtual-expansion.md.
 */
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ColorIconSheetBody } from "@/features/blocks/components/ColorIconSheetBody";
import {
  RepeatSheetBody,
  type FreqOption,
} from "@/features/blocks/components/RepeatSheetBody";
import { TimeSheetBody } from "@/features/blocks/components/TimeSheetBody";
import { DEFAULT_CATEGORIES } from "@/features/categories/default-categories";
import {
  cancelNotifications,
  requestPermission,
  scheduleForBlock,
} from "@/features/notifications/schedule";
import {
  dayHeading,
  formatDuration,
  formatMinute,
  todayString,
  type DayString,
} from "@/lib/date";
import { useBlockStore } from "@/store/block-store";
import { CATEGORY_STYLES } from "@/theme/category-styles";
import { type ColorToken } from "@/theme/colors";
import { useThemeColors } from "@/theme/useThemeColors";
import { Card } from "@/ui/Card";
import { Chip } from "@/ui/Chip";
import { ListRow } from "@/ui/ListRow";
import { ModalHeader } from "@/ui/ModalHeader";
import { Separator } from "@/ui/Separator";
import { Sheet, type SheetHandle } from "@/ui/Sheet";
import type { NewBlock } from "@/types/block";

// Stable reference for the "no notifications scheduled yet" case — a fresh
// `[]` literal in the selector below would break Zustand's snapshot equality
// check and re-render in a loop.
const NO_NOTIFICATION_IDS: string[] = [];

const FREQ_SUMMARY: Record<FreqOption, string> = {
  none: "No se repite",
  daily: "Todos los días",
  weekdays: "Días de semana",
  weekly: "Semanal",
};

export default function BlockFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const { id, day: dayParam } = useLocalSearchParams<{
    id?: string;
    day?: string;
  }>();
  const isEditing = Boolean(id);

  const timeSheet = useRef<SheetHandle>(null);
  const repeatSheet = useRef<SheetHandle>(null);
  const colorSheet = useRef<SheetHandle>(null);

  const existingBlock = useBlockStore((state) =>
    id ? state.blocks.find((b) => b.id === id) : undefined,
  );
  const today = todayString();
  // The day this block belongs to: its own anchor day when editing, the day
  // the user was viewing on the timeline when creating (falls back to today
  // if opened without that param, e.g. a deep link).
  const targetDay = (existingBlock?.day ?? dayParam ?? today) as DayString;
  const existingRecurrence = useBlockStore((state) =>
    existingBlock?.recurrenceId
      ? state.recurrences.find((r) => r.id === existingBlock.recurrenceId)
      : undefined,
  );
  const notificationIds = useBlockStore((state) =>
    id
      ? (state.notificationIdsByBlock[id] ?? NO_NOTIFICATION_IDS)
      : NO_NOTIFICATION_IDS,
  );

  const addBlock = useBlockStore((state) => state.addBlock);
  const updateBlock = useBlockStore((state) => state.updateBlock);
  const deleteBlock = useBlockStore((state) => state.deleteBlock);
  const addRecurrence = useBlockStore((state) => state.addRecurrence);
  const deleteRecurrence = useBlockStore((state) => state.deleteRecurrence);
  const setNotificationIds = useBlockStore((state) => state.setNotificationIds);

  const [title, setTitle] = useState(existingBlock?.title ?? "");
  const [notes, setNotes] = useState(existingBlock?.notes ?? "");
  const [categoryId, setCategoryId] = useState<string | undefined>(
    existingBlock?.categoryId,
  );
  const [colorOverride, setColorOverride] = useState<ColorToken | undefined>(
    existingBlock?.color,
  );
  const [iconOverride, setIconOverride] = useState<string | undefined>(
    existingBlock?.icon,
  );

  const [startMinute, setStartMinute] = useState(
    existingBlock?.startMinute ?? 9 * 60,
  );
  const [endMinute, setEndMinute] = useState(
    existingBlock?.endMinute ?? 10 * 60,
  );
  const [freq, setFreq] = useState<FreqOption>(
    existingRecurrence?.freq ?? "none",
  );
  const [byWeekday, setByWeekday] = useState<number[]>(
    existingRecurrence?.byWeekday ?? [],
  );
  const [endsOn, setEndsOn] = useState<DayString | undefined>(
    existingRecurrence?.endsOn,
  );

  const [error, setError] = useState<string | undefined>();

  const selectedCategory = useMemo(
    () => DEFAULT_CATEGORIES.find((c) => c.id === categoryId),
    [categoryId],
  );
  const resolvedColor: ColorToken =
    colorOverride ?? selectedCategory?.color ?? "stone";
  const resolvedIcon = iconOverride ?? selectedCategory?.icon;

  async function handleSave() {
    if (title.trim().length === 0) {
      setError("Ponle un título al bloque.");
      return;
    }
    if (endMinute <= startMinute) {
      setError("La hora de fin debe ser después del inicio.");
      return;
    }
    setError(undefined);

    // Recurrence: always replace the old rule rather than patch it in place —
    // keeps the store's recurrence-update surface to a single action.
    if (existingRecurrence) {
      deleteRecurrence(existingRecurrence.id);
    }
    const newRecurrence =
      freq === "none"
        ? undefined
        : addRecurrence({
            freq,
            byWeekday: freq === "weekly" ? byWeekday : undefined,
            startsOn: targetDay,
            endsOn,
          });

    const input: NewBlock = {
      title: title.trim(),
      notes: notes.trim() || undefined,
      color: colorOverride,
      icon: iconOverride,
      categoryId,
      day: targetDay,
      startMinute,
      endMinute,
      recurrenceId: newRecurrence?.id,
    };

    const saved =
      isEditing && existingBlock
        ? updateBlock(existingBlock.id, input)
        : addBlock(input);
    if (!saved) {
      router.back();
      return;
    }

    await cancelNotifications(notificationIds);
    const granted = await requestPermission();
    if (granted) {
      const newIds = await scheduleForBlock(saved, newRecurrence, new Date());
      setNotificationIds(saved.id, newIds);
    }

    router.back();
  }

  function handleDelete() {
    if (!existingBlock) return;
    Alert.alert(
      "Eliminar bloque",
      existingRecurrence
        ? "Esto eliminará todas las repeticiones de este bloque."
        : "Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            await cancelNotifications(notificationIds);
            if (existingRecurrence) {
              deleteRecurrence(existingRecurrence.id);
            }
            deleteBlock(existingBlock.id);
            router.back();
          },
        },
      ],
    );
  }

  function toggleWeekday(isoDay: number) {
    setByWeekday((prev) =>
      prev.includes(isoDay)
        ? prev.filter((d) => d !== isoDay)
        : [...prev, isoDay].sort(),
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-cream dark:bg-night"
    >
      <ModalHeader
        title={isEditing ? "Editar bloque" : "Nuevo bloque"}
        subtitle={
          targetDay !== today ? dayHeading(targetDay, today) : undefined
        }
        tintColor={resolvedColor}
        onClose={() => router.back()}
        onConfirm={handleSave}
        closeLabel="Cancelar"
      />

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: insets.bottom + 40,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Título del bloque"
          placeholderTextColor={themeColors.icon}
          className="rounded-card border border-sand bg-cream px-4 py-3 font-raleway-medium text-base text-ink dark:border-nightRaised dark:bg-nightSurface dark:text-ink-inverse"
          accessibilityLabel="Título del bloque"
        />

        {error ? (
          <Text className="ml-1 mt-2 font-raleway text-sm text-terracotta-600 dark:text-terracotta-300">
            {error}
          </Text>
        ) : null}

        <Text className="mb-2 ml-1 mt-6 font-raleway-semibold text-sm text-ink-soft dark:text-ink-invsoft">
          Categoría
        </Text>
        <View className="flex-row flex-wrap gap-2">
          <Chip
            label="Ninguna"
            selected={categoryId === undefined}
            onPress={() => setCategoryId(undefined)}
            accessibilityLabel="Sin categoría"
          />
          {DEFAULT_CATEGORIES.map((category) => (
            <Chip
              key={category.id}
              label={`${category.icon} ${category.name}`}
              selected={category.id === categoryId}
              onPress={() => setCategoryId(category.id)}
              accessibilityLabel={category.name}
            />
          ))}
        </View>

        <Card className="mt-6">
          <ListRow
            icon="clock"
            iconTint={resolvedColor}
            label="Horario"
            value={`${formatMinute(startMinute)} – ${formatMinute(endMinute)} · ${formatDuration(endMinute - startMinute)}`}
            onPress={() => timeSheet.current?.open()}
          />
          <Separator inset />
          <ListRow
            icon="repeat"
            iconTint={resolvedColor}
            label="Repetir"
            value={FREQ_SUMMARY[freq]}
            onPress={() => repeatSheet.current?.open()}
          />
          <Separator inset />
          <ListRow
            icon="droplet"
            iconTint={resolvedColor}
            label="Color e icono"
            value={
              <View className="flex-row items-center gap-2">
                {resolvedIcon ? (
                  <Text className="text-base">{resolvedIcon}</Text>
                ) : null}
                <View
                  className={`h-4 w-4 rounded-full ${CATEGORY_STYLES[resolvedColor].dot}`}
                />
              </View>
            }
            onPress={() => colorSheet.current?.open()}
          />
        </Card>

        <Text className="mb-2 ml-1 mt-6 font-raleway-semibold text-sm text-ink-soft dark:text-ink-invsoft">
          Notas (opcional)
        </Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Detalles adicionales"
          placeholderTextColor={themeColors.icon}
          multiline
          className="min-h-20 rounded-card border border-sand bg-cream px-4 py-3 font-raleway text-base text-ink dark:border-nightRaised dark:bg-nightSurface dark:text-ink-inverse"
          accessibilityLabel="Notas"
        />

        {isEditing ? (
          <Card className="mt-8">
            <ListRow
              label="Eliminar bloque"
              destructive
              showChevron={false}
              onPress={handleDelete}
            />
          </Card>
        ) : null}
      </ScrollView>

      <Sheet ref={timeSheet} title="Horario">
        <TimeSheetBody
          startMinute={startMinute}
          endMinute={endMinute}
          onChange={(next) => {
            setStartMinute(next.startMinute);
            setEndMinute(next.endMinute);
          }}
        />
      </Sheet>

      <Sheet ref={repeatSheet} title="Repetir">
        <RepeatSheetBody
          freq={freq}
          onChangeFreq={setFreq}
          byWeekday={byWeekday}
          onToggleWeekday={toggleWeekday}
          startsOn={targetDay}
          endsOn={endsOn}
          onChangeEndsOn={setEndsOn}
        />
      </Sheet>

      <Sheet ref={colorSheet} title="Color e icono">
        <ColorIconSheetBody
          color={colorOverride}
          onChangeColor={setColorOverride}
          icon={iconOverride}
          onChangeIcon={setIconOverride}
        />
      </Sheet>
    </KeyboardAvoidingView>
  );
}
