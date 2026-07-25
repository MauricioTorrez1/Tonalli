/**
 * A draggable bottom sheet, used for the block form's sub-decisions (time,
 * repeat, color and icon).
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
  /** Called after the sheet finishes closing, however it was dismissed. */
  onClose?: () => void;
}

/**
 * A bottom sheet with a title bar and a tap-to-dismiss backdrop.
 *
 * Height follows the content rather than fixed snap points: these sheets range
 * from a four-option segmented control to a full icon grid, and a shared snap
 * point would either crop the tall ones or strand the short ones halfway up
 * the screen.
 *
 * @param title - Heading shown at the top of the sheet.
 * @param children - The sheet's body.
 * @param onClose - Called once the sheet has finished closing.
 */
export const Sheet = forwardRef<SheetHandle, SheetProps>(function Sheet(
  { title, children, onClose },
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

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      enablePanDownToClose
      enableDynamicSizing
      animationConfigs={ANIMATION_CONFIG}
      backdropComponent={renderBackdrop}
      backgroundStyle={backgroundStyle}
      handleIndicatorStyle={handleIndicatorStyle}
      onClose={onClose}
    >
      <BottomSheetView style={{ paddingBottom: insets.bottom + 24 }}>
        <View className="flex-row items-center justify-between px-5 pb-2">
          <Text className="font-raleway-semibold text-base text-ink dark:text-ink-inverse">
            {title}
          </Text>
          <Pressable
            onPress={() => sheetRef.current?.close()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            className="h-8 w-8 items-center justify-center rounded-full bg-sand dark:bg-nightRaised"
          >
            <Feather name="x" size={16} color={themeColors.icon} />
          </Pressable>
        </View>
        {children}
      </BottomSheetView>
    </BottomSheet>
  );
});
