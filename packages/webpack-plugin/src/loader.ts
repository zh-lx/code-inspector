import { enhanceVueCode, normalizePath } from 'code-inspector-core';
import path from 'path';
import { parse } from '@vue/compiler-sfc'

/**
 * @description inject line、column and path to VNode when webpack compiling .vue file
 * @type webpack.loader.Loader
 */
function WebpackCodeInspectorLoader(
  this: any,
  content: string,
  map: string,
  cb: any
) {
  const completePath = normalizePath(this.resourcePath); // 当前文件的绝对路径
  const root = normalizePath(this.rootContext ?? this.options.context ?? '');
  const filePath = normalizePath(path.relative(root, completePath));
  let params = new URLSearchParams(this.resource);

  const isVueJsx =
    completePath.endsWith('.jsx') ||
    completePath.endsWith('.tsx') ||
    (completePath.endsWith('.vue') &&
      (params.get('isJsx') !== null ||
        params.get('lang.tsx') !== null));

  const isVueJsxWithScript =
    (completePath.endsWith('.vue') &&
      (params.get('lang') === 'tsx' ||
        params.get('lang') === 'jsx'));

  const isVue =
    completePath.endsWith('.vue') &&
    params.get('type') !== 'style' &&
    params.get('raw') === null;

  if (isVueJsx) {
    content = enhanceVueCode(content, filePath, 'vue-jsx');
  } else if (isVueJsxWithScript) {
    const { descriptor } = parse(content, {
      sourceMap: false
    });
    // 提取<script>标签内容
    const scriptContent = descriptor.script.content;
    const _scriptContent = enhanceVueCode(scriptContent, filePath, 'vue-jsx');
    content = content.replace(scriptContent, _scriptContent)
  } else if (isVue) {
    content = enhanceVueCode(content, filePath, 'vue');
  }

  return content;
}

export = WebpackCodeInspectorLoader;
