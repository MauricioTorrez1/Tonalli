/**
 * Reactively track the OS "reduce motion" accessibility setting.
 *
 * The timeline's animations are gated on this: when a user has asked for less
 * motion, entrance/indicator animations are skipped in favor of instant state.
 * Respecting it is essential for the focus-first goal — motion can be actively
 * harmful for some people it aims to help.
 */
import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) {
        setReduced(enabled);
      }
    });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
