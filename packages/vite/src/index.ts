import {
  transformCode,
  normalizePath,
  CodeOptions,
  getCodeWithWebComponent,
  RecordInfo,
  isJsTypeFile,
  isDev,
  getMappingFilePath,
  isExcludedFile,
} from '@code-inspector/core';
const PluginName = '@code-inspector/vite';

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
    envDir: '',
  };
  return {
    name: PluginName,
    ...(options.enforcePre === false ? {} : { enforce: 'pre' as 'pre' }),
    apply(_, { command }) {
      return !options.close && isDev(options.dev, command === 'serve');
    },
    configResolved(config) {
      record.envDir = config.envDir || config.root;
    },
    async transform(code: string, id: string) {
      if (isExcludedFile(id, options)) {
        return code;
      }

      code = await getCodeWithWebComponent({
        options,
        file: id,
        code,
        record,
      });

      const { escapeTags = [], mappings } = options;

      const [_completePath, query] = id.split('?', 2); // 当前文件的绝对路径
      let filePath = normalizePath(_completePath);
      filePath = getMappingFilePath(filePath, mappings);
      const params = new URLSearchParams(query);
      // 仅对符合正则的生效
      if (options.match && !options.match.test(filePath)) {
        return code;
      }

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
        filePath.endsWith('.html') &&
        params.get('type') === 'template' &&
        params.has('vue')
      ) {
        // <template src="xxx.html"></template>
        fileType = 'vue';
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
          pathType: options.pathType,
        });
      }

      return code;
    },
    // 追加到 html 中，适配 MPA 项目
    async transformIndexHtml(html) {
      const code = await getCodeWithWebComponent({
        options: { ...options, importClient: 'code' },
        file: 'main.js',
        code: '',
        record,
        inject: true,
      });
      return html.replace(
        '<head>',
        `<head><script type="module">\n${code}\n</script>`
      );
    },
  };
}
