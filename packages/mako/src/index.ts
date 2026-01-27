import {
  CodeOptions,
  RecordInfo,
  getCodeWithWebComponent,
  getMappingFilePath,
  isDev,
  isExcludedFile,
  isJsTypeFile,
  normalizePath,
  transformCode,
} from '@code-inspector/core';
import path from 'path';

interface Options extends CodeOptions {
  close?: boolean;
  output: string;
}

export function MakoCodeInspectorPlugin(options: Options): Record<string, any> {
  const record: RecordInfo = {
    port: 0,
    entry: '',
    output: options.output,
  };

  if (
    options.close ||
    !isDev(options.dev, process.env.NODE_ENV === 'development')
  ) {
    return {
      name: '@code-inspector/mako',
    };
  }

  return {
    name: '@code-inspector/mako',
    enforce: options.enforcePre === false ? 'post' : 'pre',
    transform: async (
      content: string,
      id: string
    ): Promise<{ content: string; type: string } | void> => {
      if (isExcludedFile(id, options) || id.includes('/.umi/')) {
        return;
      }
      /* v8 ignore next -- defensive fallback for undefined options */
      const { escapeTags = [], mappings, match } = options || {};
      if (match && !match.test(id)) {
        return;
      }

      const code = await getCodeWithWebComponent({
        options,
        file: id,
        code: content,
        record,
      });

      if (isJsTypeFile(id)) {
        const ext = path.extname(id).slice(1);
        let filePath = normalizePath(id);
        filePath = getMappingFilePath(filePath, mappings);
        const result = transformCode({
          content: code,
          filePath,
          fileType: 'jsx',
          escapeTags,
          pathType: options.pathType,
        });
        return { content: result, type: ext };
      }
    },
  };
}
