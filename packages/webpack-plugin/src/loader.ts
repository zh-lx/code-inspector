import {
  enhanceCode,
  normalizePath,
  parseSFC,
  isJsTypeFile,
} from 'code-inspector-core';

export default async function WebpackCodeInspectorLoader(content: string) {
  this.cacheable && this.cacheable(true);
  const filePath = normalizePath(this.resourcePath); // 当前文件的绝对路径
  let params = new URLSearchParams(this.resource);

  const jsxParamList = ['isJsx', 'isTsx', 'lang.jsx', 'lang.tsx'];

  const isJSX =
    isJsTypeFile(filePath) ||
    (filePath.endsWith('.vue') &&
      jsxParamList.some((param) => params.get(param) !== null));

  const isJsxWithScript =
    filePath.endsWith('.vue') &&
    (params.get('lang') === 'tsx' || params.get('lang') === 'jsx');

  const isVue =
    filePath.endsWith('.vue') &&
    params.get('type') !== 'style' &&
    params.get('type') !== 'script' &&
    params.get('raw') === null;

  if (isJSX) {
    content = enhanceCode({ code: content, filePath, fileType: 'jsx' });
  } else if (isJsxWithScript) {
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
      const newScript = enhanceCode({
        code: script,
        filePath,
        fileType: 'jsx',
      });
      content = content.replace(script, newScript);
    }
  } else if (isVue) {
    content = enhanceCode({ code: content, filePath, fileType: 'vue' });
  }

  return content;
}
