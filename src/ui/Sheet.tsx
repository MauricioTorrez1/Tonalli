/**
 * A bottom sheet, used for the block form's sub-decisions (date, time, repeat,
 * alerts, color and icon).
 *
 * Sheets rather than pushed screens because these are adjustments to something
 * the user is already looking at, not places to go. The block stays visible
 * behind the sheet, so changing its color or time never loses the context that
 * makes the choice meaningful.
 *
 * Wraps @gorhom/bottom-sheet, whose surfaces are styled through props rather
 * than className — the same situation useThemeColors was written for, so
 * colors are resolved from the palette here instead of registering another
 * NativeWind interop.
 */
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Feather } from "@expo/vector-icons";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { Pressable, Text, View } from "react-native";
import { Easing, ReduceMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemeColors } from "@/theme/useThemeColors";

// ReduceMotion.System hands the accessibility decision to Reanimated itself,
// which jumps straight to the final value when the OS setting is on. That is
// one source of truth instead of threading the app's own context in here.
const ANIMATION_CONFIG = {
  duration: 280,
  easing: Easing.out(Easing.cubic),
  reduceMotion: ReduceMotion.System,
};

export interface SheetHandle {
  open: () => void;
  close: () => void;
}

interface SheetProps {
  title: string;
  children: ReactNode;
  /**
   * Fixed heights, e.g. `["60%"]`. Omit to size the sheet to its content.
   *
   * Pass this when the body scrolls internally: dynamic sizing measures the
   * content, and a scrollable child reports whatever fits, which strands a
   * long grid at a fraction of the screen.
   */
  snapPoints?: (string | number)[];
  /** Called after the sheet finishes closing, however it was dismissed. */
  onClose?: () => void;
}

/**
 * A bottom sheet with a title bar, a close button, and a tap-to-dismiss
 * backdrop.
 *
 * Dragging the *body* does not dismiss the sheet
 * (`enableContentPanningGesture={false}`). Every one of these sheets holds
 * something scrollable — a time wheel, an icon grid — and with content panning
 * on, the sheet cannot tell a fast flick inside a nested ScrollView from a
 * drag on itself, so scrolling the hour column quickly threw the whole sheet
 * closed. Dismissal is now the close button, the backdrop, or a drag on the
 * handle: three deliberate targets instead of one ambiguous gesture.
 *
 * @param title - Heading shown at the top of the sheet.
 * @param children - The sheet's body.
 * @param snapPoints - Fixed heights; omit for content-sized.
 * @param onClose - Called once the sheet has finished closing.
 */
export const Sheet = forwardRef<SheetHandle, SheetProps>(function Sheet(
  { title, children, snapPoints, onClose },
  ref,
) {
  const sheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();

  useImperativeHandle(ref, () => ({
    open: () => sheetRef.current?.expand(),
    close: () => sheetRef.current?.close(),
  }));

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={0.6}
      />
    ),
    [],
  );

  const backgroundStyle = useMemo(
    () => ({ backgroundColor: themeColors.surface }),
    [themeColors.surface],
  );
  const handleIndicatorStyle = useMemo(
    () => ({ backgroundColor: themeColors.grabber }),
    [themeColors.grabber],
  );

  const header = (
    <View className="flex-row items-center justify-between px-5 pb-3 pt-1">
      <Text className="font-raleway-bold text-2xl text-ink dark:text-ink-inverse">
        {title}
      </Text>
      <Pressable
        onPress={() => sheetRef.current?.close()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Cerrar"
        className="h-9 w-9 items-center justify-center rounded-full bg-sand dark:bg-nightRaised"
      >
        <Feather name="x" size={20} color={themeColors.iconStrong} />
      </Pressable>
    </View>
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      enablePanDownToClose
      enableContentPanningGesture={false}
      enableDynamicSizing={snapPoints === undefined}
      snapPoints={snapPoints}
      animationConfigs={ANIMATION_CONFIG}
      backdropComponent={renderBackdrop}
      backgroundStyle={backgroundStyle}
      handleIndicatorStyle={handleIndicatorStyle}
      onClose={onClose}
    >
      {/* With fixed snap points the sheet has a height of its own, so the body
          fills it; with dynamic sizing BottomSheetView is what reports the
          measured height, and wrapping it in a flex container would defeat
          that. Hence the branch rather than one shared wrapper. */}
      {snapPoints === undefined ? (
        <BottomSheetView style={{ paddingBottom: insets.bottom + 24 }}>
          {header}
          {children}
        </BottomSheetView>
      ) : (
        <View style={{ flex: 1, paddingBottom: insets.bottom + 16 }}>
          {header}
          {children}
        </View>
      )}
    </BottomSheet>
  );
});
