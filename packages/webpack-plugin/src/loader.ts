import {
  transformCode,
  normalizePath,
  parseSFC,
  isJsTypeFile,
  getMappingFilePath,
} from 'code-inspector-core';

const jsxParamList = ['isJsx', 'isTsx', 'lang.jsx', 'lang.tsx'];

export default async function WebpackCodeInspectorLoader(content: string) {
  this.cacheable && this.cacheable(true);
  let filePath = normalizePath(this.resourcePath); // 当前文件的绝对路径
  let params = new URLSearchParams(this.resource);
  const options = this.query;
  const { escapeTags = [], mappings } = options || {};
  filePath = getMappingFilePath(filePath, mappings);

  // jsx 语法
  const isJSX =
    isJsTypeFile(filePath) ||
    (filePath.endsWith('.vue') &&
      jsxParamList.some((param) => params.get(param) !== null));
  if (isJSX) {
    return transformCode({ content, filePath, fileType: 'jsx', escapeTags });
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
  if (isVue) {
    return transformCode({ content, filePath, fileType: 'vue', escapeTags });
  }

  // svelte
  const isSvelte = filePath.endsWith('.svelte');
  if (isSvelte) {
    return transformCode({ content, filePath, fileType: 'svelte', escapeTags });
  }

  return content;
}
