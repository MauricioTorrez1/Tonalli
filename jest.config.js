/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest-setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // jest-expo's testMatch treats every file under __tests__ as a suite, so the
  // shared fixtures there would be collected and fail with "no tests".
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/__tests__/helpers/"],
  // Note: react-native-gesture-handler needs no entry here — the leading
  // `(jest-)?react-native` alternative is unanchored, so it already matches by
  // prefix. Only the @gorhom packages, which ship untranspiled ESM under a
  // scope this list does not otherwise cover, had to be added.
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|react-native-css-interop|@gorhom/bottom-sheet|@gorhom/portal|@react-native-async-storage/.*))",
  ],
};
