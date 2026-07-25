import { fireEvent, render, screen } from "@testing-library/react-native";

import { TimelineNode } from "@/features/timeline/components/TimelineNode";
import type { Block } from "@/types/block";
import type { BlockStatus } from "@/features/timeline/utils/timeline-layout";

/** Minimal block factory for tests; overrides win over the defaults. */
function makeBlock(overrides: Partial<Block> = {}): Block {
  return {
    id: "00000000-0000-4000-8000-000000000000",
    title: "Deep work",
    day: "2026-07-24",
    startMinute: 540,
    endMinute: 600,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

/**
 * Render TimelineNode with sane defaults, returning the props' spies so each
 * test can assert on the callback it cares about. Overrides win over defaults.
 */
function renderNode(
  overrides: Partial<React.ComponentProps<typeof TimelineNode>> = {},
) {
  const onPress = jest.fn();
  const onLongPress = jest.fn();
  const onToggleComplete = jest.fn();
  const props = {
    block: makeBlock(),
    status: "upcoming" as BlockStatus,
    color: "sky" as const,
    icon: undefined,
    index: 0,
    // Skip the entrance animation so tests do not depend on timers.
    reducedMotion: true,
    hasPrev: false,
    hasNext: false,
    onPress,
    onLongPress,
    onToggleComplete,
    ...overrides,
  };
  render(<TimelineNode {...props} />);
  return { onPress, onLongPress, onToggleComplete };
}

describe("TimelineNode", () => {
  it("shows the block title and its formatted time range", () => {
    renderNode({ block: makeBlock({ title: "Deep work" }) });
    expect(screen.getByText("Deep work")).toBeTruthy();
    expect(screen.getByText("09:00 – 10:00")).toBeTruthy();
  });

  it("renders the icon on the rail pill, leaving the title on its own", () => {
    renderNode({ block: makeBlock({ title: "Gym" }), icon: "💪" });
    expect(screen.getByText("Gym")).toBeTruthy();
    expect(
      screen.getByText("💪", { includeHiddenElements: true }),
    ).toBeTruthy();
  });

  it("hides the pill icon from assistive tech", () => {
    // The emoji is decoration duplicating the category the label already
    // carries; a screen reader announcing "flexed biceps" before every block
    // title is noise. Querying without hidden elements is how that is
    // verified — if the pill ever loses accessibilityElementsHidden, this
    // finds the emoji and fails.
    renderNode({ block: makeBlock({ title: "Gym" }), icon: "💪" });
    expect(screen.queryByText("💪")).toBeNull();
  });

  it("renders the title alone when the block has no icon", () => {
    renderNode({ block: makeBlock({ title: "Gym" }), icon: undefined });
    expect(screen.getByText("Gym")).toBeTruthy();
    expect(
      screen.queryByText("💪", { includeHiddenElements: true }),
    ).toBeNull();
  });

  it("builds an accessibility label from title, spoken time, and status", () => {
    renderNode({
      block: makeBlock({ title: "Lunch" }),
      status: "current",
    });
    expect(
      screen.getByLabelText("Lunch, de 9:00 a 10:00, en curso"),
    ).toBeTruthy();
  });

  it("renders the checkbox unchecked and inviting completion when not done", () => {
    renderNode({ status: "upcoming" });
    const checkbox = screen.getByLabelText("Marcar como completado");
    expect(checkbox.props.accessibilityState.checked).toBe(false);
  });

  it("renders the checkbox checked when the block is completed", () => {
    renderNode({ status: "completed" });
    const checkbox = screen.getByLabelText("Marcar como pendiente");
    expect(checkbox.props.accessibilityState.checked).toBe(true);
  });

  it("fires onPress when the card is tapped", () => {
    const { onPress } = renderNode({ block: makeBlock({ title: "Read" }) });
    fireEvent.press(screen.getByLabelText(/^Read,/));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("fires onToggleComplete when the checkbox is tapped", () => {
    const { onToggleComplete } = renderNode({ status: "upcoming" });
    fireEvent.press(screen.getByLabelText("Marcar como completado"));
    expect(onToggleComplete).toHaveBeenCalledTimes(1);
  });
});
