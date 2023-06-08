import {
  enhanceVueCode,
  getInjectCode,
  startServer,
  HotKey,
  normalizePath,
} from 'code-inspector-core';
import path from 'path';

const PluginName = 'vite-code-inspector-plugin';
let rootPath = '';

interface Options {
  hotKeys?: HotKey[] | false;
  showSwitch?: boolean;
  autoToggle?: boolean;
}

const replaceHtml = (html, code) => {
  const index = html.lastIndexOf('</html>');
  if (index > -1) {
    html = html.slice(0, index) + `\n${code}\n` + html.slice(index);
  }
  return html;
};

export function ViteCodeInspectorPlugin(options?: Options) {
  return {
    name: PluginName,
    enforce: 'pre' as 'pre',
    apply(_, { command }) {
      return command === 'serve';
    },
    async transform(code, id) {
      if (!rootPath) {
        rootPath = process.cwd(); // 根路径
      }
      const [_completePath] = id.split('?', 2); // 当前文件的绝对路径
      const completePath = normalizePath(_completePath);
      const params = new URLSearchParams(id);

      const isVueJsx =
        completePath.endsWith('.jsx') ||
        completePath.endsWith('.tsx') ||
        (completePath.endsWith('.vue') &&
          (params.get('isJsx') !== null ||
            params.get('lang.tsx') !== null ||
            params.get('lang.jsx') !== null ||
            params.get('lang') === 'tsx' ||
            params.get('lang') === 'jsx'));

      const isVue =
        completePath.endsWith('.vue') &&
        params.get('type') !== 'style' &&
        params.get('raw') === null;

      const filePath = normalizePath(path.relative(rootPath, completePath)); // 相对路径
      if (isVueJsx) {
        code = await enhanceVueCode(code, filePath, 'vue-jsx');
      } else if (isVue) {
        code = await enhanceVueCode(code, filePath, 'vue');
      }
      return code;
    },
    async transformIndexHtml(html) {
      html = await new Promise((resolve) => {
        startServer((port) => {
          const code = getInjectCode(port, {
            ...(options || {}),
          });
          html = replaceHtml(html, code);
          resolve(html);
        }, rootPath);
      });
      return html;
    },
  };
}
