// Jest setup: mock the native modules used by the app so pure logic and
// component tests can run under Node without a device.

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Gesture Handler ships its own jest setup, which stubs the native module and
// registers the gesture components. Using it rather than hand-rolling one
// keeps the mock correct across upgrades.
require("react-native-gesture-handler/jestSetup");

// @gorhom/bottom-sheet ships a mock entry point that renders the sheet's
// content inline. Sheet chrome is third-party and not worth asserting on; what
// matters is that a sheet's body renders and its controls respond, which the
// official mock preserves.
jest.mock("@gorhom/bottom-sheet", () => require("@gorhom/bottom-sheet/mock"));

// @expo/vector-icons pulls in expo-font -> expo-asset, a native font-loading
// chain that does not resolve under a clean Node install (and triggers async
// state updates that warn about act()). Every icon set is replaced with a bare
// View carrying `testID="icon-<name>"`.
//
// It used to render nothing at all, which was fine when block icons were emoji
// — those were real Text nodes a test could find. Now that they are glyphs, a
// component rendering null would make "does this block show its icon?"
// unanswerable in a test. The testID keeps that assertable without pulling in
// the font machinery.
//
// No JSX here on purpose: nativewind's babel transform would inject an
// out-of-scope helper, which jest.mock hoisting forbids. `createElement` via a
// lazy require inside the factory is the way around that.
jest.mock(
  "@expo/vector-icons",
  () =>
    new Proxy(
      {},
      {
        get:
          () =>
          ({ name }: { name: string }) =>
            require("react").createElement(require("react-native").View, {
              testID: `icon-${name}`,
            }),
      },
    ),
);

