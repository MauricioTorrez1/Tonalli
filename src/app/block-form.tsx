/**
 * Create/edit form for a single block, shown as a modal. One screen handles
 * both: presence of `?id=` in the route params means "editing".
 *
 * Scope for Phase 1: a block's icon always comes from its category (no
 * per-block icon override UI) and a new block always anchors to today (no day
 * picker yet — only the day view exists; a date picker arrives with the week
 * view in Phase 2). Editing or deleting a recurring block always acts on the
 * whole series, never a single occurrence — see
 * docs/adr/0005-recurrence-virtual-expansion.md.
 */
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DEFAULT_CATEGORIES } from "@/features/categories/default-categories";
import {
  cancelNotifications,
  requestPermission,
  scheduleForBlock,
} from "@/features/notifications/schedule";
import { dateFromDayMinute, formatMinute, todayString } from "@/lib/date";
import { useBlockStore } from "@/store/block-store";
import { BLOCK_COLOR_TOKENS, type ColorToken } from "@/theme/colors";
import { CATEGORY_STYLES } from "@/theme/category-styles";
import { useThemeColors } from "@/theme/useThemeColors";
import type { NewBlock } from "@/types/block";
import type { RecurrenceFreq } from "@/types/recurrence";

const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
// Stable reference for the "no notifications scheduled yet" case — a fresh
// `[]` literal in the selector below would break Zustand's snapshot equality
// check and re-render in a loop.
const NO_NOTIFICATION_IDS: string[] = [];
const FREQ_LABELS: Record<"none" | RecurrenceFreq, string> = {
  none: "No se repite",
  daily: "Todos los días",
  weekdays: "Días de semana",
  weekly: "Semanal",
};

function minuteFromDate(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

interface TimeFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  isDark: boolean;
}

/**
 * A single start/end time field. iOS and Android need genuinely different
 * layouts, not just different `display` props on the same markup — mounting
 * both a custom "09:00" card *and* an always-visible native `compact` picker
 * underneath it (the previous approach) rendered as two redundant, badly
 * stacked time controls. Now there is exactly one visible control per
 * platform:
 * - iOS: the native `compact` picker *is* the field — a small tappable native
 *   chip, inline inside our card.
 * - Android: `compact`/inline display isn't supported, so a custom card shows
 *   the time and opens the native dialog on tap; the picker itself is only
 *   mounted (which is what triggers the dialog) while `show` is true.
 */
function TimeField({ label, value, onChange, isDark }: TimeFieldProps) {
  const [show, setShow] = useState(false);

  if (Platform.OS === "ios") {
    return (
      <View className="flex-1 rounded-card border border-sand bg-cream px-4 py-2 dark:border-nightRaised dark:bg-nightSurface">
        <Text className="mb-1 font-raleway-medium text-xs text-ink-soft dark:text-ink-invsoft">
          {label}
        </Text>
        <DateTimePicker
          value={value}
          mode="time"
          display="compact"
          themeVariant={isDark ? "dark" : "light"}
          onChange={(_event, selected) => {
            if (selected) onChange(selected);
          }}
          style={{ alignSelf: "flex-start", height: 28 }}
        />
      </View>
    );
  }

  return (
    <>
      <Pressable
        onPress={() => setShow(true)}
        className="flex-1 rounded-card border border-sand bg-cream px-4 py-3 dark:border-nightRaised dark:bg-nightSurface"
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text className="font-raleway-medium text-xs text-ink-soft dark:text-ink-invsoft">
          {label}
        </Text>
        <Text className="font-raleway-semibold text-base text-ink dark:text-ink-inverse">
          {formatMinute(minuteFromDate(value))}
        </Text>
      </Pressable>
      {show ? (
        <DateTimePicker
          value={value}
          mode="time"
          is24Hour
          display="default"
          onChange={(_event, selected) => {
            setShow(false);
            if (selected) onChange(selected);
          }}
        />
      ) : null}
    </>
  );
}

