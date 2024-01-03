import {
  enhanceCode,
  normalizePath,
  CodeOptions,
  getServedCode,
  RecordInfo
} from 'code-inspector-core';
import path from 'path';
const PluginName = 'vite-code-inspector-plugin';

let rootPath = '';
interface Options extends CodeOptions {
  close?: boolean;
}

export function ViteCodeInspectorPlugin(options?: Options) {
  const record: RecordInfo = {
    port: 0,
    entry: '',
    nextInjectedFile: '',
    useEffectFile: '',
    injectAll: false,
  }
  return {
    name: PluginName,
    ...(options.enforcePre === false ? {} : { enforce: 'pre' as 'pre' }),
    apply(_, { command }) {
      if (options?.close) {
        return false;
      }
      const isDev = command === 'serve';
      return isDev;
    },
    async transform(code, id) {
      if (!rootPath) {
        rootPath = process.cwd(); // 根路径
      }

      // start server and inject client code to entry file
      code = await getServedCode(options, rootPath, id, code, record);

      if (id.match('node_modules')) {
        return code;
      }
      const [_completePath] = id.split('?', 2); // 当前文件的绝对路径
      const completePath = normalizePath(_completePath);
      const params = new URLSearchParams(id);

      const jsxExtList = ['.js', '.ts', '.mjs', '.mts', '.jsx', '.tsx'];
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
    }
  };
}
