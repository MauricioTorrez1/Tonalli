/**
 * The checklist inside a block: existing subtasks plus a row to add another.
 *
 * Editing happens in place rather than behind a sheet. Subtasks are the one
 * part of a block that comes in a *sequence* — you think of three steps at
 * once and want to type them one after another — and a sheet that has to be
 * reopened per item would turn that into three round trips.
 */
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";

import { uuidv4 } from "@/lib/id";
import { useThemeColors } from "@/theme/useThemeColors";
import { Checkbox } from "@/ui/Checkbox";
import { PressableScale } from "@/ui/PressableScale";
import { Separator } from "@/ui/Separator";
import type { Subtask } from "@/types/subtask";

interface SubtaskListProps {
  subtasks: Subtask[];
  onChange: (subtasks: Subtask[]) => void;
}

/**
 * Renders the subtask rows and the "add" field.
 *
 * @param subtasks - Current subtasks, in display order.
 * @param onChange - Called with the full new list on every edit.
 */
export function SubtaskList({ subtasks, onChange }: SubtaskListProps) {
  const themeColors = useThemeColors();
  const [draft, setDraft] = useState("");

  function addSubtask() {
    const title = draft.trim();
    if (title.length === 0) {
      return;
    }
    onChange([...subtasks, { id: uuidv4(), title, done: false }]);
    // Cleared rather than kept: submitting leaves the field focused, so an
    // empty box is the invitation to type the next step.
    setDraft("");
  }

  function toggle(id: string) {
    onChange(
      subtasks.map((subtask) =>
        subtask.id === id ? { ...subtask, done: !subtask.done } : subtask,
      ),
    );
  }

  function rename(id: string, title: string) {
    onChange(
      subtasks.map((subtask) =>
        subtask.id === id ? { ...subtask, title } : subtask,
      ),
    );
  }

  function remove(id: string) {
    onChange(subtasks.filter((subtask) => subtask.id !== id));
  }

  return (
    <View>
      {subtasks.map((subtask, index) => (
        <View key={subtask.id}>
          {index > 0 ? <Separator inset /> : null}
          <View className="flex-row items-center gap-3 px-4 py-2.5">
            <Checkbox
              checked={subtask.done}
              onToggle={() => toggle(subtask.id)}
              accessibilityLabel={
                subtask.done
                  ? `Marcar ${subtask.title} como pendiente`
                  : `Marcar ${subtask.title} como hecha`
              }
            />
            <TextInput
              value={subtask.title}
              onChangeText={(text) => rename(subtask.id, text)}
              accessibilityLabel={`Subtarea: ${subtask.title}`}
              className={`flex-1 font-raleway text-base ${
                subtask.done
                  ? "text-ink-muted line-through dark:text-ink-invmuted"
                  : "text-ink dark:text-ink-inverse"
              }`}
            />
            <PressableScale
              onPress={() => remove(subtask.id)}
              accessibilityRole="button"
              accessibilityLabel={`Eliminar subtarea ${subtask.title}`}
              className="p-1"
            >
              <Feather name="x" size={16} color={themeColors.icon} />
            </PressableScale>
          </View>
        </View>
      ))}

      {subtasks.length > 0 ? <Separator inset /> : null}

      <View className="flex-row items-center gap-3 px-4 py-2.5">
        <View className="h-7 w-7 items-center justify-center rounded-full border-2 border-ink-soft/40 dark:border-ink-invsoft/40" />
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={addSubtask}
          onBlur={addSubtask}
          placeholder="Agregar subtarea"
          placeholderTextColor={themeColors.icon}
          returnKeyType="done"
          blurOnSubmit={false}
          accessibilityLabel="Agregar subtarea"
          className="flex-1 font-raleway text-base text-ink dark:text-ink-inverse"
        />
      </View>

      {subtasks.length > 0 ? (
        <Text className="px-4 pb-2 font-raleway text-xs text-ink-soft dark:text-ink-invsoft">
          {subtasks.filter((subtask) => subtask.done).length} de{" "}
          {subtasks.length} completadas
        </Text>
      ) : null}
    </View>
  );
}
