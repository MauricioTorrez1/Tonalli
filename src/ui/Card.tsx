/**
 * A grouped surface that holds one or more rows, in the style of an iOS
 * inset-grouped list. Rows inside are separated by `Separator`, not by their
 * own borders, so a group reads as a single object rather than a stack of
 * unrelated controls.
 */
import type { ReactNode } from "react";
import { View } from "react-native";

interface CardProps {
  children: ReactNode;
  /** Extra layout classes for the caller — spacing, not appearance. */
  className?: string;
}

/**
 * Renders a rounded, bordered surface for grouped content.
 *
 * @param children - The rows or content to group.
 * @param className - Additional layout classes applied to the container.
 */
export function Card({ children, className = "" }: CardProps) {
  return (
    <View
      className={`overflow-hidden rounded-card border border-sand bg-cream dark:border-nightRaised dark:bg-nightSurface ${className}`}
    >
      {children}
    </View>
  );
}
