/**
 * The hairline between two rows of the same `Card`.
 */
import { View } from "react-native";

interface SeparatorProps {
  /**
   * Start the line under the row's label instead of at the card edge, so it
   * clears the leading icon tile. Matches the offset `ListRow` uses for its
   * icon (16px padding + 32px tile + 12px gap).
   */
  inset?: boolean;
}

/**
 * Renders a one-pixel divider between grouped rows.
 *
 * @param inset - When true, indents the line past a `ListRow` icon tile.
 */
export function Separator({ inset = false }: SeparatorProps) {
  return (
    <View
      className={`h-px bg-sand dark:bg-nightRaised ${inset ? "ml-[60px]" : ""}`}
    />
  );
}
