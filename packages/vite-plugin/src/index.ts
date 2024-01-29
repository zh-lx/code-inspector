import {
  enhanceCode,
  normalizePath,
  CodeOptions,
  getServedCode,
  RecordInfo,
  isJsTypeFile,
} from 'code-inspector-core';
const PluginName = 'vite-code-inspector-plugin';

interface Options extends CodeOptions {
  close?: boolean;
}

const jsxParamList = ['isJsx', 'isTsx', 'lang.jsx', 'lang.tsx'];

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
      // 自定义 dev 环境判断
      let isDev: boolean;
      if (typeof options?.dev === 'function') {
        isDev = options?.dev();
      } else {
        isDev = options?.dev;
      }
      if (isDev === false) {
        return false;
      } else {
        return !!isDev || command === 'serve';
      }
    },
    async transform(code, id) {
      if (id.match('node_modules')) {
        return code;
      }

      // start server and inject client code to entry file
      code = await getServedCode(options, id, code, record);
      
      const [_completePath] = id.split('?', 2); // 当前文件的绝对路径
      const filePath = normalizePath(_completePath);
      const params = new URLSearchParams(id);
      // 仅对符合正则的生效
      if (options?.match && !options.match.test(filePath)) {
        return code;
      }

      // jsx
      const isJsx =
        isJsTypeFile(filePath) ||
        (filePath.endsWith('.vue') &&
          (jsxParamList.some((param) => params.get(param) !== null) ||
            params.get('lang') === 'tsx' ||
            params.get('lang') === 'jsx'));
      if (isJsx) {
        return enhanceCode({ content: code, filePath, fileType: 'jsx' });
      }

      // vue
      const isVue =
        filePath.endsWith('.vue') &&
        params.get('type') !== 'style' &&
        params.get('raw') === null;
      if (isVue) {
        return enhanceCode({ content: code, filePath, fileType: 'vue' });
      }

      // svelte
      const isSvelte = filePath.endsWith('.svelte');
      if (isSvelte) {
        return enhanceCode({ content: code, filePath, fileType: 'svelte' });
      }

      return code;
    },
  };
}
