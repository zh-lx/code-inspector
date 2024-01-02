import {
  enhanceCode,
  normalizePath,
  parseSFC,
  getServedCode,
} from 'code-inspector-core';
import path from 'path';

/**
 * @description inject line、column and path to VNode when webpack compiling .vue file
 * @type webpack.loader.Loader
 */
export default async function WebpackCodeInspectorLoader(
  this: any,
  content: string
) {
  this.cacheable && this.cacheable();
  const completePath = normalizePath(this.resourcePath); // 当前文件的绝对路径
  const options = this.query;
  const rootPath = normalizePath(
    this.rootContext ?? this.options.context ?? ''
  );
  const filePath = normalizePath(path.relative(rootPath, completePath));
  let params = new URLSearchParams(this.resource);

  // start server and inject client code to entry file
  content = await getServedCode(options, rootPath, completePath, content);

  const jsxExtList = ['.js', '.ts', '.mjs', '.mts', '.jsx', '.tsx'];
  const jsxParamList = ['isJsx', 'isTsx', 'lang.jsx', 'lang.tsx'];

  const isJSX =
    jsxExtList.some((ext) => completePath.endsWith(ext)) ||
    (completePath.endsWith('.vue') &&
      jsxParamList.some((param) => params.get(param) !== null));

  const isJsxWithScript =
    completePath.endsWith('.vue') &&
    (params.get('lang') === 'tsx' || params.get('lang') === 'jsx');

  const isVue =
    completePath.endsWith('.vue') &&
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
