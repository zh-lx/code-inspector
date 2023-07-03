import { normalizePath as c, enhanceVueCode as l, startServer as g, getInjectCode as x } from "code-inspector-core";
import f from "path";
const v = "vite-code-inspector-plugin";
let i = "";
const m = (n, e) => {
  const t = n.lastIndexOf("</html>");
  return t > -1 && (n = n.slice(0, t) + `
${e}
` + n.slice(t)), n;
};
function w(n) {
  return {
    name: v,
    enforce: "pre",
    apply(e, { command: t }) {
      return t === "serve";
    },
    async transform(e, t) {
      i || (i = process.cwd());
      const [a] = t.split("?", 2), s = c(a), r = new URLSearchParams(t), u = s.endsWith(".jsx") || s.endsWith(".tsx") || s.endsWith(".vue") && (r.get("isJsx") !== null || r.get("lang.tsx") !== null || r.get("lang.jsx") !== null || r.get("lang") === "tsx" || r.get("lang") === "jsx"), p = s.endsWith(".vue") && r.get("type") !== "style" && r.get("raw") === null, o = c(f.relative(i, s));
      return u ? e = await l(e, o, "vue-jsx") : p && (e = await l(e, o, "vue")), e;
    },
    async transformIndexHtml(e) {
      return e = await new Promise((t) => {
        g((a) => {
          const s = x(a, {
            ...n || {}
          });
          e = m(e, s), t(e);
        }, i);
      }), e;
    }
  };
}
export {
  w as ViteCodeInspectorPlugin
};
