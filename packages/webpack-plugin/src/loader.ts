import { enhanceCode, normalizePath, parseSFC } from 'code-inspector-core';
import path from 'path';
// import { parse } from '@vue/compiler-sfc';

/**
 * @description inject line、column and path to VNode when webpack compiling .vue file
 * @type webpack.loader.Loader
 */
export default function WebpackCodeInspectorLoader(this: any, content: string) {
  this.cacheable && this.cacheable();
  const completePath = normalizePath(this.resourcePath); // 当前文件的绝对路径
  const root = normalizePath(this.rootContext ?? this.options.context ?? '');
  const filePath = normalizePath(path.relative(root, completePath));
  let params = new URLSearchParams(this.resource);

  const jsxExtList = ['.js', '.ts', '.jsx', '.tsx'];
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
    // 提取<script>标签内容
    const scriptContent = descriptor.script.content;
    const _scriptContent = enhanceCode({
      code: scriptContent,
      filePath,
      fileType: 'jsx',
    });
    content = content.replace(scriptContent, _scriptContent);
  } else if (isVue) {
    content = enhanceCode({ code: content, filePath, fileType: 'vue' });
  }

  return content;
}
