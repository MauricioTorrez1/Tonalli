/**
 * `Animated.View` with NativeWind's `className` actually wired up.
 *
 * NativeWind only maps `className` for components it has registered. Plain RN
 * hosts are registered for you; `Animated.View` is not, so `className` on it
 * is accepted, ignored, and dropped — no warning, no error, styles simply
 * missing. On the web build that silently cost the timeline its `flex-row`
 * (the rail stacked above each card instead of beside it) and its
 * `opacity-60` (past blocks never dimmed).
 *
 * Import this instead of `Animated.View` anywhere `className` is used, so the
 * registration is guaranteed to have run.
 */
import { cssInterop } from "nativewind";
import Animated from "react-native-reanimated";

export const AnimatedView = Animated.View;

cssInterop(AnimatedView, { className: "style" });
