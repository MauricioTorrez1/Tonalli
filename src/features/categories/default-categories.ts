/**
 * Fixed set of built-in categories. Not user-editable in Phase 1 — a small,
 * curated list is one fewer decision when creating a block (see ADR 4), and
 * each maps to a distinct vivid color so the timeline reads at a glance.
 */
import type { Category } from "@/types/category";

export const DEFAULT_CATEGORIES: readonly Category[] = [
  { id: "enfoque", name: "Enfoque", color: "#5B8DEF", icon: "target" },
  { id: "movimiento", name: "Movimiento", color: "#4FB286", icon: "run" },
  {
    id: "personal",
    name: "Personal",
    color: "#E5A64B",
    icon: "weather-sunset-up",
  },
  { id: "bienestar", name: "Bienestar", color: "#A78BFA", icon: "meditation" },
  { id: "social", name: "Social", color: "#E8739A", icon: "chat" },
];

export function findCategory(id: string | undefined): Category | undefined {
  if (!id) {
    return undefined;
  }
  return DEFAULT_CATEGORIES.find((category) => category.id === id);
}
