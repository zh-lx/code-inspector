import {
  transformCode,
  CodeOptions,
  getCodeWithWebComponent,
  RecordInfo,
  isJsTypeFile,
  parseSFC,
  isDev,
} from 'code-inspector-core';
import fs from 'fs';
import path from 'path';

const PluginName = 'esbuild-code-inspector-plugin';

interface Options extends CodeOptions {
  close?: boolean;
  output: string;
}

export function EsbuildCodeInspectorPlugin(options: Options) {
  return {
    name: PluginName,
    setup(build) {
      // 判断开发环境
      if (options.close || !isDev(options.dev, false)) {
        return;
      }

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: options.output,
      };
      const { escapeTags = [] } = options;
      const cache = new Map<
        string,
        { originCode: string; output: { contents: string; loader: string } }
      >();

      // 监听文件变化
      build.onLoad(
        { filter: options.match || /\.(jsx|tsx|js|ts|mjs|mts)?$/ },
        async (args) => {
          const filePath = args.path;
          let originCode = await fs.promises.readFile(filePath, 'utf8');
          let result = cache.get(filePath);

          // 文件首次编译或者发生修改
          if (!result || result.originCode !== originCode) {

            // 注入交互代码
            let code = await getCodeWithWebComponent(
              options,
              filePath,
              originCode,
              record
            );

            let fileType = '';
            if (isJsTypeFile(filePath)) {
              fileType = 'jsx';
            } else if (filePath.endsWith('.svelte')) {
              fileType = 'svelte';
            }

            if (fileType) {
              code = transformCode({
                content: code,
                filePath,
                fileType,
                escapeTags,
              });
            } else if (filePath.endsWith('.vue')) {
              // vue 文件处理
              fileType = 'vue';
              const { descriptor } = parseSFC(code, {
                sourceMap: false,
              });
              const templateContent = transformCode({
                content: descriptor.template.content,
                filePath,
                fileType,
                escapeTags,
              });
              code = code.replace(descriptor.template.content, templateContent);
            } 

            const ext = path.extname(filePath).replace('.', '');
            result = { originCode, output: { contents: code, loader: ext } };
            cache.set(filePath, result);
          }

          return result.output;
        }
      );
    },
  };
}
