import { ViteCodeInspectorPlugin as n } from "vite-code-inspector-plugin";
function c(e) {
  if (!(e != null && e.bundler)) {
    console.error(
      "Please specify the bundler in the options of CodeInspectorPlugin."
    );
    return;
  }
  if (e.bundler === "webpack") {
    const r = require("webpack-code-inspector-plugin");
    return new r(e);
  } else
    return n(e);
}
export {
  c as CodeInspectorPlugin
};