// Reanimated pulls in native modules that do not exist under Node, and its
// shipped mock still imports the native FlatList (broken on Reanimated 4), so
// this one is hand-written: animated components render as their plain RN
// equivalents and every animation resolves instantly to its final value.
//
// This is an explicit object rather than a catch-all Proxy like the icon mock
// above, and the difference is deliberate. A Proxy would make a mistyped import
// return a plausible-looking stub, so a broken animation would pass CI. Icons
// are decoration and can fail silently; animation APIs are load-bearing and
// should fail loudly. The cost is that this list must grow when the app reaches
// for a new API — __tests__/reanimated-mock.test.ts is what makes that failure
// legible instead of surfacing as a confusing error in an unrelated component.
//
// Same no-JSX/createElement constraint as the icon mock applies here.
jest.mock("react-native-reanimated", () => {
  const RN = require("react-native");

  // Animation builders are used fluently, e.g. FadeInDown.delay(60).duration(250).
  // Every method returns the same object so any chain length resolves. `.build()`
  // is the exception: the real builders return a factory function there.
  const BUILDER_METHODS = [
    "delay",
    "duration",
    "springify",
    "damping",
    "stiffness",
    "mass",
    "easing",
    "withInitialValues",
    "withCallback",
    "reduceMotion",
    "randomDelay",
    "getDelay",
    "getDuration",
    "getDelayFunction",
  ];
  const chainable: Record<string, unknown> = {};
  for (const method of BUILDER_METHODS) {
    chainable[method] = () => chainable;
  }
  chainable.build = () => () => ({ initialValues: {}, animations: {} });

  // Reanimated 4 shared values support both `sv.value` and `sv.get()/sv.set()`.
  // Supporting both keeps the mock honest about which API the app may use.
  // The cast below is `as Function` rather than the precise
  // `as (current: T) => T` on purpose: jest's out-of-scope-variable guard walks
  // the type annotation inside an `as` expression and reads that signature's
  // parameter name as a reference to an undeclared variable, failing the whole
  // setup file. `Function` has no named parameters, so it slips past.
  function makeMutable<T>(initial: T) {
    const box = {
      value: initial,
      get: () => box.value,
      set: (next: T | ((current: T) => T)) => {
        box.value =
          typeof next === "function" ? (next as Function)(box.value) : next;
      },
    };
    return box;
  }

  // A real clamped, piecewise-linear implementation rather than a stub, so the
  // styles a component produces under test are meaningful enough to assert on.
  function interpolate(
    value: number,
    input: readonly number[],
    output: readonly number[],
  ): number {
    if (value <= input[0]) return output[0];
    const last = input.length - 1;
    if (value >= input[last]) return output[last];
    for (let i = 1; i <= last; i += 1) {
      if (value <= input[i]) {
        const progress = (value - input[i - 1]) / (input[i] - input[i - 1]);
        return output[i - 1] + progress * (output[i] - output[i - 1]);
      }
    }
    return output[last];
  }

  // Easing is only ever passed into animation config, which this mock discards,
  // so any shape resolves: Easing.out(Easing.quad), Easing.bezier(...), etc.
  const easingFn = () => 0;
  const Easing = new Proxy({}, { get: () => () => easingFn });

  const identity = <T>(fn: T) => fn;
  const noop = () => {};
  const evaluate = (factory: () => object) => {
    // A worklet may touch an API this mock does not model; an empty style is a
    // better failure than an exploded render.
    try {
      return factory();
    } catch {
      return {};
    }
  };

  return {
    __esModule: true,
    default: {
      View: RN.View,
      Text: RN.Text,
      ScrollView: RN.ScrollView,
      Image: RN.Image,
      FlatList: RN.FlatList,
      createAnimatedComponent: (component: unknown) => component,
    },

    // Hooks
    useSharedValue: makeMutable,
    useAnimatedStyle: evaluate,
    useAnimatedProps: evaluate,
    useDerivedValue: (factory: () => unknown) => makeMutable(factory()),
    useAnimatedRef: () => ({ current: null }),
    useAnimatedScrollHandler: () => noop,
    useAnimatedReaction: noop,
    useReducedMotion: () => false,

    // Animations return their settled value so a mocked useAnimatedStyle yields
    // the final, valid style. Completion callbacks are deliberately NOT invoked:
    // firing them synchronously would run runOnJS(setState) during render and
    // produce act() warnings.
    withTiming: (toValue: unknown) => toValue,
    withSpring: (toValue: unknown) => toValue,
    withDelay: (_duration: number, animation: unknown) => animation,
    withSequence: (...animations: unknown[]) =>
      animations[animations.length - 1],
    withRepeat: (animation: unknown) => animation,
    cancelAnimation: noop,

    // runOnJS must be identity, not a no-op: gesture callbacks call
    // runOnJS(setState)(value), and a no-op would swallow every state update.
    runOnJS: identity,
    runOnUI: identity,

    // Math
    interpolate,
    interpolateColor: (
      _value: number,
      _input: readonly number[],
      output: readonly string[],
    ) => output[0],
    clamp: (value: number, min: number, max: number) =>
      Math.min(Math.max(value, min), max),
    Extrapolation: { IDENTITY: "identity", CLAMP: "clamp", EXTEND: "extend" },
    Extrapolate: { IDENTITY: "identity", CLAMP: "clamp", EXTEND: "extend" },

    Easing,
    ReduceMotion: { System: "system", Always: "always", Never: "never" },
    makeMutable,
    isSharedValue: (value: unknown) =>
      typeof value === "object" && value !== null && "value" in value,
    LayoutAnimationConfig: ({ children }: { children?: unknown }) =>
      children ?? null,

    // Entering / exiting / layout builders
    FadeIn: chainable,
    FadeInDown: chainable,
    FadeInUp: chainable,
    FadeOut: chainable,
    SlideInDown: chainable,
    SlideOutDown: chainable,
    ZoomIn: chainable,
    ZoomOut: chainable,
    LinearTransition: chainable,
    CurvedTransition: chainable,
    FadingTransition: chainable,
    Layout: chainable,
  };
});
