/**
 * A category tags a block with a color and an icon. Phase 1 ships a fixed,
 * curated set (see features/categories/default-categories.ts) rather than a
 * user-editable list — one fewer decision when creating a block, consistent
 * with the focus-first design goal. A block may still override the color it
 * inherits from its category (`Block.color`).
 */
import { z } from "zod";

import { BLOCK_COLOR_TOKENS } from "@/theme/colors";

export const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: z.enum(BLOCK_COLOR_TOKENS),
  icon: z.string(),
});

export type Category = z.infer<typeof categorySchema>;
