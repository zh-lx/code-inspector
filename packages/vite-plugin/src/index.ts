import {
  transformCode,
  normalizePath,
  CodeOptions,
  getCodeWithWebComponent,
  RecordInfo,
  isJsTypeFile,
  isDev,
} from 'code-inspector-core';
const PluginName = 'vite-code-inspector-plugin';

interface Options extends CodeOptions {
  close?: boolean;
  output: string;
}

const jsxParamList = ['isJsx', 'isTsx', 'lang.jsx', 'lang.tsx'];

export function ViteCodeInspectorPlugin(options: Options) {
  const record: RecordInfo = {
    port: 0,
    entry: '',
    output: options.output,
  };
  return {
    name: PluginName,
    ...(options.enforcePre === false ? {} : { enforce: 'pre' as 'pre' }),
    apply(_, { command }) {
      return !options?.close && isDev(options.dev, command === 'serve');
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

      const { escapeTags = [] } = options || {};

      let fileType = '';
      if (
        isJsTypeFile(filePath) ||
        (filePath.endsWith('.vue') &&
          (jsxParamList.some((param) => params.get(param) !== null) ||
            params.get('lang') === 'tsx' ||
            params.get('lang') === 'jsx'))
      ) {
        // jsx 代码
        fileType = 'jsx';
      } else if (
        filePath.endsWith('.vue') &&
        params.get('type') !== 'style' &&
        params.get('raw') === null
      ) {
        // vue 代码
        fileType = 'vue';
      } else if (filePath.endsWith('.svelte')) {
        // svelte 代码
        fileType = 'svelte';
      }

      if (fileType) {
        return transformCode({
          content: code,
          filePath,
          fileType,
          escapeTags,
        });
      }

      return code;
    },
  };
}
