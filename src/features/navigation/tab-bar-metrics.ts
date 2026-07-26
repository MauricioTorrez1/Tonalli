/**
 * Measurements shared between the floating tab bar and the screens it overlays.
 *
 * These live apart from the component so a screen can reserve space without
 * importing the bar itself — that import would pull expo-router and the icon
 * set into modules (and test files) that have no other use for them.
 */

/** Height of the tab pill. */
export const TAB_BAR_HEIGHT = 60;

/** Diameter of the add button sitting beside it. */
export const ADD_BUTTON_SIZE = 60;

/**
 * Vertical space a scrolling screen must leave free at the bottom so its last
 * row is not covered by the bar. Screens add this to their safe-area inset.
 */
export const TAB_BAR_CLEARANCE = TAB_BAR_HEIGHT + 24;
