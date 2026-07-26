/**
 * The three top-level destinations, behind a custom tab bar.
 *
 * `Tabs` rather than a stack of pushed modals: settings and stats are places
 * the user goes back and forth to, and a modal that has to be dismissed before
 * you can look at anything else makes checking your streak feel like an
 * interruption. The order here is the order they appear in the bar.
 */
import { Tabs } from "expo-router";

import { FloatingTabBar } from "@/features/navigation/components/FloatingTabBar";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Agenda" }} />
      <Tabs.Screen name="stats" options={{ title: "Estadísticas" }} />
      <Tabs.Screen name="settings" options={{ title: "Ajustes" }} />
    </Tabs>
  );
}
