/**
 * Create/edit form for a single block, shown as a modal. One screen handles
 * both: presence of `?id=` in the route params means "editing".
 *
 * The screen is a colored header — the block's identity — over a short list of
 * decisions: when, how often, what it warns you about. Each decision opens a
 * sheet rather than sitting inline, so the screen reads as a summary of what
 * has been settled instead of every control at once. Subtasks and notes are
 * the exceptions and stay inline: they are free text, and text you write in a
 * sheet is text you cannot see in context.
 *
 * Editing or deleting a recurring block always acts on the whole series, never
 * a single occurrence — see docs/adr/0005-recurrence-virtual-expansion.md.
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

import { AlertsSheetBody } from "@/features/blocks/components/AlertsSheetBody";
import { BlockColorHeader } from "@/features/blocks/components/BlockColorHeader";
import { ColorIconSheetBody } from "@/features/blocks/components/ColorIconSheetBody";
import { ColorPickerSheetBody } from "@/features/blocks/components/ColorPickerSheetBody";
import {
  RepeatSheetBody,
  type FreqOption,
} from "@/features/blocks/components/RepeatSheetBody";
import { SubtaskList } from "@/features/blocks/components/SubtaskList";
import { TimeSheetBody } from "@/features/blocks/components/TimeSheetBody";
import { DEFAULT_CATEGORIES } from "@/features/categories/default-categories";
import {
  cancelNotifications,
  requestPermission,
  scheduleForBlock,
  supportsScheduledNotifications,
} from "@/features/notifications/schedule";
import {
  dayHeading,
  formatDuration,
  formatMinute,
  todayString,
  type DayString,
} from "@/lib/date";
import { uuidv4 } from "@/lib/id";
import { useBlockStore } from "@/store/block-store";
import { NEUTRAL_BLOCK_COLOR, palette } from "@/theme/colors";
import { useThemeColors } from "@/theme/useThemeColors";
import { Card } from "@/ui/Card";
import { Chip } from "@/ui/Chip";
import { ListRow } from "@/ui/ListRow";
import { MonthCalendar } from "@/ui/MonthCalendar";
import { Separator } from "@/ui/Separator";
import { Sheet, type SheetHandle } from "@/ui/Sheet";
import type { BlockAlert } from "@/types/alert";
import type { NewBlock } from "@/types/block";
import type { Subtask } from "@/types/subtask";

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

/**
 * A new block warns you when it starts, unless you say otherwise.
 *
 * Zero alerts is a legal state and an easy one to end up in by accident; a
 * planning app whose blocks say nothing by default is a planning app you stop
 * trusting. Editing an existing block never applies this — its alert list,
 * empty or not, is what its owner chose.
 */
function defaultAlerts(): BlockAlert[] {
  return [{ id: uuidv4(), anchor: "start", offsetMinutes: 0 }];
}