export default function BlockFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const existingBlock = useBlockStore((state) =>
    id ? state.blocks.find((b) => b.id === id) : undefined,
  );
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
  const [showColorPicker, setShowColorPicker] = useState(false);

  const [startDate, setStartDate] = useState(() =>
    existingBlock
      ? dateFromDayMinute(existingBlock.day, existingBlock.startMinute)
      : dateFromDayMinute(todayString(), 9 * 60),
  );
  const [endDate, setEndDate] = useState(() =>
    existingBlock
      ? dateFromDayMinute(existingBlock.day, existingBlock.endMinute)
      : dateFromDayMinute(todayString(), 10 * 60),
  );
  const [freq, setFreq] = useState<"none" | RecurrenceFreq>(
    existingRecurrence?.freq ?? "none",
  );
  const [byWeekday, setByWeekday] = useState<number[]>(
    existingRecurrence?.byWeekday ?? [],
  );

  const [error, setError] = useState<string | undefined>();

  const selectedCategory = useMemo(
    () => DEFAULT_CATEGORIES.find((c) => c.id === categoryId),
    [categoryId],
  );
  const resolvedColor: ColorToken =
    colorOverride ?? selectedCategory?.color ?? "stone";

  async function handleSave() {
    if (title.trim().length === 0) {
      setError("Ponle un título al bloque.");
      return;
    }
    const startMinute = minuteFromDate(startDate);
    const endMinute = minuteFromDate(endDate);
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
    const day = existingBlock?.day ?? todayString();
    const newRecurrence =
      freq === "none"
        ? undefined
        : addRecurrence({
            freq,
            byWeekday: freq === "weekly" ? byWeekday : undefined,
            startsOn: day,
          });

    const input: NewBlock = {
      title: title.trim(),
      notes: notes.trim() || undefined,
      color: colorOverride,
      categoryId,
      day,
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

  function toggleWeekday(day: number) {
    setByWeekday((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort(),
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-cream dark:bg-night"
    >
      <View
        className="flex-row items-center justify-between px-5"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Cancelar"
        >
          <Feather name="x" size={22} color={themeColors.icon} />
        </Pressable>
        <Text className="font-raleway-semibold text-base text-ink dark:text-ink-inverse">
          {isEditing ? "Editar bloque" : "Nuevo bloque"}
        </Text>
        <Pressable
          onPress={handleSave}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Guardar"
        >
          <Feather name="check" size={22} color={themeColors.iconStrong} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: insets.bottom + 40,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Título del bloque"
          placeholderTextColor={themeColors.icon}
          className="rounded-card border border-sand bg-cream px-4 py-3 font-raleway-medium text-base text-ink dark:border-nightRaised dark:bg-nightSurface dark:text-ink-inverse"
          accessibilityLabel="Título del bloque"
        />

        {error ? (
          <Text className="mt-2 font-raleway text-sm text-terracotta-600 dark:text-terracotta-300">
            {error}
          </Text>
        ) : null}

        {/* Category */}
        <Text className="mb-2 mt-6 font-raleway-semibold text-sm text-ink-soft dark:text-ink-invsoft">
          Categoría
        </Text>
        <View className="flex-row flex-wrap gap-2">
          <Pressable
            onPress={() => setCategoryId(undefined)}
            className={`flex-row items-center rounded-full border px-3 py-2 ${
              categoryId === undefined
                ? "border-ink dark:border-ink-inverse"
                : "border-sand dark:border-nightRaised"
            }`}
            accessibilityRole="button"
            accessibilityLabel="Sin categoría"
          >
            <Text className="font-raleway-medium text-sm text-ink dark:text-ink-inverse">
              Ninguna
            </Text>
          </Pressable>
          {DEFAULT_CATEGORIES.map((category) => {
            const selected = category.id === categoryId;
            return (
              <Pressable
                key={category.id}
                onPress={() => setCategoryId(category.id)}
                className={`flex-row items-center gap-2 rounded-full border px-3 py-2 ${
                  selected
                    ? "border-ink dark:border-ink-inverse"
                    : "border-sand dark:border-nightRaised"
                }`}
                accessibilityRole="button"
                accessibilityLabel={category.name}
              >
                <View
                  className={`h-2.5 w-2.5 rounded-full ${CATEGORY_STYLES[category.color].dot}`}
                />
                <Text className="font-raleway-medium text-sm text-ink dark:text-ink-inverse">
                  {category.icon} {category.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Color override, collapsed by default (progressive disclosure). */}
        <Pressable
          onPress={() => setShowColorPicker((v) => !v)}
          className="mt-4 flex-row items-center gap-2"
        >
          <View
            className={`h-3 w-3 rounded-full ${CATEGORY_STYLES[resolvedColor].dot}`}
          />
          <Text className="font-raleway-medium text-sm text-ink-soft dark:text-ink-invsoft">
            {showColorPicker ? "Ocultar colores" : "Cambiar color"}
          </Text>
        </Pressable>
        {showColorPicker ? (
          <View className="mt-3 flex-row flex-wrap items-center gap-3">
            <Pressable
              onPress={() => setColorOverride(undefined)}
              accessibilityRole="button"
              accessibilityLabel="Color automático de la categoría"
              className={`h-9 items-center justify-center rounded-full border-2 px-3 ${
                colorOverride === undefined
                  ? "border-ink dark:border-ink-inverse"
                  : "border-transparent"
              }`}
            >
              <Text className="font-raleway-medium text-xs text-ink dark:text-ink-inverse">
                Auto
              </Text>
            </Pressable>
            {BLOCK_COLOR_TOKENS.map((token) => (
              <Pressable
                key={token}
                onPress={() => setColorOverride(token)}
                accessibilityRole="button"
                accessibilityLabel={`Color ${token}`}
                className={`h-9 w-9 items-center justify-center rounded-full border-2 ${
                  colorOverride === token
                    ? "border-ink dark:border-ink-inverse"
                    : "border-transparent"
                }`}
              >
                <View
                  className={`h-6 w-6 rounded-full ${CATEGORY_STYLES[token].dot}`}
                />
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* Time */}
        <Text className="mb-2 mt-6 font-raleway-semibold text-sm text-ink-soft dark:text-ink-invsoft">
          Horario
        </Text>
        <View className="flex-row gap-3">
          <TimeField
            label="Inicio"
            value={startDate}
            onChange={setStartDate}
            isDark={themeColors.isDark}
          />
          <TimeField
            label="Fin"
            value={endDate}
            onChange={setEndDate}
            isDark={themeColors.isDark}
          />
        </View>

        {/* Repeat */}
        <Text className="mb-2 mt-6 font-raleway-semibold text-sm text-ink-soft dark:text-ink-invsoft">
          Repetir
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {(["none", "daily", "weekdays", "weekly"] as const).map((option) => (
            <Pressable
              key={option}
              onPress={() => setFreq(option)}
              className={`rounded-full border px-3 py-2 ${
                freq === option
                  ? "border-ink dark:border-ink-inverse"
                  : "border-sand dark:border-nightRaised"
              }`}
              accessibilityRole="button"
              accessibilityLabel={FREQ_LABELS[option]}
            >
              <Text className="font-raleway-medium text-sm text-ink dark:text-ink-inverse">
                {FREQ_LABELS[option]}
              </Text>
            </Pressable>
          ))}
        </View>
        {freq === "weekly" ? (
          <View className="mt-3 flex-row gap-2">
            {WEEKDAY_LABELS.map((label, i) => {
              const isoDay = i + 1;
              const selected = byWeekday.includes(isoDay);
              return (
                <Pressable
                  key={isoDay}
                  onPress={() => toggleWeekday(isoDay)}
                  className={`h-9 w-9 items-center justify-center rounded-full border ${
                    selected
                      ? "border-category-sky-solid bg-category-sky-solid"
                      : "border-sand dark:border-nightRaised"
                  }`}
                  accessibilityRole="button"
                  accessibilityLabel={`Día ${label}`}
                >
                  <Text
                    className={`font-raleway-semibold text-xs ${
                      selected ? "text-white" : "text-ink dark:text-ink-inverse"
                    }`}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {/* Notes */}
        <Text className="mb-2 mt-6 font-raleway-semibold text-sm text-ink-soft dark:text-ink-invsoft">
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
          <Pressable
            onPress={handleDelete}
            className="mt-8 items-center"
            accessibilityRole="button"
            accessibilityLabel="Eliminar bloque"
          >
            <Text className="font-raleway-medium text-sm text-terracotta-600 dark:text-terracotta-300">
              Eliminar bloque
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
