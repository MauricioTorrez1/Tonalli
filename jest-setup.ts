// Jest setup: mock the native modules used by the app so pure logic and
// component tests can run under Node without a device.

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
