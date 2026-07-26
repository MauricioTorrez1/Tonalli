/**
 * App-wide access to the OS "reduce motion" setting.
 *
 * `useReducedMotion` subscribes to `AccessibilityInfo`, so calling it from
 * every animated primitive would open one listener per rendered control —
 * dozens on a busy day. The provider subscribes once at the root and shares
 * the answer; primitives read it from context.
 *
 * Components that already receive `reducedMotion` as a prop keep it as an
 * explicit override, so tests can pin the value without mounting a provider.
 */
import { createContext, useContext, type ReactNode } from "react";

import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Defaults to false so a component rendered outside the provider (a test, a
 * detached preview) animates normally rather than silently freezing.
 */
const ReducedMotionContext = createContext(false);

/**
 * Subscribes to the OS reduce-motion setting once and shares it with the tree.
 *
 * @param children - The app subtree that reads the setting.
 */
export function ReducedMotionProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();

  return (
    <ReducedMotionContext.Provider value={reduced}>
      {children}
    </ReducedMotionContext.Provider>
  );
}

/**
 * Reads the shared reduce-motion setting.
 *
 * @returns True when the user has asked the OS to minimize animation.
 */
export function useReducedMotionValue(): boolean {
  return useContext(ReducedMotionContext);
}
