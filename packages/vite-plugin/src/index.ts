import {
  enhanceCode,
  normalizePath,
  CodeOptions,
  getServedCode,
  RecordInfo,
  isJsTypeFile
} from 'code-inspector-core';
const PluginName = 'vite-code-inspector-plugin';

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
  };
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
      // start server and inject client code to entry file
      code = await getServedCode(options, id, code, record);

      if (id.match('node_modules')) {
        return code;
      }
      const [_completePath] = id.split('?', 2); // 当前文件的绝对路径
      const filePath = normalizePath(_completePath);
      const params = new URLSearchParams(id);

      const jsxParamList = ['isJsx', 'isTsx', 'lang.jsx', 'lang.tsx'];
      const isJsx =
      isJsTypeFile(filePath) ||
        (filePath.endsWith('.vue') &&
          (jsxParamList.some((param) => params.get(param) !== null) ||
            params.get('lang') === 'tsx' ||
            params.get('lang') === 'jsx'));

      const isVue =
        filePath.endsWith('.vue') &&
        params.get('type') !== 'style' &&
        params.get('raw') === null;

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
  };
}