export default function BlockFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const { id, day: dayParam } = useLocalSearchParams<{
    id?: string;
    day?: string;
  }>();
  const isEditing = Boolean(id);

  const dateSheet = useRef<SheetHandle>(null);
  const timeSheet = useRef<SheetHandle>(null);
  const repeatSheet = useRef<SheetHandle>(null);
  const alertsSheet = useRef<SheetHandle>(null);
  const colorSheet = useRef<SheetHandle>(null);
  const colorPickerSheet = useRef<SheetHandle>(null);

  const existingBlock = useBlockStore((state) =>
    id ? state.blocks.find((b) => b.id === id) : undefined,
  );
  const today = todayString();
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
  const [colorOverride, setColorOverride] = useState<string | undefined>(
    existingBlock?.color,
  );
  const [iconOverride, setIconOverride] = useState<string | undefined>(
    existingBlock?.icon,
  );
  // The block's day is editable now, so it is state rather than a derived
  // constant: its own day when editing, the day the user was viewing when
  // creating, and today as the last resort (e.g. a deep link with no param).
  const [day, setDay] = useState<DayString>(
    (existingBlock?.day ?? dayParam ?? today) as DayString,
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
  const [subtasks, setSubtasks] = useState<Subtask[]>(
    existingBlock?.subtasks ?? [],
  );
  const [alerts, setAlerts] = useState<BlockAlert[]>(
    existingBlock?.alerts ?? defaultAlerts(),
  );
  const [soundEnabled, setSoundEnabled] = useState(
    existingBlock?.soundEnabled ?? true,
  );

  const [error, setError] = useState<string | undefined>();

  const selectedCategory = useMemo(
    () => DEFAULT_CATEGORIES.find((c) => c.id === categoryId),
    [categoryId],
  );
  const resolvedColor =
    colorOverride ?? selectedCategory?.color ?? NEUTRAL_BLOCK_COLOR;
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
            startsOn: day,
            endsOn,
          });

    const input: NewBlock = {
      title: title.trim(),
      notes: notes.trim() || undefined,
      color: colorOverride,
      icon: iconOverride,
      categoryId,
      day,
      startMinute,
      endMinute,
      recurrenceId: newRecurrence?.id,
      // Blank titles can accumulate from the add-subtask field losing focus
      // without input; drop them rather than persist rows nobody typed.
      subtasks: subtasks.filter((subtask) => subtask.title.trim().length > 0),
      alerts,
      soundEnabled,
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
    const granted = alerts.length > 0 ? await requestPermission() : false;
    if (granted) {
      const newIds = await scheduleForBlock(saved, newRecurrence, new Date());
      setNotificationIds(saved.id, newIds);
    } else {
      setNotificationIds(saved.id, []);
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

  const alertsSummary =
    alerts.length === 0
      ? "Sin avisos"
      : alerts.length === 1
        ? "1 aviso"
        : `${alerts.length} avisos`;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-cream dark:bg-night"
    >
      <BlockColorHeader
        title={title}
        onChangeTitle={setTitle}
        color={resolvedColor}
        icon={resolvedIcon}
        startMinute={startMinute}
        endMinute={endMinute}
        dayLabel={dayHeading(day, today)}
        onCancel={() => router.back()}
        onSave={handleSave}
        onPressIcon={() => colorSheet.current?.open()}
      />

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: insets.bottom + 40,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {error ? (
          <Text className="mb-3 ml-1 font-raleway text-sm text-danger">
            {error}
          </Text>
        ) : null}

        <Card>
          <ListRow
            icon="calendar"
            label={dayHeading(day, today)}
            value={day === today ? undefined : day}
            onPress={() => dateSheet.current?.open()}
            accessibilityLabel="Fecha del bloque"
          />
          <Separator inset />
          <ListRow
            icon="clock"
            label={`${formatMinute(startMinute)} – ${formatMinute(endMinute)}`}
            value={formatDuration(endMinute - startMinute)}
            onPress={() => timeSheet.current?.open()}
            accessibilityLabel="Horario del bloque"
          />
          <Separator inset />
          <ListRow
            icon="repeat"
            label={FREQ_SUMMARY[freq]}
            onPress={() => repeatSheet.current?.open()}
            accessibilityLabel="Repetición"
          />
          <Separator inset />
          <ListRow
            icon="bell"
            label={alertsSummary}
            value={
              alerts.length > 0
                ? soundEnabled
                  ? "Con sonido"
                  : "Silencio"
                : undefined
            }
            onPress={() => alertsSheet.current?.open()}
            accessibilityLabel="Avisos"
          />
        </Card>

        <Text className="mb-2 ml-1 mt-6 font-raleway-semibold text-sm text-ink-soft dark:text-ink-invsoft">
          Subtareas
        </Text>
        <Card className="py-1">
          <SubtaskList subtasks={subtasks} onChange={setSubtasks} />
        </Card>

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
              label={category.name}
              dotColor={category.color}
              selected={category.id === categoryId}
              onPress={() => setCategoryId(category.id)}
              accessibilityLabel={category.name}
            />
          ))}
        </View>

        <Text className="mb-2 ml-1 mt-6 font-raleway-semibold text-sm text-ink-soft dark:text-ink-invsoft">
          Notas
        </Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Detalles adicionales"
          placeholderTextColor={themeColors.icon}
          multiline
          className="min-h-24 rounded-card bg-sand px-4 py-3 font-raleway text-base text-ink dark:bg-nightSurface dark:text-ink-inverse"
          accessibilityLabel="Notas"
        />

        {isEditing ? (
          <Card className="mt-8">
            <ListRow
              icon="trash-2"
              iconTint={palette.danger.DEFAULT}
              label="Eliminar bloque"
              destructive
              showChevron={false}
              onPress={handleDelete}
            />
          </Card>
        ) : null}
      </ScrollView>

      <Sheet ref={dateSheet} title="Fecha">
        <MonthCalendar
          selectedDay={day}
          onSelectDay={(next) => {
            setDay(next);
            dateSheet.current?.close();
          }}
        />
      </Sheet>

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
          startsOn={day}
          endsOn={endsOn}
          onChangeEndsOn={setEndsOn}
        />
      </Sheet>

      <Sheet ref={alertsSheet} title="Alertas">
        <AlertsSheetBody
          alerts={alerts}
          onChangeAlerts={setAlerts}
          soundEnabled={soundEnabled}
          onChangeSound={setSoundEnabled}
          supported={supportsScheduledNotifications}
        />
      </Sheet>

      <Sheet ref={colorSheet} title="Color e icono" snapPoints={["62%"]}>
        <ColorIconSheetBody
          color={colorOverride}
          onChangeColor={setColorOverride}
          icon={iconOverride}
          onChangeIcon={setIconOverride}
          resolvedColor={resolvedColor}
          onOpenColorPicker={() => colorPickerSheet.current?.open()}
        />
      </Sheet>

      <Sheet ref={colorPickerSheet} title="Elegir color">
        <ColorPickerSheetBody
          color={resolvedColor}
          onChange={setColorOverride}
        />
      </Sheet>
    </KeyboardAvoidingView>
  );
}
