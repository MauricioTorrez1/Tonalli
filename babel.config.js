module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // Metro serves the web bundle as a classic script, where an `import.meta`
      // token is a parse-time SyntaxError that aborts the whole bundle. Zustand's
      // `devtools` middleware ships `import.meta.env.MODE` and is pulled in by the
      // `zustand/middleware` barrel even though the app only uses `persist`.
      // Replace the meta-property with `{}`: devtools' guard reads `.env`, which
      // becomes `undefined` and no-ops. Harmless on native (import.meta is unused
      // there too), so no per-platform branching is needed.
      replaceImportMeta,
      // Reanimated's worklets plugin must be listed last.
      "react-native-worklets/plugin",
    ],
  };
};

/**
 * Babel plugin that rewrites every `import.meta` meta-property to an empty
 * object literal so the token never reaches the classic-script web bundle.
 *
 * @param {{ types: import("@babel/core").types }} babel - The Babel instance.
 * @returns {import("@babel/core").PluginObj} The plugin definition.
 */
function replaceImportMeta({ types: t }) {
  return {
    name: "replace-import-meta",
    visitor: {
      MetaProperty(path) {
        if (
          path.node.meta.name === "import" &&
          path.node.property.name === "meta"
        ) {
          path.replaceWith(t.objectExpression([]));
        }
      },
    },
  };
}
