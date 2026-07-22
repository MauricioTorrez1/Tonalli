import { View } from "react-native";

import { DayTimeline } from "@/features/timeline/components/DayTimeline";
import { useDayBlocks } from "@/features/timeline/hooks/useDayBlocks";
import { todayString } from "@/lib/date";

export default function DayScreen() {
  const today = todayString();
  const blocks = useDayBlocks(today);

  return (
    <View className="flex-1 bg-cream">
      <DayTimeline blocks={blocks} heading="Hoy" />
    </View>
  );
}
