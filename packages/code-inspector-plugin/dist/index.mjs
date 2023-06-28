const r = require("webpack-code-inspector-plugin"), { ViteCodeInspectorPlugin: n } = require("vite-code-inspector-plugin");
function u(e) {
  if (!(e != null && e.bundler)) {
    console.error(
      "Please specify the bundler in the options of CodeInspectorPlugin."
    );
    return;
  }
  return e.bundler === "webpack" ? new r(e) : n(e);
}
export {
  u as CodeInspectorPlugin
};
