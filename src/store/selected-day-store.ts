/**
 * Which day the timeline is currently showing.
 *
 * This is the one piece of view state that outlived the screen owning it. The
 * add button used to live inside the day screen and could read `selectedDay`
 * from its `useState`; it now lives in the tab bar, a sibling of every screen,
 * and still has to create the new block on the day the user is looking at.
 *
 * Deliberately *not* persisted: reopening the app should land on today, not on
 * whatever day was being browsed last week.
 */
import { create } from "zustand";

import { todayString, type DayString } from "@/lib/date";

interface SelectedDayState {
  selectedDay: DayString;
  setSelectedDay: (day: DayString) => void;
}

export const useSelectedDayStore = create<SelectedDayState>()((set) => ({
  selectedDay: todayString(),
  setSelectedDay: (day) => set({ selectedDay: day }),
}));
