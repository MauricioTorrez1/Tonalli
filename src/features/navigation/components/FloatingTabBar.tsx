/**
 * The app's bottom navigation: a floating pill of tabs with the add button
 * sitting beside it as a separate circle.
 *
 * This replaces a free-floating "+" that was absolutely positioned inside the
 * day screen. That button had a habit of vanishing: it relied on `className`
 * for `position: absolute`, and NativeWind only maps `className` on components
 * it has registered — on an animated or wrapped component the class is
 * accepted, ignored, and dropped in silence (the trap documented in
 * docs/adr/0010-animation-allowlist.md). With no `position`, the button fell
 * into normal flow below a `flex-1` sibling and off the bottom of the screen.
 *
 * Two things stop that recurring here: the bar is a real navigator-owned
 * element rather than an overlay, and every layout value below is an inline
 * `style`, never a class. Colors may stay in `className` — being dropped there
 * is a cosmetic bug, not an invisible control.
 */
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSelectedDayStore } from "@/store/selected-day-store";
import { palette } from "@/theme/colors";
import { useThemeColors } from "@/theme/useThemeColors";
import { PressableScale } from "@/ui/PressableScale";
import { ADD_BUTTON_SIZE, TAB_BAR_HEIGHT } from "../tab-bar-metrics";

type GlyphName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

/**
 * The slice of the navigator's `tabBar` props this component actually reads.
 *
 * Declared here rather than imported as `BottomTabBarProps` from
 * `@react-navigation/bottom-tabs`: that package is only present as a
 * transitive dependency of expo-router, so importing from it would be a
 * phantom dependency — nothing in package.json pins it, and a future
 * expo-router release could drop or move it without any signal here.
 */
interface TabBarProps {
  state: {
    index: number;
    routes: { key: string; name: string }[];
  };
  navigation: {
    navigate: (name: string) => void;
    emit: (event: {
      type: "tabPress";
      target: string;
      canPreventDefault: true;
    }) => { defaultPrevented: boolean };
  };
}

/** Route name → glyph and spoken label, in tab order. */
const TAB_META: Record<string, { icon: GlyphName; label: string }> = {
  index: { icon: "timeline-clock-outline", label: "Agenda" },
  stats: { icon: "chart-donut", label: "Estadísticas" },
  settings: { icon: "cog-outline", label: "Ajustes" },
};

/**
 * Renders the floating tab bar and the add button.
 *
 * @param state - Navigation state, supplying the routes and which is focused.
 * @param navigation - Navigator handle used to switch tabs.
 */
export function FloatingTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDark } = useThemeColors();
  // A new block belongs to the day the user is looking at, and that day now
  // lives in a store precisely because this button no longer sits inside the
  // screen that owns it.
  const selectedDay = useSelectedDayStore((state) => state.selectedDay);

  const inactiveColor = isDark ? palette.ink.invmuted : palette.ink.muted;
  const barBackground = isDark ? palette.nightSurface : palette.sand;

  return (
    <View
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: insets.bottom + 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <View
        accessibilityRole="tablist"
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          height: TAB_BAR_HEIGHT,
          borderRadius: TAB_BAR_HEIGHT / 2,
          backgroundColor: barBackground,
          paddingHorizontal: 8,
        }}
      >
        {state.routes.map((route, index) => {
          const meta = TAB_META[route.name];
          if (!meta) {
            return null;
          }
          const isFocused = state.index === index;

          return (
            <Pressable
              key={route.key}
              onPress={() => {
                // `navigate` rather than a plain dispatch: tapping the tab you
                // are already on should do nothing, not push a duplicate.
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={meta.label}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                height: TAB_BAR_HEIGHT - 16,
                borderRadius: (TAB_BAR_HEIGHT - 16) / 2,
              }}
            >
              <MaterialCommunityIcons
                name={meta.icon}
                size={24}
                color={isFocused ? palette.accent.DEFAULT : inactiveColor}
              />
            </Pressable>
          );
        })}
      </View>

      {/* The single clear call to action, kept visually apart from navigation:
          the tabs change what you are looking at, this one creates something. */}
      <PressableScale
        onPress={() =>
          router.push({
            pathname: "/block-form",
            params: { day: selectedDay },
          })
        }
        accessibilityRole="button"
        accessibilityLabel="Crear bloque"
        style={{
          width: ADD_BUTTON_SIZE,
          height: ADD_BUTTON_SIZE,
          borderRadius: ADD_BUTTON_SIZE / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: palette.accent.DEFAULT,
        }}
      >
        <MaterialCommunityIcons
          name="plus"
          size={30}
          color={palette.accent.ink}
        />
      </PressableScale>
    </View>
  );
}
