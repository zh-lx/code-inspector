import {
  transformCode,
  normalizePath,
  parseSFC,
  isJsTypeFile,
  getMappingFilePath,
  isExcludedFile,
} from '@code-inspector/core';

const jsxParamList = ['isJsx', 'isTsx', 'lang.jsx', 'lang.tsx'];

export default async function WebpackCodeInspectorLoader(content: string) {
  this.cacheable && this.cacheable(true);
  let filePath = normalizePath(this.resourcePath); // 当前文件的绝对路径
  let params = new URLSearchParams(this.resource.split('?')?.[1] || '');
  const options = this.query;
  let { escapeTags = [], mappings } = options || {};

  if (isExcludedFile(filePath, options)) {
    return content;
  }

  filePath = getMappingFilePath(filePath, mappings);

  // jsx 语法
  const isJSX =
    isJsTypeFile(filePath) ||
    (filePath.endsWith('.vue') &&
      jsxParamList.some((param) => params.get(param) !== null));
  if (isJSX) {
    return transformCode({
      content,
      filePath,
      fileType: 'jsx',
      escapeTags,
      pathType: options.pathType,
    });
  }

  // vue jsx
  const isJsxWithScript =
    filePath.endsWith('.vue') &&
    (params.get('lang') === 'tsx' || params.get('lang') === 'jsx');
  if (isJsxWithScript) {
    const { descriptor } = parseSFC(content, {
      sourceMap: false,
    });
    // 处理 <script> 标签内容
    // 注意：.vue 允许同时存在 <script> 和 <script setup>
    const scripts = [
      descriptor.script?.content,
      descriptor.scriptSetup?.content,
    ];
    for (const script of scripts) {
      if (!script) continue;
      const newScript = transformCode({
        content: script,
        filePath,
        fileType: 'jsx',
        escapeTags,
        pathType: options.pathType,
      });
      content = content.replace(script, newScript);
    }
    return content;
  }

  // vue
  const isVue =
    filePath.endsWith('.vue') &&
    params.get('type') !== 'style' &&
    params.get('type') !== 'script' &&
    params.get('raw') === null;
  const isHtmlVue =
    filePath.endsWith('.html') &&
    params.get('type') === 'template' &&
    params.has('vue');
  if (isVue || isHtmlVue) {
    return transformCode({
      content,
      filePath,
      fileType: 'vue',
      escapeTags,
      pathType: options.pathType,
    });
  }

  // svelte
  const isSvelte = filePath.endsWith('.svelte');
  if (isSvelte) {
    return transformCode({
      content,
      filePath,
      fileType: 'svelte',
      escapeTags,
      pathType: options.pathType,
    });
  }

  return content;
}
