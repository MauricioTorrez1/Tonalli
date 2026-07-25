/**
 * Guards the hand-written Reanimated mock in jest-setup.ts.
 *
 * That mock is an explicit allowlist, so reaching for an API it does not export
 * throws `undefined is not a function` deep inside whatever component used it —
 * a failure that reads as "this component is broken" rather than "the mock is
 * out of date". This suite fails first, with a name that says which it is.
 *
 * Add a case here whenever the app starts using a new Reanimated API.
 */
import Animated, {
  Easing,
  Extrapolation,
  FadeIn,
  FadeInDown,
  LinearTransition,
  ReduceMotion,
  clamp,
  interpolate,
  interpolateColor,
  runOnJS,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

describe("the reanimated mock", () => {
  it("exposes animated components and the createAnimatedComponent factory", () => {
    expect(Animated.View).toBeDefined();
    expect(Animated.Text).toBeDefined();
    expect(Animated.ScrollView).toBeDefined();
    // Identity, so an animated Pressable stays a plain Pressable under test and
    // existing fireEvent.press queries keep resolving.
    const component = () => null;
    expect(Animated.createAnimatedComponent(component)).toBe(component);
  });

  it("supports both shared-value APIs", () => {
    const shared = useSharedValue(0);

    shared.value = 5;
    expect(shared.value).toBe(5);
    expect(shared.get()).toBe(5);

    shared.set(10);
    expect(shared.get()).toBe(10);

    shared.set((current) => current + 1);
    expect(shared.get()).toBe(11);
  });

  it("settles animations to their final value", () => {
    expect(withTiming(1)).toBe(1);
    expect(withSpring(0.97)).toBe(0.97);
    expect(withDelay(200, 42)).toBe(42);
    expect(withRepeat(7)).toBe(7);
    // The last step of a sequence is where it comes to rest.
    expect(withSequence(1, 2, 3)).toBe(3);
  });

  it("keeps runOnJS an identity so state updates from worklets still fire", () => {
    const setState = jest.fn();

    runOnJS(setState)("value");

    expect(setState).toHaveBeenCalledWith("value");
  });

  it("interpolates linearly and clamps at both ends", () => {
    expect(interpolate(0.5, [0, 1], [0, 100])).toBe(50);
    expect(interpolate(-1, [0, 1], [0, 100])).toBe(0);
    expect(interpolate(2, [0, 1], [0, 100])).toBe(100);
    // Multi-segment ranges must pick the right segment.
    expect(interpolate(15, [0, 10, 20], [0, 100, 200])).toBe(150);
  });

  it("exposes the remaining math and config helpers", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(interpolateColor(0, [0, 1], ["#000000", "#ffffff"])).toBe("#000000");
    expect(Extrapolation.CLAMP).toBe("clamp");
    expect(ReduceMotion.System).toBe("system");
    // Easing is only ever handed to animation config the mock discards, so any
    // composition just has to resolve without throwing.
    expect(() => Easing.out(Easing.quad)).not.toThrow();
  });

  it("keeps entering and layout builders chainable to any depth", () => {
    expect(() => FadeInDown.delay(60).duration(250).springify()).not.toThrow();
    expect(() =>
      FadeIn.duration(300).easing(Easing.out(Easing.quad)),
    ).not.toThrow();
    expect(() => LinearTransition.duration(200)).not.toThrow();
    // The real builders return a factory from .build(), not another builder.
    expect(typeof FadeInDown.build()).toBe("function");
  });
});
