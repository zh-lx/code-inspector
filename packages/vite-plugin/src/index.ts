import {
  transformCode,
  normalizePath,
  CodeOptions,
  getCodeWithWebComponent,
  RecordInfo,
  isJsTypeFile,
  getEliminateVueWarningCode,
  getClientInjectCode,
  ViteVirtualModule_Client,
  ViteVirtualModule_EliminateVueWarning,
  startServer,
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
    nextJsEntry: '',
    ssrEntry: '',
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
    async resolveId(id) {
      if (!record.started) {
        await startServer(options, record);
      }
      if (id === ViteVirtualModule_EliminateVueWarning) {
        return `\0${ViteVirtualModule_EliminateVueWarning}`;
      } else if (id === ViteVirtualModule_Client) {
        return `\0${ViteVirtualModule_Client}`;
      }
      return null;
    },
    load(id) {
      if (id === `\0${ViteVirtualModule_EliminateVueWarning}`) {
        return getEliminateVueWarningCode();
      } else if (id === `\0${ViteVirtualModule_Client}`) {
        return getClientInjectCode(record.port, options);
      }
      return null;
    },
    async transform(code, id) {
      if (id.match('node_modules')) {
        return code;
      }

      // start server and inject client code to entry file
      code = await getCodeWithWebComponent(options, id, code, record);

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
        return transformCode({ content: code, filePath, fileType: 'jsx' });
      }

      // vue
      const isVue =
        filePath.endsWith('.vue') &&
        params.get('type') !== 'style' &&
        params.get('raw') === null;
      if (isVue) {
        return transformCode({ content: code, filePath, fileType: 'vue' });
      }

      // svelte
      const isSvelte = filePath.endsWith('.svelte');
      if (isSvelte) {
        return transformCode({ content: code, filePath, fileType: 'svelte' });
      }

      return code;
    },
  };
}
