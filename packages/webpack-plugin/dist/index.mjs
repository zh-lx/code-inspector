import { normalizePath as p, startServer as i, getInjectCode as h } from "code-inspector-core";
import d from "path";
const k = (n, t) => {
  var c;
  const s = (n == null ? void 0 : n.compiler) || n, e = (c = s == null ? void 0 : s.options) == null ? void 0 : c.module;
  ((e == null ? void 0 : e.rules) || (e == null ? void 0 : e.loaders) || []).push({
    test: /\.(vue|jsx|tsx)$/,
    use: [d.resolve(__dirname, "./loader.js")],
    enforce: "pre"
  }), typeof t == "function" && t();
}, l = (n, t) => {
  const s = n.lastIndexOf("</html>");
  return s > -1 && (n = n.slice(0, s) + `
${t}
` + n.slice(s)), n;
}, g = (n, t, s) => {
  const e = Object.keys(t).filter((o) => /\.html$/.test(o));
  e.length ? e.forEach((o) => {
    const c = t[o].source(), r = l(c, n);
    t[o] = {
      source: () => r,
      size: () => r.length
    };
  }) : s && s(
    new Error("webpack-code-inspector-plugin Cannot find output HTML file")
  );
};
class W {
  constructor(t) {
    this.options = t || {};
  }
  apply(t) {
    var e;
    if (((e = t == null ? void 0 : t.options) == null ? void 0 : e.mode) !== "development")
      return;
    const s = (o) => h(o, {
      ...this.options || {}
    });
    t.hooks && this.handleWebpackAbove4(t, s);
  }
  handleWebpackAbove4(t, s) {
    t.hooks.watchRun.tap("WebpackCodeInspectorLoader", k);
    const e = t.options.plugins.find((o) => o.constructor.name === "HtmlWebpackPlugin");
    e ? t.hooks.compilation.tap(
      "WebpackCodeInspectorPlugin",
      (o) => {
        let c = o.hooks.htmlWebpackPluginAfterHtmlProcessing;
        c || (c = e.constructor.getHooks(o).beforeEmit), c.tapAsync("WebpackCodeInspectorPlugin", (r, a) => {
          const u = p(o.options.context);
          i((f) => {
            r.html = l(r.html, s(f)), a(null, r);
          }, u);
        });
      }
    ) : t.hooks.emit.tapAsync(
      "WebpackCodeInspectorPlugin",
      (o, c) => {
        const r = p(o.options.context);
        i((a) => {
          const { assets: u } = o;
          g(s(a), u, c), c();
        }, r);
      }
    );
  }
  // todo: webpack3.x 版本 loader 添加 vc_path 后未注入到 dom
  // todo: webpack3.x 配合 html-webpack-plugin 一同使用
  // handleWebpackBelow3(compiler: any, getCode: (port: number) => string) {}
}
export {
  W as default
};
