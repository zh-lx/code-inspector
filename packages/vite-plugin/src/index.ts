import {
  enhanceVueCode,
  getInjectCode,
  startServer,
  HotKey,
} from 'code-inspector-core';
import path from 'path';

const PluginName = 'vite-code-inspector-plugin';
let rootPath = '';

interface Options {
  hotKeys?: HotKey[];
  hideButton?: boolean;
  disableTriggerByKey?: boolean;
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
    async transform(code, id) {
      if (!rootPath) {
        rootPath = process.cwd(); // 根路径
      }
      const [completePath] = id.split('?', 2); // 当前文件的绝对路径
      const params = new URLSearchParams(id);
      const isTemplate =
        completePath.endsWith('.vue') && params.get('type') !== 'style';
      if (isTemplate) {
        const filePath = path.relative(rootPath, completePath); // 相对路径
        code = await enhanceVueCode(code, filePath);
      }
      return code;
    },
    async transformIndexHtml(html) {
      html = await new Promise((resolve) => {
        startServer((port) => {
          const code = getInjectCode(
            port,
            options?.hotKeys || undefined,
            options?.disableTriggerByKey,
            options?.hideButton
          );
          html = replaceHtml(html, code);
          resolve(html);
        }, rootPath);
      });
      return html;
    },
  };
}
