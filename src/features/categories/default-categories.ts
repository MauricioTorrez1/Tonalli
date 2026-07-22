/**
 * Fixed set of built-in categories. Not user-editable in Phase 1 — a small,
 * curated list is one fewer decision when creating a block (see ADR 4), and
 * each maps to a distinct vivid color so the timeline reads at a glance.
 */
import type { Category } from "@/types/category";

export const DEFAULT_CATEGORIES: readonly Category[] = [
  { id: "enfoque", name: "Enfoque", color: "sky", icon: "🎯" },
  { id: "movimiento", name: "Movimiento", color: "mint", icon: "🏃" },
  { id: "personal", name: "Personal", color: "amber", icon: "🌅" },
  { id: "bienestar", name: "Bienestar", color: "violet", icon: "🧘" },
  { id: "social", name: "Social", color: "rose", icon: "💬" },
];

export function findCategory(id: string | undefined): Category | undefined {
  if (!id) {
    return undefined;
  }
  return DEFAULT_CATEGORIES.find((category) => category.id === id);
}
