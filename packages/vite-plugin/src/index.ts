import {
  enhanceCode,
  getInjectCode,
  startServer,
  normalizePath,
  CodeOptions,
} from 'code-inspector-core';
import path from 'path';
const PluginName = 'vite-code-inspector-plugin';
let rootPath = '';

interface Options extends CodeOptions {
  close?: boolean;
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
      if (options?.close) {
        return false;
      }
      const isDev = command === 'serve';
      return isDev;
    },
    async transform(code, id) {
      if (id.match('node_modules')) {
        return code;
      }
      if (!rootPath) {
        rootPath = process.cwd(); // 根路径
      }
      const [_completePath] = id.split('?', 2); // 当前文件的绝对路径
      const completePath = normalizePath(_completePath);
      const params = new URLSearchParams(id);

      const jsxExtList = ['.js', '.ts', '.jsx', '.tsx'];
      const jsxParamList = ['isJsx', 'isTsx', 'lang.jsx', 'lang.tsx'];
      const isJsx =
        jsxExtList.some((ext) => completePath.endsWith(ext)) ||
        (completePath.endsWith('.vue') &&
          (jsxParamList.some((param) => params.get(param) !== null) ||
            params.get('lang') === 'tsx' ||
            params.get('lang') === 'jsx'));

      const isVue =
        completePath.endsWith('.vue') &&
        params.get('type') !== 'style' &&
        params.get('raw') === null;

      const filePath = normalizePath(path.relative(rootPath, completePath)); // 相对路径
      if (isJsx) {
        code = await enhanceCode({
          code,
          filePath,
          fileType: 'jsx',
        });
      } else if (isVue) {
        code = await enhanceCode({
          code,
          filePath,
          fileType: 'vue',
        });
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
        }, rootPath, options.editor);
      });
      return html;
    },
  };
}
