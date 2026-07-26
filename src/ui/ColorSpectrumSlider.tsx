/**
 * A horizontal color slider: a gradient track with a draggable knob.
 *
 * The gradient is built from a row of flat `View` strips rather than a real
 * gradient fill. `expo-linear-gradient` would be one more native module to
 * carry — and to keep working on web — for something that, at 32 strips across
 * a phone's width, is about four pixels per step and reads as continuous.
 *
 * Position is tracked from raw touch responder events rather than
 * gesture-handler: this is a one-axis drag inside a bottom sheet whose own pan
 * gesture is already disabled, so there is no gesture to arbitrate with.
 */
import { useRef, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";

/** Strips used to fake the gradient. */
const STEPS = 32;
const TRACK_HEIGHT = 44;
const KNOB_SIZE = 32;

interface ColorSpectrumSliderProps {
  /** Current position along the track, 0 to 1. */
  value: number;
  onChange: (value: number) => void;
  /** Color of the track at a given position, 0 to 1. */
  colorAt: (position: number) => string;
  accessibilityLabel: string;
}

/**
 * Renders a draggable gradient track.
 *
 * @param value - Current position, 0 to 1.
 * @param onChange - Called with the new position as the knob moves.
 * @param colorAt - Maps a position to the color shown there.
 * @param accessibilityLabel - Names the slider for screen readers.
 */
export function ColorSpectrumSlider({
  value,
  onChange,
  colorAt,
  accessibilityLabel,
}: ColorSpectrumSliderProps) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);

  function handleLayout(event: LayoutChangeEvent) {
    const next = event.nativeEvent.layout.width;
    widthRef.current = next;
    setWidth(next);
  }

  function report(locationX: number) {
    const trackWidth = widthRef.current;
    if (trackWidth <= 0) {
      return;
    }
    onChange(Math.max(0, Math.min(1, locationX / trackWidth)));
  }

  const knobLeft = Math.max(
    0,
    Math.min(width - KNOB_SIZE, value * width - KNOB_SIZE / 2),
  );

  return (
    <View
      onLayout={handleLayout}
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(event) => report(event.nativeEvent.locationX)}
      onResponderMove={(event) => report(event.nativeEvent.locationX)}
      style={{ height: TRACK_HEIGHT, justifyContent: "center" }}
    >
      <View
        className="flex-row overflow-hidden rounded-full"
        style={{ height: TRACK_HEIGHT - 8 }}
        pointerEvents="none"
      >
        {Array.from({ length: STEPS }, (_, index) => (
          <View
            key={index}
            style={{
              flex: 1,
              backgroundColor: colorAt(index / (STEPS - 1)),
            }}
          />
        ))}
      </View>

      {width > 0 ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: knobLeft,
            width: KNOB_SIZE,
            height: KNOB_SIZE,
            borderRadius: KNOB_SIZE / 2,
            borderWidth: 3,
            borderColor: "#FFFFFF",
            backgroundColor: colorAt(value),
          }}
        />
      ) : null}
    </View>
  );
}
