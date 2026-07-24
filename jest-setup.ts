// Jest setup: mock the native modules used by the app so pure logic and
// component tests can run under Node without a device.

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Reanimated pulls in native modules that do not exist under Node, and its
// shipped mock still imports the native FlatList (broken on Reanimated 4). This
// lightweight hand-written mock renders animated components as plain views and
// stubs the entrance-animation builders as no-op chainables — all component
// tests need, since entrance animations are visual, not behavioral.
jest.mock("react-native-reanimated", () => {
  const { View } = require("react-native");

  // Animation builders are used fluently, e.g. FadeInDown.delay(60).duration(250).
  // Every method returns the same object so any chain length resolves.
  const chainable: Record<string, unknown> = {};
  for (const method of ["delay", "duration", "springify", "build"]) {
    chainable[method] = () => chainable;
  }

  return {
    __esModule: true,
    default: {
      View,
      createAnimatedComponent: (component: unknown) => component,
    },
    FadeInDown: chainable,
    FadeIn: chainable,
    FadeOut: chainable,
  };
});
